// app/smpabbsska/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// Definisikan tipe data profil
interface ProfileData {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  phone: string;
  sd_asal: string;
  class_id?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        // Cek session di client-side - FIXED SYNTAX
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.warn('No active session, redirecting to login...');
          router.replace('/smpabbsska/login');
          return;
        }

        // Jika session ada, ambil profil
        const { data: profileData, error: profileError } = await supabase
          .from('smpabbs_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Gagal memuat profil.');
          return;
        }

        if (!profileData) {
          setError('Profil tidak ditemukan.');
          return;
        }

        setProfile(profileData);
      } catch (err) {
        console.error('Unexpected error during auth check:', err);
        setError('Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-xl text-gray-700 dark:text-gray-300 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Link
              href="/smpabbsska/login"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render dashboard jika profil berhasil dimuat
  if (profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Siswa SD</h1>
                <p className="text-gray-600 dark:text-gray-300">Selamat datang, {profile.full_name}!</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Link
                  href="/smpabbsska/profile"
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors flex items-center"
                >
                  <span>👤</span>
                  <span className="ml-2 hidden md:inline">Profil Saya</span>
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/smpabbsska/login');
                  }}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors flex items-center"
                >
                  <span>🚪</span>
                  <span className="ml-2 hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-linear-to-r from-blue-600 to-green-600 p-6 text-white">
                  <h2 className="text-2xl font-bold">Informasi Akun</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-white font-medium">{profile.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nama Lengkap</label>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-white font-medium">{profile.full_name}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nomor HP</label>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-white font-medium">{profile.phone}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">SD Asal</label>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-white font-medium">{profile.sd_asal}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status Akun</label>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        profile.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {profile.is_active ? '✅ Aktif' : '⏳ Menunggu Verifikasi'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aksi Cepat</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/smpabbsska/tryout"
                    className="flex items-center justify-center p-4 bg-linear-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl mr-3">📝</span>
                    <span className="font-medium text-gray-900 dark:text-white">Lihat Tryout</span>
                  </Link>
                  <Link
                    href="/smpabbsska/history"
                    className="flex items-center justify-center p-4 bg-linear-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl mr-3">📊</span>
                    <span className="font-medium text-gray-900 dark:text-white">Riwayat Tryout</span>
                  </Link>
                  <Link
                    href="/smpabbsska/profile"
                    className="flex items-center justify-center p-4 bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl mr-3">👤</span>
                    <span className="font-medium text-gray-900 dark:text-white">Edit Profil</span>
                  </Link>
                  <Link
                    href="/smpabbsska/ranking"
                    className="flex items-center justify-center p-4 bg-linear-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl mr-3">🏆</span>
                    <span className="font-medium text-gray-900 dark:text-white">Leaderboard</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Info */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Statistik Saya</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Tryout Diikuti</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Nilai Tertinggi</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">-</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Peringkat</span>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">-</span>
                  </div>
                </div>
              </div>

              {/* Welcome Info Card */}
              <div className="bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🎓 Selamat Datang!</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Halo siswa SD! Kamu telah berhasil mendaftar di platform tryout SMP ABBS Surakarta. 
                  Ikuti tryout gratis dan persiapkan dirimu untuk masuk SMP!
                </p>
                <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Tips:</strong> Kerjakan tryout dengan teliti dan lihat pembahasannya untuk belajar lebih baik.
                  </p>
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📞 Butuh Bantuan?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  Hubungi admin SMP ABBS jika ada pertanyaan atau kesulitan.
                </p>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  📧 admin@smpabbs.sch.id<br />
                  📱 0812-3456-7890
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center py-6 text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700">
            <p>© 2025 SMP ABBS Surakarta - Platform Tryout untuk Siswa SD</p>
          </footer>
        </div>
      </div>
    );
  }

  // Fallback jika tidak loading, tidak error, tapi profil null
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <p className="text-lg text-gray-700 dark:text-gray-300">Tidak ada data profil yang ditemukan.</p>
    </div>
  );
}