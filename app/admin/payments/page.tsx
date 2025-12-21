// app/admin/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type Payment = {
  id: string;
  user_id: string;
  tryout_id: string;
  amount: number;
  payment_proof_url: string;
  payment_method: string;
  account_name: string;
  payment_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string;
    school: string;
  };
  tryouts: {
    title: string;
  };
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPayments();
    }
  }, [filter]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
    fetchPayments();
  };

  const fetchPayments = async () => {
    let query = supabase
      .from('manual_payments')
      .select(`
        *,
        profiles:user_id (full_name, phone, school),
        tryouts:tryout_id (title)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setPayments(data);
    }
  };

  const handleApprove = async (paymentId: string, userId: string, tryoutId: string) => {
    if (!confirm('Approve pembayaran ini?')) return;

    setProcessingId(paymentId);

    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('manual_payments')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Unlock explanation access
      const { error: unlockError } = await supabase
        .from('unlocked_explanations')
        .upsert({
          user_id: userId,
          tryout_id: tryoutId,
          payment_status: 'success',
          unlocked_at: new Date().toISOString(),
          merchant_order_id: `MANUAL-${paymentId}`,
          payment_amount: 15000,
        });

      if (unlockError) throw unlockError;

      alert('Pembayaran berhasil diapprove!');
      fetchPayments();
    } catch (error: any) {
      console.error('Approve error:', error);
      alert('Gagal approve: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const notes = prompt('Alasan reject (opsional):');
    if (notes === null) return; // Cancelled

    setProcessingId(paymentId);

    try {
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'rejected',
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', paymentId);

      if (error) throw error;

      alert('Pembayaran ditolak');
      fetchPayments();
    } catch (error: any) {
      console.error('Reject error:', error);
      alert('Gagal reject: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Kembali
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                💳 Verifikasi Pembayaran Manual
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Kelola pembayaran manual dari pengguna
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg font-semibold">
                🔔 {pendingCount} pending
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' && '📋 Semua'}
              {status === 'pending' && '⏳ Pending'}
              {status === 'approved' && '✅ Approved'}
              {status === 'rejected' && '❌ Rejected'}
              {status === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 dark:text-gray-400">
              Tidak ada pembayaran {filter !== 'all' && filter}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  {/* Left: Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        {payment.profiles.full_name}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          📱 {payment.profiles.phone}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          🏫 {payment.profiles.school}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          📚 {payment.tryouts.title}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Metode:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {payment.payment_method}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Pengirim:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {payment.account_name}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Jumlah:</span>
                          <p className="font-bold text-blue-600 dark:text-blue-400">
                            Rp {payment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Tanggal:</span>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">
                            {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        payment.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : payment.status === 'approved'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {payment.status === 'pending' && '⏳ Menunggu Verifikasi'}
                        {payment.status === 'approved' && '✅ Approved'}
                        {payment.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </div>

                    {payment.admin_notes && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <strong>Catatan Admin:</strong> {payment.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Image */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bukti Transfer:
                    </p>
                    <a
                      href={payment.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={payment.payment_proof_url}
                        alt="Bukti Transfer"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-300 dark:border-gray-600 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Klik untuk melihat full size
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {payment.status === 'pending' && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 flex gap-3">
                    <button
                      onClick={() => handleApprove(payment.id, payment.user_id, payment.tryout_id)}
                      disabled={processingId === payment.id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {processingId === payment.id ? 'Processing...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(payment.id)}
                      disabled={processingId === payment.id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {processingId === payment.id ? 'Processing...' : '❌ Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}