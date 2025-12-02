'use client';

import React, { useState } from 'react';
import DuitkuPaymentButton from '@/components/DuitkuPaymentButton';

const PaymentPage = () => {
  const [amount, setAmount] = useState(10000);
  const [email, setEmail] = useState('customer@example.com');
  const [phoneNumber, setPhoneNumber] = useState('081234567890');
  const [customerName, setCustomerName] = useState('John Doe');
  const [productDetails, setProductDetails] = useState('Sample Product');

  const handlePaymentSuccess = (response: any) => {
    console.log('Payment initiated successfully:', response);
    alert('Payment initiated successfully!');
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    alert('Payment failed: ' + error.message);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Duitku Payment Gateway</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Payment Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (Rp)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Details
            </label>
            <input
              type="text"
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <DuitkuPaymentButton
            amount={amount}
            email={email}
            phoneNumber={phoneNumber}
            customerName={customerName}
            productDetails={productDetails}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
      
      <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Integration Notes:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Make sure to set your DUITKU_MERCHANT_CODE and DUITKU_API_KEY in environment variables</li>
          <li>For sandbox testing, use the sandbox credentials from Duitku dashboard</li>
          <li>Set your notification URL to: {typeof window !== 'undefined' ? window.location.origin : ''}/api/duitku/notification</li>
          <li>Remember to verify payment status after receiving notification</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentPage;