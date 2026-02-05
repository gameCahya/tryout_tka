// ============================================
// app/dashboard/admin/page.tsx
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Layout Components
import { DashboardContainer } from '@/components/layout/DashboardContainer';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { GridLayout } from '@/components/layout/GridLayout';
import { Section } from '@/components/layout/Section';

// Dashboard Components
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { TryoutList } from '@/components/dashboard/TryoutList';
import { UserCard } from '@/components/dashboard/UserCard';

// Common Components
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

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
  teacher_id?: string;
};

type User = {
  id: string;
  full_name: string;
  phone: string;
  school: string;
  role: string;
};

type TryoutWithStats = Tryout & {
  student_count: number;
};

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tryouts, setTryouts] = useState<TryoutWithStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone, school, role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profileData || profileData.role !== 'admin') {
          router.push('/dashboard/user');
          return;
        }

        setProfile(profileData);

        // Fetch tryouts
        const { data: tryoutsData, error: tryoutsError } = await supabase
          .from('tryouts')
          .select('id, title, total_questions, duration_minutes, created_at, teacher_id')
          .order('created_at', { ascending: false });

        if (!tryoutsError && tryoutsData) {
          const tryoutIds = tryoutsData.map(t => t.id);
          
          if (tryoutIds.length > 0) {
            const { data: resultsData } = await supabase
              .from('results')
              .select('tryout_id, user_id')
              .in('tryout_id', tryoutIds);

            if (resultsData) {
              const studentCounts = resultsData.reduce((acc, result) => {
                if (!acc[result.tryout_id]) {
                  acc[result.tryout_id] = new Set();
                }
                acc[result.tryout_id].add(result.user_id);
                return acc;
              }, {} as Record<string, Set<string>>);

              const tryoutsWithStats: TryoutWithStats[] = tryoutsData.map(tryout => ({
                ...tryout,
                student_count: studentCounts[tryout.id]?.size || 0,
              }));

              setTryouts(tryoutsWithStats);
            }
          } else {
            setTryouts([]);
          }
        }

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, school, role, created_at')
          .order('created_at', { ascending: false });

        if (!usersError) {
          setUsers(usersData || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Prepare stats
  const stats = [
    {
      title: 'Total Tryout',
      value: tryouts.length,
      subtitle: 'Tryout yang tersedia',
      icon: '📝',
      gradient: 'purple' as const,
    },
    {
      title: 'Total Pengguna',
      value: users.length,
      subtitle: 'Pengguna terdaftar',
      icon: '👥',
      gradient: 'indigo' as const,
    },
    {
      title: 'Soal Tersedia',
      value: tryouts.reduce((acc, t) => acc + t.total_questions, 0),
      subtitle: 'Total soal di semua tryout',
      icon: '📚',
      gradient: 'green' as const,
    },
    {
      title: 'Total Durasi',
      value: tryouts.reduce((acc, t) => acc + t.duration_minutes, 0),
      subtitle: 'Menit pengerjaan',
      icon: '⏱️',
      gradient: 'blue' as const,
    },
  ];

  // Prepare header actions
  const headerActions = [
    {
      icon: '⚙️',
      label: 'Admin Panel',
      onClick: () => router.push('/admin'),
      color: 'purple' as const,
    },
    {
      icon: '👥',
      label: 'Kelola User',
      onClick: () => router.push('/admin/users'),
      color: 'green' as const,
    },
    {
      icon: '📚',
      label: 'History',
      onClick: () => router.push('/history'),
      color: 'blue' as const,
    },
    {
      icon: '🚪',
      label: 'Logout',
      onClick: handleLogout,
      color: 'red' as const,
    },
  ];

  if (loading) {
    return <LoadingSpinner message="Memuat dashboard..." />;
  }

  return (
    <DashboardContainer maxWidth="xl">
      {/* Header */}
      <DashboardHeader
        title="Dashboard Admin"
        subtitle="Selamat datang, Administrator! 👋"
        actions={headerActions}
      />

      {/* Profile Card */}
      {profile && (
        <ProfileCard
          name={profile.full_name}
          role="Administrator"
          phone={profile.phone}
          school={profile.school}
          roleColor="green"
        />
      )}

      {/* Statistics Cards */}
      <StatsGrid stats={stats} columns={4} />

      {/* Tryout and User Lists */}
      <GridLayout columns={2} gap="lg">
        {/* Tryout List */}
        <TryoutList
          title="Tryout Terbaru"
          tryouts={tryouts}
          onViewResults={(id) => router.push(`/tryout/${id}/results`)}
          onViewDetail={(id) => router.push(`/tryout/${id}/info`)}
          showStudentCount={true}
          showResultsButton={true}
          showEditButton={false}
          emptyMessage="Tidak ada tryout yang tersedia"
          maxItems={5}
        />

        {/* User List */}
        <Section 
          title="Pengguna Terbaru"
          action={{
            label: 'Lihat Semua',
            onClick: () => router.push('/admin/users'),
          }}
        >
          {users.length === 0 ? (
            <EmptyState
              icon="📭"
              title="Belum Ada Pengguna"
              message="Tidak ada pengguna terdaftar"
            />
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onViewDetail={(id) => router.push(`/admin/users/${id}`)}
                />
              ))}
            </div>
          )}
        </Section>
      </GridLayout>
    </DashboardContainer>
  );
}