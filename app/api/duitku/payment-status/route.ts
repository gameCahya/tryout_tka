import { NextRequest } from 'next/server';
import DuitkuPayment from '@/lib/duitku';

export async function POST(request: NextRequest) {
  try {
    const duitku = new DuitkuPayment();
    const body = await request.json();
    
    const { merchantOrderId } = body;
    
    if (!merchantOrderId) {
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: 'merchantOrderId is required' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const result = await duitku.getPaymentStatus(merchantOrderId);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Duitku payment status error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'Failed to get payment status' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}