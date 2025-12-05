import { NextRequest, NextResponse } from 'next/server';
import { duitku } from '@/lib/duitku';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { merchantOrderId: string } }
) {
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

    const { merchantOrderId } = params;

    // Get payment from database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('merchant_order_id', merchantOrderId)
      .eq('user_id', user.id)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cross-check with Duitku if still pending
    if (payment.status === 'pending') {
      try {
        const duitkuStatus = await duitku.checkTransactionStatus(merchantOrderId);
        console.log('Duitku status check:', duitkuStatus);
        
        if (duitkuStatus.statusCode === '00') {
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'success',
              result_code: duitkuStatus.statusCode,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          await supabaseAdmin
            .from('user_tryout_access')
            .upsert({
              user_id: payment.user_id,
              tryout_id: payment.tryout_id,
              payment_id: payment.id,
              granted_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,tryout_id'
            });

          payment.status = 'success';
        }
      } catch (duitkuError) {
        console.error('Duitku check error:', duitkuError);
      }
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}