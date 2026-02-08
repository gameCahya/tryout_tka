// app/smpabbsska/tryout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// Interfaces
interface ProfileData {
  id: string;
  auth_user_id: string;
  username: string;
  full_name: string;
  phone: string;
  school?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TryoutData {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export default function TryoutPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tryouts, setTryouts] = useState<TryoutData[]>([]);

  // Cek auth dan load profil
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // Struktur yang benar untuk getSession()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw new Error('Sesi tidak valid. Silakan login kembali.');
        }

        const session = sessionData.session;
        
        if (!session) {
          router.push('/smpabbsska/login');
          return;
        }

        // Struktur yang benar untuk fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('smpabbs_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError);
          throw new Error('Profil tidak ditemukan.');
        }

        setProfile(profileData);

        // Ambil semua data tryout aktif
        const { data: tryoutsData, error: tryoutsError } = await supabase
          .from('smpabbs_tryouts')
          .select('id, title, description, total_questions, duration_minutes, is_active, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (tryoutsError) {
          console.error('Error fetching tryouts:', tryoutsError);
          throw new Error('Gagal memuat daftar tryout.');
        }

        setTryouts(tryoutsData || []);

      } catch (err) {
        console.error('Error loading tryouts:', err);
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat halaman tryout. Silakan coba lagi atau hubungi admin.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [supabase, router]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} jam ${mins > 0 ? `${mins} menit` : ''}`;
    }
    return `${mins} menit`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-xl text-gray-700 dark:text-gray-300 font-medium">Memuat daftar tryout...</p>
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
              href="/smpabbsska/dashboard"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-linear-to-r from-blue-600 to-green-600 text-white font-bold text-xl px-4 py-1 rounded-full shadow-md">
                ABBS
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daftar Tryout</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pilih tryout yang ingin dikerjakan</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Halo, <span className="font-semibold">{profile.full_name}</span>
              </div>
              <Link
                href="/smpabbsska/dashboard"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistik */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tryout</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tryouts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Soal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tryouts.reduce((sum, tryout) => sum + tryout.total_questions, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Durasi</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(tryouts.reduce((sum, tryout) => sum + tryout.duration_minutes, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Tryout */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tryout Tersedia</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pilih tryout yang ingin Anda kerjakan. Setiap tryout memiliki durasi dan jumlah soal yang berbeda.
            </p>
          </div>

          {tryouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum ada tryout tersedia</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Saat ini belum ada tryout yang aktif. Silakan coba lagi nanti.
              </p>
              <Link
                href="/smpabbsska/dashboard"
                className="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tryouts.map((tryoutItem, index) => (
                <div key={tryoutItem.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <div className="bg-linear-to-r from-blue-500 to-green-500 text-white font-bold w-10 h-10 flex items-center justify-center rounded-lg">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {tryoutItem.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {tryoutItem.description}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-3">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {tryoutItem.total_questions} Soal
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDuration(tryoutItem.duration_minutes)}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(tryoutItem.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <Link
                        href={`/smpabbsska/tryout/${tryoutItem.id}`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Mulai Tryout
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 SMP ABBS Surakarta - Sistem Tryout Online</p>
          <p className="mt-1">Total {tryouts.length} tryout aktif tersedia</p>
        </div>
      </main>
    </div>
  );
}