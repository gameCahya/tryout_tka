// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Duitku } from '@/lib/duitku';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tryoutId, userId, email, phoneNumber, customerName } = body;

    console.log('📥 Payment request received:', { tryoutId, userId, email });

    if (!tryoutId || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already paid
    const { data: existingPayment } = await supabase
      .from('unlocked_explanations')
      .select('payment_status')
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .single();

    if (existingPayment?.payment_status === 'success') {
      return NextResponse.json(
        { error: 'Pembahasan sudah terbuka' },
        { status: 400 }
      );
    }

    // Generate unique merchant order ID
    const timestamp = Date.now();
    const merchantOrderId = `UNLOCK-${tryoutId.substring(0, 8)}-${userId.substring(0, 8)}-${timestamp}`;

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
    const returnUrl = `${baseUrl}/history?payment=success&tryout_id=${tryoutId}`;

    console.log('🔵 Creating Duitku invoice:', {
      merchantOrderId,
      paymentAmount,
      callbackUrl,
      returnUrl,
    });

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

    if (!duitkuResponse.success || !duitkuResponse.data) {
      console.error('❌ Duitku error:', duitkuResponse.error);
      return NextResponse.json(
        { error: duitkuResponse.error || 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Type assertion after checking success and data existence
    const paymentData = duitkuResponse.data;

    console.log('✅ Duitku invoice created:', {
      reference: paymentData.reference,
      paymentUrl: paymentData.paymentUrl?.substring(0, 50) + '...',
    });

    // Calculate expiry time (60 minutes from now)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 60);

    // Save to database
    const { error: insertError } = await supabase
      .from('unlocked_explanations')
      .upsert({
        user_id: userId,
        tryout_id: tryoutId,
        merchant_order_id: merchantOrderId,
        payment_reference: paymentData.reference,
        payment_amount: paymentAmount,
        payment_status: 'pending',
        payment_url: paymentData.paymentUrl,
        va_number: paymentData.vaNumber || null,
        qr_string: paymentData.qrString || null,
        email,
        expired_at: expiredAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,tryout_id',
      });

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save payment data' },
        { status: 500 }
      );
    }

    console.log('✅ Payment saved to database');

    return NextResponse.json({
      success: true,
      data: {
        merchantOrderId,
        reference: paymentData.reference,
        paymentUrl: paymentData.paymentUrl,
        amount: paymentAmount,
        expiryTime: expiredAt.toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}