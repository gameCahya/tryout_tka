import { NextRequest } from 'next/server';
import DuitkuPayment from '@/lib/duitku';

export async function POST(request: NextRequest) {
  try {
    const duitku = new DuitkuPayment();
    
    const body = await request.json();
    
    const paymentData = {
      merchantOrderId: body.merchantOrderId || `ORDER-${Date.now()}`,
      amount: body.amount,
      productDetails: body.productDetails || 'Product Purchase',
      additionalParam: body.additionalParam || '',
      expiryPeriod: body.expiryPeriod || 60, // in minutes
      customerVaName: body.customerVaName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      itemDetails: body.itemDetails,
      customerDetails: body.customerDetails
    };

    const result = await duitku.createPayment(paymentData);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Duitku create payment error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'Failed to create payment' 
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