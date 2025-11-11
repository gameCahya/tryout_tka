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

        // Ambil results dulu
        const { data: results, error: resultsError } = await supabase
          .from('results')
          .select('id, tryout_id, score, total_questions, duration_seconds, completed_at')
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

        // Ambil tryout titles secara terpisah
        const tryoutIds = [...new Set(results.map(r => r.tryout_id))];
        const { data: tryouts, error: tryoutsError } = await supabase
          .from('tryouts')
          .select('id, title')
          .in('id', tryoutIds);

        if (tryoutsError) {
          throw tryoutsError;
        }

        // Map tryout titles
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
          has_paid: false, // TODO: nanti tambahkan logika payment
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
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const handleViewReview = (resultId: string, tryoutId: string) => {
    router.push(`/history/${resultId}/review?tryout_id=${tryoutId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat History</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">📚 History Tryout</h1>
          <p className="text-gray-600 mt-2">Lihat hasil tryout yang sudah Anda kerjakan</p>
        </div>

        {/* Stats Summary */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm">Total Tryout</p>
              <p className="text-2xl font-bold text-blue-600">{history.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-gray-600 text-sm">Rata-rata Skor</p>
              <p className="text-2xl font-bold text-green-600">
                {(history.reduce((sum, item) => sum + (item.score / item.total_questions) * 100, 0) / history.length).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm">Soal Dijawab</p>
              <p className="text-2xl font-bold text-purple-600">
                {history.reduce((sum, item) => sum + item.total_questions, 0)}
              </p>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada History</h2>
            <p className="text-gray-600 mb-6">Anda belum mengerjakan tryout apapun</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mulai Tryout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const percentage = parseFloat(getScorePercentage(item.score, item.total_questions));
              const scoreColorClass = getScoreColor(percentage);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      {/* Left Section */}
                      <div className="flex-1 mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {item.tryout_title}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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

                      {/* Right Section - Score */}
                      <div className="flex items-center gap-4">
                        <div className={`px-6 py-3 rounded-lg border-2 ${scoreColorClass}`}>
                          <p className="text-sm font-medium">Skor Anda</p>
                          <p className="text-3xl font-bold">
                            {item.score}/{item.total_questions}
                          </p>
                          <p className="text-sm font-medium">{percentage}%</p>
                        </div>

                        <button
                          onClick={() => handleViewReview(item.id, item.tryout_id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <span>Lihat Review</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 60 ? 'bg-blue-500' :
                            percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
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