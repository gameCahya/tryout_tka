// ============================================
// app/admin/users/[id]/page.tsx
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardContainer } from '@/components/layout/DashboardContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { InfoItem } from '@/components/common/InfoItem';

type UserDetail = {
  id: string;
  full_name: string;
  phone: string;
  school: string;
  role: string;
  created_at: string;
};

type UserResult = {
  id: string;
  tryout_id: string;
  tryout_title: string;
  score: number | null;
  completed_at: string | null;
  total_questions: number;
};

export default function UserDetailPage() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        // Check if current user is admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, school, role, created_at')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUser(userData);

        // Fetch user's tryout results
        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select('id, tryout_id, score, completed_at, total_questions')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });

        if (!resultsError && resultsData) {
          // Get tryout titles
          const tryoutIds = resultsData.map(r => r.tryout_id);
          if (tryoutIds.length > 0) {
            const { data: tryoutsData } = await supabase
              .from('tryouts')
              .select('id, title')
              .in('id', tryoutIds);

            const resultsWithTitles = resultsData.map(result => ({
              ...result,
              tryout_title: tryoutsData?.find(t => t.id === result.tryout_id)?.title || 'Unknown Tryout',
            }));

            setResults(resultsWithTitles);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user detail:', error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetail();
    }
  }, [userId, router]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger' as const;
      case 'teacher': return 'info' as const;
      default: return 'default' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      default: return 'Siswa';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate statistics
  const completedCount = results.filter(r => r.completed_at).length;
  const averageScore = completedCount > 0
    ? results.filter(r => r.score !== null).reduce((sum, r) => sum + (r.score || 0), 0) / completedCount
    : 0;
  const highestScore = completedCount > 0
    ? Math.max(...results.filter(r => r.score !== null).map(r => r.score || 0))
    : 0;

  if (loading) {
    return <LoadingSpinner message="Memuat detail pengguna..." />;
  }

  if (!user) {
    return (
      <DashboardContainer>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Pengguna tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer maxWidth="2xl">
      <PageHeader
        title={user.full_name}
        description={`Detail informasi pengguna`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/admin' },
          { label: 'Pengguna', href: '/admin/users' },
          { label: user.full_name },
        ]}
        actions={
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Kembali
          </button>
        }
      />

      {/* User Profile Card */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.full_name}
              </h2>
              <Badge variant={getRoleBadgeVariant(user.role)} size="lg">
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Bergabung sejak {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem icon="📱" label="Nomor Telepon" value={user.phone} />
          <InfoItem icon="🏫" label="Sekolah" value={user.school} />
          <InfoItem icon="🎯" label="Status" value={getRoleLabel(user.role)} />
        </div>
      </Card>

      {/* Statistics Cards - Only for students */}
      {user.role === 'user' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card padding="md">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {results.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Tryout Diikuti
              </p>
            </div>
          </Card>
          <Card padding="md">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {completedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tryout Selesai
              </p>
            </div>
          </Card>
          <Card padding="md">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {averageScore.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Rata-rata Nilai
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Results History - Only for students */}
      {user.role === 'user' && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Riwayat Tryout
          </h3>

          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Belum ada riwayat tryout
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tryout
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nilai
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {result.tryout_title}
                      </td>
                      <td className="px-4 py-3">
                        {result.completed_at ? (
                          <Badge variant="success" size="sm">Selesai</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Proses</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {result.score !== null ? (
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {result.score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {result.completed_at ? formatDate(result.completed_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* For Teachers - Show created tryouts */}
      {user.role === 'teacher' && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Guru
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Guru ini dapat membuat dan mengelola tryout untuk sekolahnya.
          </p>
        </Card>
      )}

      {/* For Admins */}
      {user.role === 'admin' && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Administrator
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Administrator memiliki akses penuh ke semua fitur sistem.
          </p>
        </Card>
      )}
    </DashboardContainer>
  );
}