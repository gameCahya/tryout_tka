// app/api/payment/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Duitku } from '@/lib/duitku';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      merchantOrderId,
      amount,
      merchantCode,
      signature,
      resultCode,
      reference,
    } = body;

    console.log('Payment callback received:', {
      merchantOrderId,
      amount,
      resultCode,
      reference,
    });

    // Verify signature
    const isValid = Duitku.verifyCallbackSignature(
      merchantOrderId,
      amount,
      merchantCode,
      signature
    );

    if (!isValid) {
      console.error('Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Determine payment status based on resultCode
    let paymentStatus: 'pending' | 'success' | 'failed' | 'expired' = 'pending';
    
    if (resultCode === '00') {
      paymentStatus = 'success';
    } else if (resultCode === '01') {
      paymentStatus = 'pending';
    } else {
      paymentStatus = 'failed';
    }

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('unlocked_explanations')
      .update({
        payment_status: paymentStatus,
        payment_reference: reference,
        updated_at: new Date().toISOString(),
        ...(paymentStatus === 'success' && { unlocked_at: new Date().toISOString() }),
      })
      .eq('merchant_order_id', merchantOrderId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    console.log('Payment status updated successfully:', {
      merchantOrderId,
      paymentStatus,
    });

    // Return success response to Duitku
    return NextResponse.json({
      success: true,
      message: 'Payment callback processed',
    });

  } catch (error: any) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}