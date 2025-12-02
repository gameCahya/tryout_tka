'use client';

import React, { useState } from 'react';

interface DuitkuPaymentProps {
  amount: number;
  email: string;
  phoneNumber: string;
  customerName: string;
  productDetails?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

const DuitkuPaymentButton: React.FC<DuitkuPaymentProps> = ({
  amount,
  email,
  phoneNumber,
  customerName,
  productDetails = 'Product Purchase',
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/duitku/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantOrderId: `ORDER-${Date.now()}`,
          amount: amount,
          productDetails: productDetails,
          additionalParam: '',
          expiryPeriod: 60,
          customerVaName: customerName,
          email: email,
          phoneNumber: phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.paymentUrl) {
        // Redirect to Duitku payment page
        window.location.href = result.paymentUrl;
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.message || 'Failed to create payment');
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'An error occurred during payment initiation');
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="duitku-payment">
      <button
        onClick={initiatePayment}
        disabled={loading}
        className={`px-6 py-3 rounded-md font-medium text-white ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } transition-colors`}
      >
        {loading ? 'Processing...' : `Pay Rp ${amount.toLocaleString()}`}
      </button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default DuitkuPaymentButton;