'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check user role to redirect appropriately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        router.push('/login');
        return;
      }

      // Redirect based on role
      if (profileData.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (profileData.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/user');
      }
    };

    checkUserRole();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Mengarahkan...</p>
      </div>
    </div>
  );
}