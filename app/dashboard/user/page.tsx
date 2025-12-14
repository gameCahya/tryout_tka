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
  start_time: string | null;
  end_time: string | null;
  price: number;
  school: string | null;
  is_shared: boolean;
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

      // Check if user is not an admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, school, role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData || profileData.role === 'admin') {
        router.push('/dashboard/admin');
        return;
      }

      // Fetch tryout list dengan filter waktu DAN sekolah
      const currentTime = new Date().toISOString();
      
      const { data: tryoutsData, error: tryoutsError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions, duration_minutes, start_time, end_time, price, school, is_shared')
        .or(`start_time.is.null,start_time.lte.${currentTime}`)
        .or(`end_time.is.null,end_time.gte.${currentTime}`)
        // PENTING: Filter berdasarkan sekolah atau yang di-share
        .or(`school.eq.${profileData.school},is_shared.eq.true,school.is.null`)
        .order('created_at', { ascending: false });

      if (tryoutsError) {
        console.error('Error fetching tryouts:', tryoutsError);
      }

      setProfile(profileData);
      setTryouts(tryoutsData || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTryoutStatus = (startTime: string | null, endTime: string | null) => {
    const now = new Date();
    
    if (!startTime && !endTime) {
      return { status: 'available', label: 'Tersedia', color: 'green' };
    }
    
    if (startTime && new Date(startTime) > now) {
      return { status: 'upcoming', label: 'Akan Datang', color: 'yellow' };
    }
    
    if (endTime && new Date(endTime) < now) {
      return { status: 'ended', label: 'Berakhir', color: 'red' };
    }
    
    return { status: 'available', label: 'Tersedia', color: 'green' };
  };

  const getSchoolBadge = (tryoutSchool: string | null, isShared: boolean) => {
    if (isShared) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          🌐 Semua Sekolah
        </span>
      );
    }
    if (tryoutSchool && tryoutSchool === profile?.school) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          🏫 {tryoutSchool}
        </span>
      );
    }
    return null;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
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
              Dashboard Pengguna
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
              <p className="text-blue-100">Total Tryout</p>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold">{tryouts.length}</p>
            <p className="text-sm text-blue-100 mt-1">Tersedia untuk dikerjakan</p>
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

        {/* Tryout List */}
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
                Tryout dimulai pada tanggal 22 Desember 2025
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Belum ada tryout yang tersedia saat ini. Silakan tunggu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tryouts.map((tryout) => {
                const status = getTryoutStatus(tryout.start_time, tryout.end_time);
                
                return (
                  <div 
                    key={tryout.id} 
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tryout.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status.color === 'green' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : status.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {status.label}
                          </span>
                          {getSchoolBadge(tryout.school, tryout.is_shared)}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm mb-3">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>📝</span>
                            <span>{tryout.total_questions} soal</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>⏱️</span>
                            <span>{tryout.duration_minutes} menit</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span>💰</span>
                            <span className={tryout.price === 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                              {formatPrice(tryout.price)}
                            </span>
                          </div>
                        </div>
                        
                        {(tryout.start_time || tryout.end_time) && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-xs space-y-1">
                            {tryout.start_time && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <span>🕐</span>
                                <span>Mulai: {formatDateTime(tryout.start_time)}</span>
                              </div>
                            )}
                            {tryout.end_time && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <span>🕑</span>
                                <span>Berakhir: {formatDateTime(tryout.end_time)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* ACTION BUTTONS - HANYA SATU SECTION */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/tryout/${tryout.id}`)}
                        disabled={status.status !== 'available'}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                          status.status === 'available'
                            ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {status.status === 'upcoming' ? 'Belum Dimulai' : status.status === 'ended' ? 'Sudah Berakhir' : 'Mulai Tryout'}
                      </button>
                      
                      <button
                        onClick={() => router.push(`/tryout/${tryout.id}/ranking`)}
                        className="px-4 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2"
                        title="Lihat Ranking"
                      >
                        <span>🏆</span>
                        <span className="hidden sm:inline">Ranking</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}