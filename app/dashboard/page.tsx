'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Profile = {
  full_name: string;
  phone: string;
  school: string;
};

type Tryout = {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Cek session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Ambil profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, school')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        router.push('/auth/login');
        return;
      }

      // Ambil daftar tryout
      const { data: tryoutsData, error: tryoutsError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions, duration_minutes')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 py-4 border-b">
  <h1 className="text-2xl font-bold">Dashboard</h1>
  <div className="flex gap-4">
    <button
      onClick={() => router.push('/history')}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <span>📚</span>
      <span>History Tryout</span>
    </button>
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
    >
      Logout
    </button>
  </div>
</header>

        {/* Profil User */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Halo, {profile?.full_name}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">No HP</p>
              <p>{profile?.phone}</p>
            </div>
            <div>
              <p className="text-gray-500">Sekolah</p>
              <p>{profile?.school}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="text-green-600">Aktif</p>
            </div>
          </div>
        </div>

        {/* Daftar Tryout */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tryout Tersedia</h2>
          {tryouts.length === 0 ? (
            <p className="text-gray-500">Belum ada tryout tersedia.</p>
          ) : (
            <div className="space-y-4">
              {tryouts.map((tryout) => (
                <div key={tryout.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{tryout.title}</h3>
                    <p className="text-sm text-gray-500">
                      {tryout.total_questions} soal • {tryout.duration_minutes} menit
                    </p>
                  </div>
                  <a
                    href={`/tryout/${tryout.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    Mulai
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}