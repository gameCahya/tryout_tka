import { NextRequest, NextResponse } from 'next/server';
import { duitku } from '@/lib/duitku';
import { supabaseAdmin } from '@/lib/supabase';
import type { DuitkuCallbackData } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const body: DuitkuCallbackData = await request.json();
    const { merchantOrderId, resultCode, amount, signature } = body;

    console.log('=== Duitku Callback ===');
    console.log('Body:', body);

    if (!merchantOrderId || !signature) {
      return NextResponse.json(
        { error: 'Missing required callback parameters' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = duitku.verifyCallbackSignature(
      merchantOrderId,
      amount,
      signature
    );

    if (!isValid) {
      console.error('Invalid signature!');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Signature verified ✓');

    // Get payment
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('merchant_order_id', merchantOrderId)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', merchantOrderId);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    const newStatus = resultCode === '00' ? 'success' : 'failed';
    
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: newStatus,
        result_code: resultCode,
        paid_at: resultCode === '00' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    console.log(`Payment updated: ${newStatus}`);

    // Grant access if successful
    if (resultCode === '00') {
      const { error: accessError } = await supabaseAdmin
        .from('user_tryout_access')
        .upsert({
          user_id: payment.user_id,
          tryout_id: payment.tryout_id,
          payment_id: payment.id,
          granted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tryout_id'
        });

      if (accessError && accessError.code !== '23505') {
        console.error('Error granting access:', accessError);
      } else {
        console.log('Access granted ✓');
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}