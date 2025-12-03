import crypto from 'crypto';

interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  baseUrl: string;
}

class DuitkuPayment {
  private config: DuitkuConfig;

  constructor() {
    this.config = {
      merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
      apiKey: process.env.DUITKU_API_KEY || '',
      baseUrl: process.env.DUITKU_BASE_URL || 'https://sandbox.duitku.com'
    };

    if (!this.config.merchantCode || !this.config.apiKey) {
      throw new Error('DUITKU_MERCHANT_CODE and DUITKU_API_KEY must be set in environment variables');
    }
  }

  // Generate signature for payment request
  private generateSignature(amount: number, merchantOrderId: string): string {
    const signatureData = this.config.merchantCode + merchantOrderId + amount + this.config.apiKey;
    return crypto.createHash('sha256').update(signatureData).digest('hex');
  }

  // Create payment request
  async createPayment(payload: {
    merchantOrderId: string;
    amount: number;
    productDetails: string;
    additionalParam: string;
    expiryPeriod: number;
    customerVaName: string;
    email: string;
    phoneNumber: string;
    itemDetails?: Array<{
      name: string;
      price: number;
      quantity: number;
      productId?: string;
      sku?: string;
    }>;
    customerDetails?: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      billingAddress?: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        postalCode: string;
        phone: string;
        country: string;
      };
      shippingAddress?: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        postalCode: string;
        phone: string;
        country: string;
      };
    };
  }) {
    const {
      merchantOrderId,
      amount,
      productDetails,
      additionalParam,
      expiryPeriod,
      customerVaName,
      email,
      phoneNumber,
      itemDetails,
      customerDetails
    } = payload;

    const signature = this.generateSignature(amount, merchantOrderId);

    const paymentData = {
      merchantCode: this.config.merchantCode,
      paymentAmount: amount,
      merchantOrderId,
      productDetails,
      additionalParam,
      expiryPeriod,
      customerVaName,
      email,
      phoneNumber,
      itemDetails: itemDetails || [],
      customerDetails: customerDetails || {},
      signature
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/api/merchant/v2/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Duitku API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Duitku payment creation error:', error);
      
      // Handle the case where response is not JSON
      if (error.message && error.message.includes('Unexpected token')) {
        throw new Error('Received invalid response from Duitku API. This might be an HTML error page. Please check your Duitku configuration and credentials.');
      }
      
      throw error;
    }
  }

  // Verify payment notification
  async verifyNotification(notificationData: any): Promise<boolean> {
    const { merchantCode, amount, merchantOrderId, signature } = notificationData;
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHash('sha256')
      .update(`${merchantCode}${merchantOrderId}${amount}${this.config.apiKey}`)
      .digest('hex');

    return signature === expectedSignature;
  }

  // Get payment status
  async getPaymentStatus(merchantOrderId: string) {
    const signature = crypto
      .createHash('sha256')
      .update(`${this.config.merchantCode}${merchantOrderId}${this.config.apiKey}`)
      .digest('hex');

    const statusData = {
      merchantCode: this.config.merchantCode,
      merchantOrderId,
      signature
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/api/merchant/v2/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Duitku API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Duitku payment status error:', error);
      
      // Handle the case where response is not JSON
      if (error.message && error.message.includes('Unexpected token')) {
        throw new Error('Received invalid response from Duitku API. This might be an HTML error page. Please check your Duitku configuration and credentials.');
      }
      
      throw error;
    }
  }
}

export default DuitkuPayment;