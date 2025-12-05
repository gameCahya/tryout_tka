import crypto from 'crypto';
import type {
  DuitkuPaymentMethodsResponse,
  DuitkuTransactionRequest,
  DuitkuTransactionResponse,
  DuitkuStatusResponse
} from './types/payment';

export class DuitkuService {
  private merchantCode: string;
  private apiKey: string;
  private endpoint: string;
  private callbackUrl: string;
  private returnUrl: string;

  constructor() {
    this.merchantCode = process.env.DUITKU_MERCHANT_CODE || '';
    this.apiKey = process.env.DUITKU_API_KEY || '';
    this.endpoint = process.env.DUITKU_ENDPOINT || '';
    this.callbackUrl = process.env.DUITKU_CALLBACK_URL || '';
    this.returnUrl = process.env.DUITKU_RETURN_URL || '';

    // Validate required env variables
    if (!this.merchantCode || !this.apiKey || !this.endpoint) {
      throw new Error('Missing required Duitku environment variables');
    }
  }

  generateSignature(merchantOrderId: string, paymentAmount: number): string {
    const string = `${this.merchantCode}${merchantOrderId}${paymentAmount}${this.apiKey}`;
    return crypto.createHash('md5').update(string).digest('hex');
  }

  verifyCallbackSignature(
    merchantOrderId: string,
    amount: string,
    receivedSignature: string
  ): boolean {
    const string = `${this.merchantCode}${amount}${merchantOrderId}${this.apiKey}`;
    const calculatedSignature = crypto.createHash('md5').update(string).digest('hex');
    return calculatedSignature === receivedSignature;
  }

  async getPaymentMethods(amount: number): Promise<DuitkuPaymentMethodsResponse> {
    const datetime = new Date().getTime();
    const signature = crypto
      .createHash('md5')
      .update(`${this.merchantCode}${amount}${datetime}${this.apiKey}`)
      .digest('hex');

    const response = await fetch(
      `${this.endpoint}/merchant/paymentmethod/getpaymentmethod`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantcode: this.merchantCode,
          amount: amount,
          datetime: datetime,
          signature: signature
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    return response.json() as Promise<DuitkuPaymentMethodsResponse>;
  }

  async createTransaction(
    params: DuitkuTransactionRequest
  ): Promise<DuitkuPaymentMethodsResponse> {
    const {
      merchantOrderId,
      paymentAmount,
      paymentMethod,
      productDetails,
      email,
      phoneNumber,
      customerName,
      expiryPeriod = 1440
    } = params;

    const signature = this.generateSignature(merchantOrderId, paymentAmount);

    const payload = {
      merchantCode: this.merchantCode,
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      merchantOrderId: merchantOrderId,
      productDetails: productDetails,
      email: email,
      phoneNumber: phoneNumber,
      customerVaName: customerName,
      callbackUrl: this.callbackUrl,
      returnUrl: `${this.returnUrl}/${merchantOrderId}`,
      signature: signature,
      expiryPeriod: expiryPeriod
    };

    const response = await fetch(`${this.endpoint}/merchant/v2/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Message || 'Failed to create transaction');
    }

    return response.json() as Promise<DuitkuPaymentMethodsResponse>;
  }

  async checkTransactionStatus(merchantOrderId: string): Promise<DuitkuPaymentMethodsResponse> {
    const signature = crypto
      .createHash('md5')
      .update(`${this.merchantCode}${merchantOrderId}${this.apiKey}`)
      .digest('hex');

    const response = await fetch(`${this.endpoint}/merchant/transactionStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantCode: this.merchantCode,
        merchantOrderId: merchantOrderId,
        signature: signature
      })
    });

    if (!response.ok) {
      throw new Error('Failed to check transaction status');
    }

    return response.json() as Promise<DuitkuPaymentMethodsResponse>;
  }
}

export const duitku = new DuitkuService();