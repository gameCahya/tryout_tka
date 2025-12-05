import { NextRequest, NextResponse } from 'next/server';
import { duitku } from '@/lib/duitku';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { CreatePaymentRequest, PaymentResponse } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body: CreatePaymentRequest = await request.json();
    const { tryoutId, paymentMethod, phoneNumber } = body;

    // Validate input
    if (!tryoutId || !paymentMethod || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: tryoutId, paymentMethod, phoneNumber' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!/^(08|628)\d{8,11}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Format nomor HP tidak valid. Contoh: 08123456789' },
        { status: 400 }
      );
    }

    // Check existing access
    const { data: existingAccess } = await supabaseAdmin
      .from('user_tryout_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('tryout_id', tryoutId)
      .single();

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki akses ke tryout ini' },
        { status: 400 }
      );
    }

    // Check pending payment
    const { data: pendingPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('tryout_id', tryoutId)
      .eq('status', 'pending')
      .gte('expired_at', new Date().toISOString())
      .single();

    if (pendingPayment) {
      const response: PaymentResponse = {
        success: true,
        payment: pendingPayment,
        paymentUrl: pendingPayment.payment_url || undefined,
        reference: pendingPayment.reference || undefined,
        vaNumber: pendingPayment.va_number || undefined,
        qrString: pendingPayment.qr_string || undefined,
        message: 'Anda masih memiliki pembayaran yang pending'
      };
      return NextResponse.json(response);
    }

    // Get tryout data
    const { data: tryout, error: tryoutError } = await supabaseAdmin
      .from('tryouts')
      .select('*')
      .eq('id', tryoutId)
      .single();

    if (tryoutError || !tryout) {
      return NextResponse.json(
        { error: 'Tryout tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!tryout.price || tryout.price <= 0) {
      return NextResponse.json(
        { error: 'Harga tryout tidak valid' },
        { status: 400 }
      );
    }

    // Generate merchant order ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const merchantOrderId = `TRY-${timestamp}-${randomStr}`;

    // Create transaction with Duitku
    const duitkuResponse: DuitkuTransactionResponse = await duitku.createTransaction({
      merchantOrderId,
      paymentAmount: tryout.price,
      paymentMethod,
      productDetails: `Tryout TKA - ${tryout.title}`,
      email: user.email!,
      phoneNumber,
      customerName: user.user_metadata?.full_name || user.email!.split('@')[0],
      expiryPeriod: 1440
    });

    if (duitkuResponse.statusCode !== '00') {
      return NextResponse.json(
        { error: duitkuResponse.statusMessage || 'Gagal membuat pembayaran' },
        { status: 400 }
      );
    }

    // Save to database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        tryout_id: tryoutId,
        merchant_order_id: merchantOrderId,
        reference: duitkuResponse.reference,
        payment_method: paymentMethod,
        payment_name: duitkuResponse.paymentName || paymentMethod,
        amount: tryout.price,
        fee: duitkuResponse.feeAmount || 0,
        total_amount: tryout.price + (duitkuResponse.feeAmount || 0),
        status: 'pending',
        payment_url: duitkuResponse.paymentUrl,
        va_number: duitkuResponse.vaNumber || null,
        qr_string: duitkuResponse.qrString || null,
        expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
      return NextResponse.json(
        { error: 'Gagal menyimpan data pembayaran' },
        { status: 500 }
      );
    }

    const response: PaymentResponse = {
      success: true,
      payment,
      paymentUrl: duitkuResponse.paymentUrl,
      reference: duitkuResponse.reference,
      vaNumber: duitkuResponse.vaNumber,
      qrString: duitkuResponse.qrString
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}