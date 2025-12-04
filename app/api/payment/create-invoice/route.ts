import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, customerName, tryoutId } = await request.json();

    // Validasi input
    if (!tryoutId || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    const baseUrl = process.env.DUITKU_BASE_URL;
    
    // Get app URL from env or use request origin as fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`;

    if (!merchantCode || !apiKey || !baseUrl) {
      console.error('Missing required environment variables:', {
        hasMerchantCode: !!merchantCode,
        hasApiKey: !!apiKey,
        hasBaseUrl: !!baseUrl,
      });
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    // Generate unique order ID
    const merchantOrderId = `PEMBAHASAN-${tryoutId}-${Date.now()}`;
    const paymentAmount = 15000; // Rp 15.000
    const productDetails = 'Unlock Pembahasan Premium - Tryout';
    const paymentMethod = 'SP'; // Shopeepay, bisa diganti sesuai kebutuhan
    const returnUrl = `${appUrl}/payment/callback`;
    const callbackUrl = `${appUrl}/api/payment/callback`;
    const expiryPeriod = 60; // 60 menit

    // Generate signature
    const signature = crypto
      .createHash('md5')
      .update(`${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`)
      .digest('hex');

    // Request body untuk Duitku
    const requestBody = {
      merchantCode,
      paymentAmount,
      paymentMethod,
      merchantOrderId,
      productDetails,
      email,
      customerVaName: customerName || email,
      callbackUrl,
      returnUrl,
      signature,
      expiryPeriod,
    };

    // Cek apakah user sudah unlock tryout ini sebelumnya
    // Using count with specific column to avoid id column issue
    const { count: successCount, error: successError } = await supabase
      .from('unlocked_explanations')
      .select('payment_status', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .eq('payment_status', 'success');

    if (successError && successError.code !== '42703') {
      console.error('Error checking existing unlock:', successError);
      return NextResponse.json(
        { error: 'Failed to check unlock status' },
        { status: 500 }
      );
    }

    if (successCount && successCount > 0) {
      return NextResponse.json(
        { error: 'Pembahasan tryout ini sudah di-unlock sebelumnya' },
        { status: 400 }
      );
    }

    // Check for pending payments and return payment URL if exists
    const { data: pendingPayment, error: pendingError } = await supabase
      .from('unlocked_explanations')
      .select('payment_url, merchant_order_id, payment_status')
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .eq('payment_status', 'pending')
      .maybeSingle();

    if (pendingError && pendingError.code !== '42703') {
      console.error('Error checking pending unlock:', pendingError);
      return NextResponse.json(
        { error: 'Failed to check unlock status' },
        { status: 500 }
      );
    }

    if (pendingPayment && pendingPayment.payment_url) {
      return NextResponse.json({
        success: false,
        error: 'Anda masih memiliki pembayaran yang sedang diproses',
        pendingPayment: true,
        paymentUrl: pendingPayment.payment_url,
        merchantOrderId: pendingPayment.merchant_order_id,
      });
    }

    // Simpan atau perbarui pending unlock record
    const { data: unlockData, error: unlockError } = await supabase
      .from('unlocked_explanations')
      .upsert({
        user_id: userId,
        tryout_id: tryoutId,
        merchant_order_id: merchantOrderId,
        payment_amount: paymentAmount,
        payment_status: 'pending',
        payment_method: paymentMethod,
        email,
        payment_url: null,
        payment_reference: null,
        unlocked_at: null,
      }, { onConflict: 'user_id,tryout_id' })
      .select('merchant_order_id, user_id, tryout_id, payment_status')
      .single();

    if (unlockError) {
      console.error('Error creating unlock record:', unlockError);
      return NextResponse.json(
        { error: 'Failed to create unlock record' },
        { status: 500 }
      );
    }

    const duitkuResponse = await fetch(`${baseUrl}/api/merchant/v2/inquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await duitkuResponse.text();
    console.log('Duitku Response:', responseText);

    let duitkuData;
    try {
      duitkuData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Duitku response:', responseText);
      return NextResponse.json(
        { error: 'Invalid response from payment gateway' },
        { status: 500 }
      );
    }

    if (duitkuData.statusCode !== '00') {
      return NextResponse.json(
        { error: duitkuData.statusMessage || 'Failed to create payment' },
        { status: 400 }
      );
    }

    // Update unlock record dengan reference dari Duitku
    await supabase
      .from('unlocked_explanations')
      .update({
        payment_reference: duitkuData.reference,
        payment_url: duitkuData.paymentUrl,
      })
      .eq('merchant_order_id', merchantOrderId);

    return NextResponse.json({
      success: true,
      paymentUrl: duitkuData.paymentUrl,
      reference: duitkuData.reference,
      merchantOrderId,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}