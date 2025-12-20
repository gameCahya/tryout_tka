'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type HistoryItem = {
  id: string;
  tryout_id: string;
  score: number;
  total_questions: number;
  duration_seconds: number;
  created_at: string;
  tryout_title: string;
  has_paid: boolean;
  attempt_number: number;  // ← Tambahan
  is_locked: boolean;      // ← Tambahan
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // ✅ Ambil results dengan attempt_number dan is_locked
        const { data: results, error: resultsError } = await supabase
          .from('results')
          .select('id, tryout_id, score, total_questions, duration_seconds, completed_at, attempt_number, is_locked')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false });

        if (resultsError) {
          throw resultsError;
        }

        if (!results || results.length === 0) {
          setHistory([]);
          setLoading(false);
          return;
        }

        // Ambil tryout titles
        const tryoutIds = [...new Set(results.map(r => r.tryout_id))];
        const { data: tryouts, error: tryoutsError } = await supabase
          .from('tryouts')
          .select('id, title')
          .in('id', tryoutIds);

        if (tryoutsError) {
          throw tryoutsError;
        }

        const tryoutMap = new Map(tryouts?.map(t => [t.id, t.title]) || []);

        // Transform data
        const historyData: HistoryItem[] = results.map((item) => ({
          id: item.id,
          tryout_id: item.tryout_id,
          score: item.score,
          total_questions: item.total_questions,
          duration_seconds: item.duration_seconds,
          created_at: item.completed_at,
          tryout_title: tryoutMap.get(item.tryout_id) || 'Tryout',
          has_paid: false,
          attempt_number: item.attempt_number || 1,
          is_locked: item.is_locked || false,
        }));

        setHistory(historyData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching history:', err);
        setError(err.message || 'Gagal memuat history');
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} menit ${secs} detik`;
  };

  const getScorePercentage = (score: number, total: number) => {
    return ((score / total) * 100).toFixed(1);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400';
    return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400';
  };

  const handleViewReview = (resultId: string, tryoutId: string) => {
    router.push(`/history/${resultId}/review?tryout_id=${tryoutId}`);
  };

  const handleViewRanking = (tryoutId: string) => {
    router.push(`/tryout/${tryoutId}/ranking`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Gagal Memuat History</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ✅ Group by tryout untuk tampilan yang lebih rapi
  const groupedHistory = history.reduce((acc, item) => {
    const key = item.tryout_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center"
          >
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📚 History Tryout</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Lihat hasil tryout yang sudah Anda kerjakan</p>
        </div>

        {/* Stats Summary */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Percobaan</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{history.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Rata-rata Skor</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(history.reduce((sum, item) => sum + (item.score / item.total_questions) * 100, 0) / history.length).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-purple-500">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Tryout Unik</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(groupedHistory).length}
              </p>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Belum Ada History</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Anda belum mengerjakan tryout apapun</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Mulai Tryout
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ✅ Tampilkan per tryout dengan semua attempt-nya */}
            {Object.entries(groupedHistory).map(([tryoutId, attempts]) => {
              const sortedAttempts = attempts.sort((a, b) => a.attempt_number - b.attempt_number);
              const firstAttempt = sortedAttempts[0];
              
              return (
                <div key={tryoutId} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Header Tryout */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                    <h3 className="text-xl font-bold text-white">
                      {firstAttempt.tryout_title}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {sortedAttempts.length} percobaan
                    </p>
                  </div>

                  {/* List Attempts */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedAttempts.map((item) => {
                      const percentage = parseFloat(getScorePercentage(item.score, item.total_questions));
                      const scoreColorClass = getScoreColor(percentage);

                      return (
                        <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Left Section */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {/* Badge Attempt */}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  item.is_locked 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {item.is_locked && '🔒 '}
                                  Percobaan #{item.attempt_number}
                                  {item.is_locked && ' • Ranking'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center">
                                  📅 {formatDate(item.created_at)}
                                </span>
                                <span className="flex items-center">
                                  ⏱️ {formatDuration(item.duration_seconds)}
                                </span>
                                <span className="flex items-center">
                                  📊 {item.total_questions} soal
                                </span>
                              </div>
                            </div>

                            {/* Right Section - Score & Actions */}
                            <div className="flex items-center gap-4">
                              <div className={`px-4 py-2 rounded-lg border-2 ${scoreColorClass}`}>
                                <p className="text-xs font-medium">Skor</p>
                                <p className="text-2xl font-bold">
                                  {item.score}/{item.total_questions}
                                </p>
                                <p className="text-xs font-medium">{percentage}%</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleViewReview(item.id, item.tryout_id)}
                                  className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                                >
                                  <span>📝</span>
                                  <span>Review</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  percentage >= 80 ? 'bg-green-500 dark:bg-green-400' :
                                  percentage >= 60 ? 'bg-blue-500 dark:bg-blue-400' :
                                  percentage >= 40 ? 'bg-yellow-500 dark:bg-yellow-400' : 
                                  'bg-red-500 dark:bg-red-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer - Ranking Button */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4">
                    <button
                      onClick={() => handleViewRanking(tryoutId)}
                      className="w-full bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🏆</span>
                      <span>Lihat Ranking Tryout Ini</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}