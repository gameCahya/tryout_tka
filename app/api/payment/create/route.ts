// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Duitku } from '@/lib/duitku';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tryoutId, userId, email, phoneNumber, customerName } = body;

    if (!tryoutId || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique merchant order ID
    const timestamp = Date.now();
    const merchantOrderId = `UNLOCK-${tryoutId}-${userId}-${timestamp}`;

    // Fixed amount for unlock explanation (Rp 15.000)
    const paymentAmount = 15000;

    // Get tryout info
    const { data: tryoutData, error: tryoutError } = await supabase
      .from('tryouts')
      .select('title')
      .eq('id', tryoutId)
      .single();

    if (tryoutError || !tryoutData) {
      return NextResponse.json(
        { error: 'Tryout not found' },
        { status: 404 }
      );
    }

    const productDetails = `Pembahasan Tryout: ${tryoutData.title}`;

    // Callback and return URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/payment/callback`;
    const returnUrl = `${baseUrl}/history/${tryoutId}/review?payment=success`;

    // Create invoice with Duitku
    const duitkuResponse = await Duitku.createInvoice({
      paymentAmount,
      merchantOrderId,
      productDetails,
      email,
      phoneNumber: phoneNumber || '08123456789',
      customerName: customerName || 'User',
      callbackUrl,
      returnUrl,
      expiryPeriod: 60, // 60 minutes
    });

    if (!duitkuResponse.success) {
      return NextResponse.json(
        { error: duitkuResponse.error || 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Calculate expiry time (60 minutes from now)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 60);

    // Save to database
    const { error: insertError } = await supabase
      .from('unlocked_explanations')
      .insert({
        user_id: userId,
        tryout_id: tryoutId,
        merchant_order_id: merchantOrderId,
        payment_reference: duitkuResponse.data.reference,
        payment_amount: paymentAmount,
        payment_status: 'pending',
        payment_url: duitkuResponse.data.paymentUrl,
        va_number: duitkuResponse.data.vaNumber,
        qr_string: duitkuResponse.data.qrString,
        email,
        expired_at: expiredAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save payment data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantOrderId,
        reference: duitkuResponse.data.reference,
        paymentUrl: duitkuResponse.data.paymentUrl,
        amount: paymentAmount,
        expiryTime: expiredAt.toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}