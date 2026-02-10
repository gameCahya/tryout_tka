'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// ===================== TYPES =====================
interface AdminProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

interface StudentProfile {
  id: string;
  full_name: string;
  phone: string;
  sd_asal: string;
  username?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TryoutItem {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalTryouts: number;
  activeTryouts: number;
  totalResults: number;
  newStudentsThisWeek: number;
}

type TabKey = 'overview' | 'users' | 'tryouts';

// ===================== MAIN COMPONENT =====================
export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [tryouts, setTryouts] = useState<TryoutItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, activeStudents: 0,
    totalTryouts: 0, activeTryouts: 0,
    totalResults: 0, newStudentsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [studentsRes, tryoutsRes, resultsRes] = await Promise.all([
        supabase
          .from('smpabbs_profiles')
          .select('id, full_name, phone, sd_asal, username, role, is_active, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false }),
        supabase
          .from('smpabbs_tryouts')
          .select('id, title, total_questions, duration_minutes, is_active, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('smpabbs_results')
          .select('*', { count: 'exact', head: true }),
      ]);

      const studentList: StudentProfile[] = studentsRes.data || [];
      const tryoutList: TryoutItem[] = tryoutsRes.data || [];

      setStudents(studentList);
      setTryouts(tryoutList);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      setStats({
        totalStudents: studentList.length,
        activeStudents: studentList.filter(s => s.is_active).length,
        totalTryouts: tryoutList.length,
        activeTryouts: tryoutList.filter(t => t.is_active).length,
        totalResults: resultsRes.count || 0,
        newStudentsThisWeek: studentList.filter(s => new Date(s.created_at) >= oneWeekAgo).length,
      });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/smpabbsska/auth/login'); return; }

        const { data: profile, error: profileErr } = await supabase
          .from('smpabbs_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (profileErr || !profile) throw new Error('Profil tidak ditemukan.');
        if (profile.role !== 'admin') { router.replace('/smpabbsska/dashboard'); return; }

        setAdmin(profile);
        await loadData();
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [supabase, router, loadData]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('smpabbs_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, is_active: !currentStatus } : s));
      setStats(prev => ({
        ...prev,
        activeStudents: !currentStatus ? prev.activeStudents + 1 : prev.activeStudents - 1,
      }));
      showToast(`Akun berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch {
      showToast('Gagal mengubah status akun.');
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleTryoutStatus = async (tryoutId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('smpabbs_tryouts')
        .update({ is_active: !currentStatus })
        .eq('id', tryoutId);
      if (error) throw error;
      setTryouts(prev => prev.map(t => t.id === tryoutId ? { ...t, is_active: !currentStatus } : t));
      setStats(prev => ({
        ...prev,
        activeTryouts: !currentStatus ? prev.activeTryouts + 1 : prev.activeTryouts - 1,
      }));
      showToast(`Tryout ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch {
      showToast('Gagal mengubah status tryout.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/smpabbsska/auth/login');
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.sd_asal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // ===================== LOADING =====================
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Memuat panel admin...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{pageError}</p>
          <Link href="/smpabbsska/auth/login"
            className="bg-linear-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl shadow-2xl font-medium text-sm">
          ✅ {toastMsg}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-600 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                A
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">SMP ABBS Surakarta</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 font-medium">
                👤 {admin?.full_name}
              </span>
              <Link
                href="/smpabbsska/admin/tryouts"
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                📝 Kelola Soal
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===== STATS CARDS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Siswa', value: stats.totalStudents, sub: `${stats.activeStudents} aktif`, icon: '👨‍🎓', color: 'blue' },
            { label: 'Siswa Baru (7 hari)', value: stats.newStudentsThisWeek, sub: 'pendaftar terbaru', icon: '🆕', color: 'green' },
            { label: 'Total Tryout', value: stats.totalTryouts, sub: `${stats.activeTryouts} aktif`, icon: '📋', color: 'purple' },
            { label: 'Total Pengerjaan', value: stats.totalResults, sub: 'semua waktu', icon: '📊', color: 'orange' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                  stat.color === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                  stat.color === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                  'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                }`}>live</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ===== TABS ===== */}
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'users', label: `👥 Siswa (${students.length})` },
            { key: 'tryouts', label: `📋 Tryout (${tryouts.length})` },
          ] as { key: TabKey; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Students */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Siswa Terbaru</h2>
                <button onClick={() => setActiveTab('users')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Lihat semua →
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {students.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Belum ada siswa terdaftar</p>
                ) : students.slice(0, 6).map(student => (
                  <div key={student.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.sd_asal}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      student.is_active
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {student.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tryout Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Status Tryout</h2>
                <Link href="/smpabbsska/admin/tryouts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Kelola soal →
                </Link>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {tryouts.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Belum ada tryout</p>
                    <Link href="/smpabbsska/admin/tryouts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      Buat tryout baru →
                    </Link>
                  </div>
                ) : tryouts.slice(0, 5).map(tryout => (
                  <div key={tryout.id} className="px-6 py-3 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${tryout.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tryout.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tryout.total_questions} soal · {tryout.duration_minutes} mnt</p>
                    </div>
                    <button
                      onClick={() => toggleTryoutStatus(tryout.id, tryout.is_active)}
                      className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        tryout.is_active
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {tryout.is_active ? '✓ Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Aksi Cepat</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: '/smpabbsska/admin/tryouts', icon: '➕', label: 'Buat Tryout' },
                  { href: '/smpabbsska/admin/tryouts', icon: '📝', label: 'Upload Soal' },
                  { icon: '👥', label: 'Kelola Siswa', onClick: () => setActiveTab('users') },
                  { href: '/smpabbsska/tryout', icon: '🏆', label: 'Lihat Tryout' },
                ].map(action => (
                  action.onClick ? (
                    <button key={action.label} onClick={action.onClick}
                      className="p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-center hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all">
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</p>
                    </button>
                  ) : (
                    <Link key={action.label} href={action.href!}
                      className="p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-center hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all">
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</p>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Daftar Siswa</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{filteredStudents.length} dari {students.length} siswa</p>
                </div>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari nama, HP, atau SD..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Siswa</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">HP</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">SD Asal</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Daftar</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                        {searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada siswa terdaftar.'}
                      </td>
                    </tr>
                  ) : filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                            {student.username && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{student.username}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{student.phone}</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{student.sd_asal}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(student.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          student.is_active
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${student.is_active ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          {student.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(student.id, student.is_active)}
                          disabled={updatingUser === student.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            student.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                          }`}
                        >
                          {updatingUser === student.id ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Proses...
                            </span>
                          ) : student.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TRYOUTS TAB ===== */}
        {activeTab === 'tryouts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Daftar Tryout</h2>
              <Link
                href="/smpabbsska/admin/tryouts"
                className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Tryout & Kelola Soal
              </Link>
            </div>

            {tryouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Belum ada tryout</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Buat tryout pertama dan mulai upload soal-soalnya</p>
                <Link href="/smpabbsska/admin/tryouts"
                  className="bg-linear-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                  Buat Tryout Baru
                </Link>
              </div>
            ) : tryouts.map(tryout => (
              <div key={tryout.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tryout.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tryout.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 ml-5">
                    <span>📋 {tryout.total_questions} soal</span>
                    <span>⏱ {tryout.duration_minutes} menit</span>
                    <span>📅 {formatDate(tryout.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleTryoutStatus(tryout.id, tryout.is_active)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      tryout.is_active
                        ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {tryout.is_active ? '✓ Aktif' : 'Nonaktif'}
                  </button>
                  <Link href="/smpabbsska/admin/tryouts"
                    className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors">
                    Kelola Soal
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}