'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tryout = {
  id: string;
  title: string;
  total_questions: number;
};

type UserResult = {
  id: string;
  user_id: string;
  user_name: string;
  school: string;
  score: number;
  total_questions: number;
  percentage: number;
  duration_seconds: number;
  completed_at: string;
  correct_answers: number | null;
  wrong_answers: number | null;
};


export default function TryoutResultsPage() {
 const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;
  
  const [tryout, setTryout] = useState<Tryout | null>(null);
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTryoutResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check if user has teacher or admin role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        setError('Gagal memverifikasi akses pengguna');
        setLoading(false);
        return;
      }

      // Allow admin and teacher to view results
      if (!['admin', 'teacher'].includes(profileData.role)) {
        setError('Anda tidak memiliki akses untuk melihat hasil tryout');
        setLoading(false);
        return;
      }

      console.log('✅ User authorized:', profileData.role);

      // Fetch tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions')
        .eq('id', tryoutId)
        .single();

      if (tryoutError) {
        console.error('❌ Tryout error:', tryoutError);
        throw tryoutError;
      }
      
      console.log('✅ Tryout loaded:', tryoutData.title);
      setTryout(tryoutData);

      // Fetch results WITHOUT any user filter - Admin sees ALL results
      console.log('📊 Fetching all results for tryout:', tryoutId);
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select('id, user_id, score, total_questions, percentage, duration_seconds, completed_at, correct_answers, wrong_answers')
        .eq('tryout_id', tryoutId)
        .order('score', { ascending: false });

      if (resultsError) {
        console.error('❌ Results error:', resultsError);
        throw resultsError;
      }

      console.log('✅ Results found:', resultsData?.length || 0, 'entries');

      if (!resultsData || resultsData.length === 0) {
        console.log('⚠️ No results found');
        setResults([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(resultsData.map(r => r.user_id))];
      console.log('👥 Unique user IDs:', userIds);
      console.log('📋 Sample result user_ids:', resultsData.slice(0, 3).map(r => ({ id: r.id, user_id: r.user_id })));

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, school')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
      } else {
        console.log('✅ Profiles fetched:', profilesData?.length || 0);
        console.log('📝 Sample profiles:', profilesData?.slice(0, 3));
      }

      // Create a map of user profiles
      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      );

      console.log('🗺️ Profiles map size:', profilesMap.size);

      // Combine results with profiles
      const transformedResults: UserResult[] = resultsData.map(item => {
        const profile = profilesMap.get(item.user_id);
        console.log(`🔍 Mapping user_id ${item.user_id}:`, profile ? `Found - ${profile.full_name}` : 'NOT FOUND');
        return {
          id: item.id,
          user_id: item.user_id,
          user_name: profile?.full_name || 'Unknown User',
          school: profile?.school || 'Unknown School',
          score: item.score,
          total_questions: item.total_questions,
          percentage: item.percentage || 0,
          duration_seconds: item.duration_seconds,
          completed_at: item.completed_at,
          correct_answers: item.correct_answers,
          wrong_answers: item.wrong_answers,
        };
      });

      console.log('✅ Final transformed results:', transformedResults.length);
      console.log('📊 Sample transformed:', transformedResults.slice(0, 2).map(r => ({ 
        user_id: r.user_id, 
        user_name: r.user_name, 
        school: r.school 
      })));

      setResults(transformedResults);
    } catch (err: unknown) {
      console.error('Error fetching tryout results:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat hasil tryout');
    } finally {
      setLoading(false);
    }
  }, [tryoutId, router]);

   useEffect(() => {
    fetchTryoutResults();
  }, [fetchTryoutResults]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (percentage >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
    if (percentage >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat hasil tryout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchTryoutResults()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avgScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
    : 0;
  
  const highestScore = results.length > 0 
    ? Math.max(...results.map(r => r.percentage)) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hasil Tryout: {tryout?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {results.length} siswa telah mengerjakan
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100">Total Siswa</p>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold">{results.length}</p>
              <p className="text-sm text-blue-100 mt-1">Siswa</p>
            </div>
            
            <div className="bg-linear-to-brrom-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100">Selesai</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold">{results.length}</p>
              <p className="text-sm text-green-100 mt-1">Telah selesai</p>
            </div>
            
            <div className="bg-linear-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-yellow-100">Rata-rata</p>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold">{avgScore.toFixed(1)}%</p>
              <p className="text-sm text-yellow-100 mt-1">Nilai rata-rata</p>
            </div>
            
            <div className="bg-linear-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100">Tertinggi</p>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-3xl font-bold">{highestScore.toFixed(1)}%</p>
              <p className="text-sm text-purple-100 mt-1">Nilai tertinggi</p>
            </div>
          </div>

          {/* Results Table */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Daftar Siswa
            </h2>
            
            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                  Belum ada siswa yang mengerjakan tryout ini
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Hasil akan muncul setelah siswa menyelesaikan tryout
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nama Siswa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sekolah
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Skor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Persentase
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Durasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Waktu Selesai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.map((result, index) => (
                      <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                            {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                            {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              #{index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.user_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {result.school}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {result.score}/{result.total_questions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreBg(result.percentage)} ${getScoreColor(result.percentage)}`}>
                            {result.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(result.duration_seconds)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(result.completed_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}