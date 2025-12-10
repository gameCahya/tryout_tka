'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type RankingData = {
  rank: number;
  user_id: string;
  full_name: string;
  school: string;
  phone: string;
  result_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  duration_seconds: number;
  correct_answers: number;
  wrong_answers: number;
  completed_at: string;
};

type TryoutInfo = {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
};

export default function TryoutRankingPage() {
  const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;

  const [tryout, setTryout] = useState<TryoutInfo | null>(null);
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking();
  }, [tryoutId]);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching ranking for tryout:', tryoutId);

      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error('Session error: ' + sessionError.message);
      }
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      console.log('User authenticated:', session.user.id);
      setCurrentUserId(session.user.id);

      // Get tryout info
      console.log('Fetching tryout info...');
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions, duration_minutes')
        .eq('id', tryoutId)
        .single();

      if (tryoutError) {
        console.error('Tryout error:', tryoutError);
        throw new Error('Gagal memuat info tryout: ' + tryoutError.message);
      }
      
      if (!tryoutData) {
        throw new Error('Tryout tidak ditemukan');
      }
      
      console.log('Tryout loaded:', tryoutData.title);
      setTryout(tryoutData);

      // Get ranking using RPC
      console.log('Calling RPC function get_tryout_ranking...');
      const { data: rankingData, error: rankingError } = await supabase
        .rpc('get_tryout_ranking', { p_tryout_id: tryoutId });

      if (rankingError) {
        console.error('RPC error:', rankingError);
        throw new Error('Gagal memuat ranking: ' + rankingError.message);
      }

      console.log('Ranking data received:', rankingData?.length || 0, 'entries');
      setRankings(rankingData || []);

    } catch (err: any) {
      console.error('Error in fetchRanking:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: 'from-yellow-400 to-yellow-600', text: 'Juara 1' };
    if (rank === 2) return { icon: '🥈', color: 'from-gray-300 to-gray-500', text: 'Juara 2' };
    if (rank === 3) return { icon: '🥉', color: 'from-orange-400 to-orange-600', text: 'Juara 3' };
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat ranking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Gagal Memuat Ranking
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchRanking()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUserRank = rankings.find(r => r.user_id === currentUserId);
  const topThree = rankings.slice(0, 3);
  const otherRankings = rankings.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center gap-1"
          >
            ← Kembali
          </button>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🏆 Ranking Tryout
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">{tryout?.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {rankings.length} peserta telah menyelesaikan tryout ini
            </p>
          </div>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-2xl shadow-xl mb-8 text-white">
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-2">Peringkat Anda</p>
              <div className="flex items-center justify-center gap-6">
                <div>
                  <p className="text-5xl font-bold">#{currentUserRank.rank}</p>
                  {getRankBadge(currentUserRank.rank) && (
                    <p className="text-sm mt-1">{getRankBadge(currentUserRank.rank)?.text}</p>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{currentUserRank.score}/{currentUserRank.total_questions}</p>
                  <p className="text-sm text-blue-100">Skor: {currentUserRank.percentage}%</p>
                  <p className="text-sm text-blue-100">Waktu: {formatDuration(currentUserRank.duration_seconds)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
              🏅 Top 3 Pemenang
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rank 2 */}
              {topThree[1] && (
                <div className="order-2 md:order-1">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-3">🥈</div>
                    <div className="text-5xl font-bold text-gray-700 dark:text-gray-200 mb-2">#2</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{topThree[1].full_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{topThree[1].school}</p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{topThree[1].score}/{topThree[1].total_questions}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{topThree[1].percentage}% • {formatDuration(topThree[1].duration_seconds)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {topThree[0] && (
                <div className="order-1 md:order-2 md:-mt-6">
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 p-8 rounded-2xl shadow-2xl text-center transform hover:scale-105 transition-transform">
                    <div className="text-7xl mb-3">🥇</div>
                    <div className="text-6xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">#1</div>
                    <h3 className="font-bold text-xl text-yellow-900 dark:text-white mb-1">{topThree[0].full_name}</h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-100 mb-4">{topThree[0].school}</p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{topThree[0].score}/{topThree[0].total_questions}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{topThree[0].percentage}% • {formatDuration(topThree[0].duration_seconds)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {topThree[2] && (
                <div className="order-3">
                  <div className="bg-gradient-to-br from-orange-300 to-orange-500 dark:from-orange-600 dark:to-orange-700 p-6 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-3">🥉</div>
                    <div className="text-5xl font-bold text-orange-900 dark:text-orange-100 mb-2">#3</div>
                    <h3 className="font-bold text-lg text-orange-900 dark:text-white mb-1">{topThree[2].full_name}</h3>
                    <p className="text-sm text-orange-800 dark:text-orange-100 mb-3">{topThree[2].school}</p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{topThree[2].score}/{topThree[2].total_questions}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{topThree[2].percentage}% • {formatDuration(topThree[2].duration_seconds)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Rankings */}
        {otherRankings.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              📊 Peringkat Lainnya
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Peringkat</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nama</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sekolah</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Skor</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Persentase</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {otherRankings.map((ranking) => (
                      <tr
                        key={ranking.result_id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          ranking.user_id === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">#{ranking.rank}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {ranking.full_name}
                            {ranking.user_id === currentUserId && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{ranking.school}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {ranking.score}/{ranking.total_questions}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            ranking.percentage >= 80
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : ranking.percentage >= 60
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {ranking.percentage}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(ranking.duration_seconds)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {rankings.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Belum Ada Data Ranking
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Belum ada peserta yang menyelesaikan tryout ini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}