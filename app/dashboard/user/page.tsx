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
  start_time?: string | null; // Time when tryout becomes available (may not exist in DB yet)
  created_at: string;
};

export default function UserDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
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

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, school, role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        router.push('/auth/login');
        return;
      }

      // Get tryouts that are available based on time constraints
      const now = new Date().toISOString();
      
      // For users, only show tryouts that are either:
      // 1. Have a start_time that has passed (tryout is available after specific time)
      // 2. Or have no start_time (always available)
      // Note: Using a more flexible query that works whether start_time column exists or not
      const { data: tryoutsData, error: tryoutsError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions, duration_minutes, created_at')
        .order('created_at', { ascending: false });

      if (tryoutsError) {
        console.error('Error fetching tryouts:', tryoutsError);
      }

      // Filter tryouts based on start_time if available (for backward compatibility)
      let filteredTryouts = tryoutsData || [];
      const now = new Date();
      
      if (tryoutsData) {
        filteredTryouts = tryoutsData.filter(tryout => {
          // If start_time is not defined (column doesn't exist), show all tryouts
          if (tryout.start_time === undefined) {
            return true;
          }
          
          // If start_time is null, show the tryout
          if (!tryout.start_time) {
            return true;
          }
          
          // If start_time has passed, show the tryout
          const startTime = new Date(tryout.start_time);
          return startTime <= now;
        });
      }

      setProfile(profileData);
      setTryouts(filteredTryouts);
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
              Dashboard User
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selamat datang kembali! 👋
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-3">
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

        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {profile?.full_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Peserta Tryout
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="font-medium text-green-600 dark:text-green-400">Aktif</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100">Total Tryout Tersedia</p>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold">{tryouts.length}</p>
            <p className="text-sm text-blue-100 mt-1">Tryout yang dapat dikerjakan</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100">Soal Tersedia</p>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-3xl font-bold">
              {tryouts.reduce((acc, t) => acc + t.total_questions, 0)}
            </p>
            <p className="text-sm text-green-100 mt-1">Total soal di semua tryout</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100">Total Durasi</p>
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-3xl font-bold">
              {tryouts.reduce((acc, t) => acc + t.duration_minutes, 0)}
            </p>
            <p className="text-sm text-purple-100 mt-1">Menit pengerjaan</p>
          </div>
        </div>

        {/* Available Tryouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tryout Tersedia
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tryouts.length} tryout
            </span>
          </div>
          
          {tryouts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Belum Ada Tryout Tersedia
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Belum ada tryout yang tersedia saat ini. Silakan cek kembali nanti.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tryouts.map((tryout) => (
                <div 
                  key={tryout.id} 
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tryout.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm">
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
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/tryout/${tryout.id}`)}
                      className="flex-1 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                    >
                      Mulai Tryout
                    </button>
                    <button
                      onClick={() => router.push(`/tryout/${tryout.id}/info`)}
                      className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Info detail"
                    >
                      ℹ️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}