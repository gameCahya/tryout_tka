import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tryoutId = searchParams.get('tryoutId');
    const userId = searchParams.get('userId');

    if (!tryoutId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if user has unlocked this tryout (success status)
    const { data: successData, error: successError } = await supabase
      .from('unlocked_explanations')
      .select('payment_status, unlocked_at')
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .eq('payment_status', 'success')
      .maybeSingle();

    if (successError && successError.code !== 'PGRST116' && successError.code !== '42703') {
      console.error('Error checking unlock status:', successError);
      return NextResponse.json(
        { error: 'Failed to check unlock status' },
        { status: 500 }
      );
    }

    const hasAccess = successData?.payment_status === 'success' && successData.unlocked_at !== null;

    // Check for pending payment
    const { data: pendingData, error: pendingError } = await supabase
      .from('unlocked_explanations')
      .select('payment_status, payment_url, merchant_order_id')
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .eq('payment_status', 'pending')
      .maybeSingle();

    if (pendingError && pendingError.code !== 'PGRST116' && pendingError.code !== '42703') {
      console.error('Error checking pending payment:', pendingError);
    }

    const pendingPaymentUrl = pendingData?.payment_status === 'pending' ? pendingData.payment_url : null;
    const pendingMerchantOrderId = pendingData?.payment_status === 'pending' ? pendingData.merchant_order_id : null;

    return NextResponse.json({
      hasAccess,
      pendingPaymentUrl,
      pendingMerchantOrderId,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}