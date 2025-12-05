'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Profile = {
  full_name: string;
  phone: string;
  school: string;
  role?: string;
};

type Tryout = {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
  created_at: string;
};

type UserProgress = {
  id: string;
  user_id: string;
  user_name: string;
  tryout_id: string;
  tryout_title: string;
  score: number | null;
  completed_at: string | null;
  total_questions: number;
  answered_questions: number;
};

export default function TeacherDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check if user has teacher role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, school, role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData || !['admin', 'teacher'].includes(profileData.role)) {
        // Redirect unauthorized users to user dashboard
        router.push('/dashboard/user');
        return;
      }

      // Fetch tryout list created by this teacher
      const { data: tryoutsData, error: tryoutsError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions, duration_minutes, created_at')
        .order('created_at', { ascending: false });

      if (tryoutsError) {
        console.error('Error fetching tryouts:', tryoutsError);
      }

      // Fetch user progress for tryouts created by this teacher
      const { data: progressData, error: progressError } = await supabase
        .from('tryout_results')
        .select(`
          id,
          user_id,
          tryout_id,
          score,
          completed_at,
          profiles:full_name,
          tryouts:title
        `)
        .not('user_id', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20); // Limit to last 20 results

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Transform progress data to match our type
      const transformedProgress = progressData?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'User',
        tryout_id: item.tryout_id,
        tryout_title: item.tryouts?.title || 'Tryout',
        score: item.score,
        completed_at: item.completed_at,
        total_questions: 0, // Will be filled later if needed
        answered_questions: 0, // Will be filled later if needed
      })) || [];

      setProfile(profileData);
      setTryouts(tryoutsData || []);
      setProgress(transformedProgress);
      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Guru
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selamat datang, {profile?.full_name}! 👋
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => router.push('/tryout/create')}
              className="flex items-center gap-2 bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors text-sm md:text-base"
            >
              <span>➕</span>
              <span>Buat Tryout</span>
            </button>
            
            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm md:text-base"
            >
              <span>📚</span>
              <span>History</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm md:text-base"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Teacher Profile Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {profile?.full_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Guru/Pembuat Soal
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">No HP</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile?.phone}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sekolah</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile?.school}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Akses</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <p className="font-medium text-purple-600 dark:text-purple-400">Guru</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100">Total Tryout</p>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold">{tryouts.length}</p>
            <p className="text-sm text-purple-100 mt-1">Tryout yang dibuat</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-indigo-100">Soal Tersedia</p>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-3xl font-bold">
              {tryouts.reduce((acc, t) => acc + t.total_questions, 0)}
            </p>
            <p className="text-sm text-indigo-100 mt-1">Total soal yang dibuat</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100">Siswa Aktif</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold">{new Set(progress.map(p => p.user_id)).size}</p>
            <p className="text-sm text-green-100 mt-1">Siswa mengerjakan tryout</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100">Tryout Diselesaikan</p>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold">
              {progress.filter(p => p.completed_at !== null).length}
            </p>
            <p className="text-sm text-blue-100 mt-1">Tryout selesai dikerjakan</p>
          </div>
        </div>

        {/* Tryout and Progress Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tryout List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Tryout Saya
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tryouts.length} tryout
              </span>
            </div>
            
            {tryouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-4xl mb-2">📭</div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Belum Ada Tryout
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Anda belum membuat tryout
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tryouts.slice(0, 5).map((tryout) => (
                  <div 
                    key={tryout.id} 
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {tryout.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>📝</span>
                            <span>{tryout.total_questions} soal</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>⏱️</span>
                            <span>{tryout.duration_minutes} menit</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/tryout/${tryout.id}/edit`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Progress Siswa
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {progress.length} hasil
              </span>
            </div>
            
            {progress.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Belum Ada Progress
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum ada siswa yang mengerjakan tryout
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {progress.slice(0, 5).map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.user_name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>📝</span>
                            <span>{item.tryout_title}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>📊</span>
                            {item.score !== null ? (
                              <span>{item.score}%</span>
                            ) : (
                              <span>Belum selesai</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>🕒</span>
                            {item.completed_at ? (
                              <span>{new Date(item.completed_at).toLocaleDateString('id-ID')}</span>
                            ) : (
                              <span>Belum selesai</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/tryout/${item.tryout_id}/results/${item.user_id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}