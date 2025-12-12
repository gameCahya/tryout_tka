// lib/duitku.ts
import crypto from 'crypto';

// Duitku Configuration
const config = {
  merchantCode: process.env.NEXT_PUBLIC_DUITKU_MERCHANT_CODE || '',
  apiKey: process.env.DUITKU_API_KEY || '',
  merchantKey: process.env.DUITKU_MERCHANT_KEY || '',
  baseUrl: process.env.NEXT_PUBLIC_DUITKU_MODE === 'production'
    ? 'https://passport.duitku.com/webapi/api/merchant'
    : 'https://sandbox.duitku.com/webapi/api/merchant',
};

export class Duitku {
  /**
   * Generate signature for Duitku API
   */
  static generateSignature(
    merchantOrderId: string,
    amount: number
  ): string {
    const signature = crypto
      .createHash('md5')
      .update(`${config.merchantCode}${merchantOrderId}${amount}${config.merchantKey}`)
      .digest('hex');
    return signature;
  }

  /**
   * Generate callback signature for verification
   */
  static generateCallbackSignature(
    merchantOrderId: string,
    amount: number,
    merchantCode: string
  ): string {
    const signature = crypto
      .createHash('md5')
      .update(`${merchantCode}${amount}${merchantOrderId}${config.merchantKey}`)
      .digest('hex');
    return signature;
  }

  /**
   * Create payment request to Duitku
   */
  static async createInvoice(params: {
    paymentAmount: number;
    merchantOrderId: string;
    productDetails: string;
    email: string;
    phoneNumber: string;
    customerName: string;
    callbackUrl: string;
    returnUrl: string;
    expiryPeriod?: number;
  }): Promise<
    | { success: true; data: { merchantOrderId: string; reference: string; paymentUrl: string; vaNumber?: string; qrString?: string; amount: number } }
    | { success: false; error: string; data?: never }
  > {
    const {
      paymentAmount,
      merchantOrderId,
      productDetails,
      email,
      phoneNumber,
      customerName,
      callbackUrl,
      returnUrl,
      expiryPeriod = 60,
    } = params;

    const signature = this.generateSignature(merchantOrderId, paymentAmount);

    const requestBody = {
      merchantCode: config.merchantCode,
      paymentAmount,
      merchantOrderId,
      productDetails,
      email,
      phoneNumber,
      customerVaName: customerName,
      callbackUrl,
      returnUrl,
      signature,
      expiryPeriod,
    };

    console.log('🔵 Duitku Request:', {
      merchantCode: config.merchantCode,
      merchantOrderId,
      paymentAmount,
      signature: signature.substring(0, 10) + '...',
    });

    try {
      const response = await fetch(`${config.baseUrl}/createInvoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log('🔵 Duitku Response:', {
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
        hasPaymentUrl: !!data.paymentUrl,
      });

      if (!response.ok || data.statusCode !== '00') {
        throw new Error(data.statusMessage || 'Failed to create invoice');
      }

      return {
        success: true,
        data: {
          merchantOrderId: data.merchantOrderId,
          reference: data.reference,
          paymentUrl: data.paymentUrl,
          vaNumber: data.vaNumber,
          qrString: data.qrString,
          amount: data.amount,
        },
      };
    } catch (error: any) {
      console.error('❌ Duitku createInvoice error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create invoice',
      };
    }
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(merchantOrderId: string): Promise<
    | { success: true; data: { merchantOrderId: string; reference: string; amount: number; fee: number; statusCode: string; statusMessage: string } }
    | { success: false; error: string; data?: never }
  > {
    const signature = crypto
      .createHash('md5')
      .update(`${config.merchantCode}${merchantOrderId}${config.merchantKey}`)
      .digest('hex');

    try {
      const response = await fetch(`${config.baseUrl}/transactionStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantCode: config.merchantCode,
          merchantOrderId,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.Message || 'Failed to check transaction status');
      }

      return {
        success: true,
        data: {
          merchantOrderId: data.merchantOrderId,
          reference: data.reference,
          amount: data.amount,
          fee: data.fee,
          statusCode: data.statusCode,
          statusMessage: data.statusMessage,
        },
      };
    } catch (error: any) {
      console.error('Duitku checkTransactionStatus error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check transaction status',
      };
    }
  }

  /**
   * Verify callback signature
   */
  static verifyCallbackSignature(
    merchantOrderId: string,
    amount: number,
    merchantCode: string,
    signatureFromCallback: string
  ): boolean {
    const calculatedSignature = this.generateCallbackSignature(
      merchantOrderId,
      amount,
      merchantCode
    );
    return calculatedSignature === signatureFromCallback;
  }
}