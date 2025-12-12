// app/api/payment/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const tryoutId = searchParams.get('tryoutId');

    if (!userId || !tryoutId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if user has already paid for this tryout
    const { data, error } = await supabase
      .from('unlocked_explanations')
      .select('*')
      .eq('user_id', userId)
      .eq('tryout_id', tryoutId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to check payment status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        hasPaid: false,
        status: null,
      });
    }

    return NextResponse.json({
      hasPaid: data.payment_status === 'success',
      status: data.payment_status,
      paymentUrl: data.payment_url,
      merchantOrderId: data.merchant_order_id,
      expiredAt: data.expired_at,
    });

  } catch (error: any) {
    console.error('Check payment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}