// ============================================
// app/dashboard/teacher/page.tsx
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

// Dashboard Components
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { TryoutList } from '@/components/dashboard/TryoutList';
import { ProgressList } from '@/components/dashboard/ProgressList';

// Common Components
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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

type UserProgress = {
  id: string;
  user_id: string;
  user_name: string;
  tryout_id: string;
  tryout_title: string;
  score: number | null;
  completed_at: string | null;
  total_questions: number;
};

export default function TeacherDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone, school, role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profileData || !['admin', 'teacher'].includes(profileData.role || '')) {
          router.push('/dashboard/user');
          return;
        }

        setProfile(profileData);

        // Fetch tryouts
        const { data: tryoutsData } = await supabase
          .from('tryouts')
          .select('id, title, total_questions, duration_minutes, created_at, teacher_id')
          .eq('teacher_id', session.user.id)
          .order('created_at', { ascending: false });

        setTryouts(tryoutsData || []);

        // Fetch progress
        const tryoutIds = tryoutsData?.map(t => t.id) || [];

        if (tryoutIds.length > 0) {
          const { data: studentsData } = await supabase
            .from('profiles')
            .select('id, full_name, school')
            .eq('school', profileData.school)
            .neq('role', 'teacher')
            .neq('role', 'admin');

          if (studentsData && studentsData.length > 0) {
            const studentIds = studentsData.map(s => s.id);
            const { data: resultsData } = await supabase
              .from('results')
              .select('id, user_id, tryout_id, score, completed_at, total_questions')
              .in('tryout_id', tryoutIds)
              .in('user_id', studentIds)
              .order('completed_at', { ascending: false })
              .limit(20);

            if (resultsData) {
              const combinedProgress: UserProgress[] = resultsData.map(result => {
                const student = studentsData.find(s => s.id === result.user_id);
                const tryout = tryoutsData?.find(t => t.id === result.tryout_id);
                return {
                  id: result.id,
                  user_id: result.user_id,
                  user_name: student?.full_name || 'Unknown Student',
                  tryout_id: result.tryout_id,
                  tryout_title: tryout?.title || 'Unknown Tryout',
                  score: result.score,
                  completed_at: result.completed_at,
                  total_questions: result.total_questions || tryout?.total_questions || 0,
                };
              });
              setProgress(combinedProgress);
            }
          }
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
    router.push('/auth/login');
  };

  // Prepare tryouts with student count
  const tryoutsWithStats = tryouts.map(tryout => ({
    ...tryout,
    student_count: progress.filter(p => p.tryout_id === tryout.id).length,
  }));

  // Prepare stats
  const stats = [
    {
      title: 'Total Tryout',
      value: tryouts.length,
      subtitle: 'Tryout yang dibuat',
      icon: '📝',
      gradient: 'purple' as const,
    },
    {
      title: 'Soal Tersedia',
      value: tryouts.reduce((acc, t) => acc + t.total_questions, 0),
      subtitle: 'Total soal yang dibuat',
      icon: '📚',
      gradient: 'indigo' as const,
    },
    {
      title: 'Siswa Aktif',
      value: new Set(progress.map(p => p.user_id)).size,
      subtitle: 'Siswa mengerjakan tryout',
      icon: '👥',
      gradient: 'green' as const,
    },
    {
      title: 'Tryout Diselesaikan',
      value: progress.filter(p => p.completed_at !== null).length,
      subtitle: 'Tryout selesai dikerjakan',
      icon: '✅',
      gradient: 'blue' as const,
    },
  ];

  // Prepare header actions
  const headerActions = [
    {
      icon: '➕',
      label: 'Buat Tryout',
      onClick: () => router.push('/tryout/create'),
      color: 'purple' as const,
    },
    {
      icon: '📝',
      label: 'Kelola Soal',
      onClick: () => router.push('/admin'),
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
        title="Dashboard Guru"
        subtitle={`Selamat datang, ${profile?.full_name}! 👋`}
        actions={headerActions}
      />

      {/* Profile Card */}
      {profile && (
        <ProfileCard
          name={profile.full_name}
          role="Guru/Pembuat Soal"
          phone={profile.phone}
          school={profile.school}
          roleColor="purple"
        />
      )}

      {/* Statistics Cards */}
      <StatsGrid stats={stats} columns={4} />

      {/* Tryout and Progress Lists */}
      <GridLayout columns={2} gap="lg">
        <TryoutList
          title="Tryout Saya"
          tryouts={tryoutsWithStats}
          onViewResults={(id) => router.push(`/tryout/${id}/results`)}
          onEdit={(id) => router.push(`/tryout/${id}/edit`)}
          showStudentCount={true}
          showResultsButton={true}
          showEditButton={true}
          emptyMessage="Anda belum membuat tryout"
          emptyAction={{
            label: 'Buat Tryout',
            onClick: () => router.push('/tryout/create'),
          }}
          maxItems={5}
        />

        <ProgressList
          title="Progress Siswa"
          progress={progress}
          onViewDetail={(tryoutId, userId) => 
            router.push(`/tryout/${tryoutId}/results/${userId}`)
          }
          maxItems={5}
        />
      </GridLayout>
    </DashboardContainer>
  );
}