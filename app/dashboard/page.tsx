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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Get user profile to determine role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        router.push('/auth/login');
        return;
      }

      // Redirect based on role
      if (profileData?.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        // For users or any other role, redirect to user dashboard
        router.push('/dashboard/user');
      }

      setLoading(false);
    };

    checkUserRole();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Mengarahkan...</p>
        </div>
      </div>
    );
  }

  return null; // This component will redirect, so no UI needed
}