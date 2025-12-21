// app/api/payment-manual/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tryoutId = formData.get('tryoutId') as string;
    const paymentMethod = formData.get('paymentMethod') as string;
    const accountName = formData.get('accountName') as string;
    const paymentDate = formData.get('paymentDate') as string;

    if (!file || !tryoutId || !paymentMethod || !accountName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if already submitted
    const { data: existing } = await supabase
      .from('manual_payments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .single();

    if (existing && existing.status === 'approved') {
      return NextResponse.json(
        { error: 'Payment already approved' },
        { status: 400 }
      );
    }

    // Upload file to storage
    const fileName = `${userId}_${tryoutId}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(uploadData.path);

    const proofUrl = publicUrlData.publicUrl;

    // Save to database
    const paymentData = {
      user_id: userId,
      tryout_id: tryoutId,
      amount: 15000,
      payment_proof_url: proofUrl,
      payment_method: paymentMethod,
      account_name: accountName,
      payment_date: paymentDate || new Date().toISOString(),
      status: 'pending',
    };

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update(paymentData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('manual_payments')
        .insert(paymentData);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran berhasil diupload',
      proofUrl,
    });

  } catch (error: any) {
    console.error('Upload payment proof error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}