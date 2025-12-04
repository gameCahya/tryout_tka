'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type PaymentStatus = 'checking' | 'success' | 'failed' | 'pending';

type PaymentContext = {
  merchantOrderId?: string;
  paymentUrl?: string | null;
  reviewPath?: string;
};

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [message, setMessage] = useState('Memverifikasi pembayaran...');
  const [details, setDetails] = useState({
    merchantOrderId: '-',
    amount: '-',
    reference: '-',
    resultCode: '-',
  });
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);

  const storedContext = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('lastPaymentContext');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PaymentContext;
    } catch (error) {
      console.warn('Failed to parse payment context:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    setPaymentContext(storedContext);
  }, [storedContext]);

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const merchantOrderId = searchParams.get('merchantOrderId') || storedContext?.merchantOrderId || '-';
    const amount = searchParams.get('amount') || '-';
    const reference = searchParams.get('reference') || '-';
    const statusMessage = searchParams.get('statusMessage');

    setDetails({
      merchantOrderId,
      amount,
      reference,
      resultCode: resultCode || '-',
    });

    if (!resultCode) return;

    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    if (resultCode === '00') {
      setStatus('success');
      setMessage('Pembayaran berhasil! Anda sekarang dapat melihat pembahasan.');
      
      redirectTimeout = setTimeout(() => {
        const destination = storedContext?.reviewPath || '/history';
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('lastPaymentContext');
        }
        router.push(destination);
      }, 3000);
    } else if (resultCode === '01') {
      setStatus('pending');
      setMessage(statusMessage || 'Pembayaran masih menunggu konfirmasi dari penyedia pembayaran.');
    } else {
      setStatus('failed');
      setMessage(statusMessage || 'Pembayaran gagal atau dibatalkan.');
    }

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [router, searchParams, storedContext]);

  const handleGoToReview = () => {
    const destination = paymentContext?.reviewPath || '/history';
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastPaymentContext');
    }
    router.push(destination);
  };

  const handleContinuePayment = () => {
    if (paymentContext?.paymentUrl) {
      window.location.href = paymentContext.paymentUrl;
    } else {
      handleGoToReview();
    }
  };

  const renderDetails = () => (
    <div className="mt-6 border-t pt-4 text-left text-sm text-gray-600">
      <p><span className="font-semibold text-gray-800">Order ID:</span> {details.merchantOrderId}</p>
      <p><span className="font-semibold text-gray-800">Jumlah:</span> {details.amount === '-' ? '-' : `Rp ${details.amount}`}</p>
      {details.reference !== '-' && (
        <p><span className="font-semibold text-gray-800">Reference:</span> {details.reference}</p>
      )}
      <p><span className="font-semibold text-gray-800">Kode Status:</span> {details.resultCode}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'checking' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Memverifikasi Pembayaran
            </h2>
            <p className="text-gray-600">{message}</p>
            {renderDetails()}
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Pembayaran Berhasil!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={handleGoToReview}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium mb-3"
            >
              Lihat Pembahasan Sekarang
            </button>
            <div className="text-sm text-gray-500">
              Mengalihkan otomatis dalam beberapa detik...
            </div>
            {renderDetails()}
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              Pembayaran Sedang Diproses
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleContinuePayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3"
            >
              Lanjutkan Pembayaran
            </button>
            <button
              onClick={handleGoToReview}
              className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Kembali ke Halaman Review
            </button>
            {renderDetails()}
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Pembayaran Gagal
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleGoToReview}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Kembali ke Halaman Review
            </button>
            {renderDetails()}
          </div>
        )}
      </div>
    </div>
  );
}