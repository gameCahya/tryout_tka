export interface DuitkuPaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  totalFee: number;
}

export interface DuitkuPaymentMethodsResponse {
  paymentFee: DuitkuPaymentMethod[];
}

export interface DuitkuTransactionRequest {
  merchantOrderId: string;
  paymentAmount: number;
  paymentMethod: string;
  productDetails: string;
  email: string;
  phoneNumber: string;
  customerName: string;
  expiryPeriod?: number;
}

export interface DuitkuTransactionResponse {
  statusCode: string;
  statusMessage: string;
  reference: string;
  paymentUrl: string;
  paymentName?: string;
  feeAmount?: number;
  vaNumber?: string;
  qrString?: string;
}

export interface DuitkuCallbackData {
  merchantOrderId: string;
  resultCode: string;
  amount: string;
  signature: string;
  reference: string;
  merchantUserId?: string;
}

export interface DuitkuStatusResponse {
  statusCode: string;
  statusMessage: string;
  reference: string;
  amount: string;
  fee: string;
  resultCode: string;
}

export interface Payment {
  id: string;
  user_id: string;
  tryout_id: string;
  merchant_order_id: string;
  reference: string | null;
  payment_method: string | null;
  payment_name: string | null;
  amount: number;
  fee: number;
  total_amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired';
  result_code: string | null;
  payment_url: string | null;
  va_number: string | null;
  qr_string: string | null;
  created_at: string;
  updated_at: string;
  expired_at: string | null;
  paid_at: string | null;
}

export interface CreatePaymentRequest {
  tryoutId: string;
  paymentMethod: string;
  phoneNumber: string;
}

export interface PaymentResponse {
  success: boolean;
  payment: Payment;
  paymentUrl?: string;
  reference?: string;
  vaNumber?: string;
  qrString?: string;
  message?: string;
}
