// lib/duitku.ts
import crypto from 'crypto';

export class Duitku {
  private static merchantCode = process.env.NEXT_PUBLIC_DUITKU_MERCHANT_CODE;
  private static apiKey = process.env.DUITKU_API_KEY;
  private static merchantKey = process.env.DUITKU_MERCHANT_KEY;
  private static baseUrl = process.env.NEXT_PUBLIC_DUITKU_MODE === 'sandbox'
    ? process.env.DUITKU_PRODUCTION_URL
    : process.env.DUITKU_SANDBOX_URL;

  /**
   * Generate signature for Duitku API
   */
  static generateSignature(
    merchantOrderId: string,
    amount: number
  ): string {
    const signature = crypto
      .createHash('md5')
      .update(`${this.merchantCode}${merchantOrderId}${amount}${this.merchantKey}`)
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
      .update(`${merchantCode}${amount}${merchantOrderId}${this.merchantKey}`)
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
  }) {
    const {
      paymentAmount,
      merchantOrderId,
      productDetails,
      email,
      phoneNumber,
      customerName,
      callbackUrl,
      returnUrl,
      expiryPeriod = 60, // default 60 minutes
    } = params;

    const signature = this.generateSignature(merchantOrderId, paymentAmount);

    const requestBody = {
      merchantCode: this.merchantCode,
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

    try {
      const response = await fetch(`${this.baseUrl}/createInvoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.Message || 'Failed to create invoice');
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
      console.error('Duitku createInvoice error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create invoice',
      };
    }
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(merchantOrderId: string) {
    const signature = crypto
      .createHash('md5')
      .update(`${this.merchantCode}${merchantOrderId}${this.merchantKey}`)
      .digest('hex');

    try {
      const response = await fetch(`${this.baseUrl}/transactionStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantCode: this.merchantCode,
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