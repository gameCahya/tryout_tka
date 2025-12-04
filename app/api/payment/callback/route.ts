import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      merchantOrderId,
      amount,
      resultCode,
      merchantCode,
      reference,
      signature: receivedSignature,
    } = body;

    const apiKey = process.env.DUITKU_API_KEY!;

    // Verify signature
    const calculatedSignature = crypto
      .createHash('md5')
      .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
      .digest('hex');

    if (calculatedSignature !== receivedSignature) {
      console.error('Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Update payment status
    const status = resultCode === '00' ? 'success' : 'failed';
    
    const { data: unlockData, error: updateError } = await supabase
      .from('unlocked_explanations')
      .update({
        payment_status: status,
        payment_reference: reference,
        unlocked_at: status === 'success' ? new Date().toISOString() : null,
      })
      .eq('merchant_order_id', merchantOrderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating unlock record:', updateError);
      return NextResponse.json(
        { error: 'Failed to update unlock record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}