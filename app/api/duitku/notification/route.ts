import { NextRequest } from 'next/server';
import DuitkuPayment from '@/lib/duitku';

export async function POST(request: NextRequest) {
  try {
    const duitku = new DuitkuPayment();
    const body = await request.json();
    
    // Verify the notification signature
    const isValid = await duitku.verifyNotification(body);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Invalid signature' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Process the payment notification based on status
    const { paymentStatus, merchantOrderId, amount } = body;
    
    // Here you can update your database based on payment status
    switch (paymentStatus) {
      case '00': // Success
        console.log(`Payment successful for order: ${merchantOrderId}, amount: ${amount}`);
        // Update your database to mark payment as successful
        break;
      case '01': // Pending
        console.log(`Payment pending for order: ${merchantOrderId}, amount: ${amount}`);
        // Update your database to mark payment as pending
        break;
      case '02': // Cancelled
        console.log(`Payment cancelled for order: ${merchantOrderId}, amount: ${amount}`);
        // Update your database to mark payment as cancelled
        break;
      default:
        console.log(`Unknown payment status for order: ${merchantOrderId}, status: ${paymentStatus}`);
    }
    
    // Return success response to Duitku
    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'Notification received'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error('Duitku notification error:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Failed to process notification' 
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