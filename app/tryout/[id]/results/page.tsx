'use client';

import { useState, useEffect } from 'react';
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
  score: number | null;
  completed_at: string | null;
  started_at: string | null;
};

export default function TryoutResultsPage() {
  const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;
  
  const [tryout, setTryout] = useState<Tryout | null>(null);
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTryoutResults();
  }, [tryoutId]);

  const fetchTryoutResults = async () => {
    setLoading(true);
    setError(null);

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Sesi tidak ditemukan, silakan login kembali');
      setLoading(false);
      return;
    }

    // Check if user has teacher or admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData || !['admin', 'teacher'].includes(profileData.role)) {
      setError('Anda tidak memiliki akses untuk melihat hasil tryout');
      setLoading(false);
      return;
    }

    try {
      // Fetch tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions')
        .eq('id', tryoutId)
        .single();

      if (tryoutError) throw tryoutError;

      // Fetch results with user information
      const { data: resultsData, error: resultsError } = await supabase
        .from('tryout_results')
        .select(`
          id,
          user_id,
          score,
          completed_at,
          started_at,
          profiles:full_name
        `)
        .eq('tryout_id', tryoutId)
        .order('completed_at', { ascending: false });

      if (resultsError) throw resultsError;

      // Transform data to match our type
      const transformedResults = resultsData?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'User',
        score: item.score,
        completed_at: item.completed_at,
        started_at: item.started_at,
      })) || [];

      setTryout(tryoutData);
      setResults(transformedResults);
    } catch (err: any) {
      console.error('Error fetching tryout results:', err);
      setError(err.message || 'Gagal memuat hasil tryout');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100">Total Siswa</p>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold">{results.length}</p>
              <p className="text-sm text-blue-100 mt-1">Siswa</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100">Selesai</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold">{results.filter(r => r.completed_at).length}</p>
              <p className="text-sm text-green-100 mt-1">Telah selesai</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-yellow-100">Rata-rata</p>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold">
                {results.length > 0 
                  ? Math.round(results.filter(r => r.score !== null).reduce((sum, r) => sum + (r.score || 0), 0) / results.filter(r => r.score !== null).length) 
                  : 0}%
              </p>
              <p className="text-sm text-yellow-100 mt-1">Nilai rata-rata</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100">Tertinggi</p>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-3xl font-bold">
                {results.length > 0 
                  ? Math.max(...results.filter(r => r.score !== null).map(r => r.score || 0)) 
                  : 0}%
              </p>
              <p className="text-sm text-purple-100 mt-1">Nilai tertinggi</p>
            </div>
          </div>

          {/* Results Table */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Daftar Siswa
            </h2>
            
            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Belum ada siswa yang mengerjakan tryout ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nilai
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Waktu Selesai
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.user_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            result.completed_at 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
                          }`}>
                            {result.completed_at ? 'Selesai' : 'Belum Selesai'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {result.score !== null ? `${result.score}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {result.completed_at 
                            ? new Date(result.completed_at).toLocaleDateString('id-ID') 
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => router.push(`/tryout/${tryoutId}/results/${result.user_id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            Detail
                          </button>
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