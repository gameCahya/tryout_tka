// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cleanPhone, phoneToEmail } from '@/lib/phoneUtils';

// Import components
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthHeader from '@/components/auth/AuthHeader';
import ErrorMessage from '@/components/auth/ErrorMessage';
import FormInput, { PhoneIcon } from '@/components/auth/FormInput';
import PasswordInput from '@/components/auth/PasswordInput';
import SubmitButton from '@/components/auth/SubmitButton';
import AuthLink from '@/components/auth/AuthLink';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPhoneNum = cleanPhone(phone);
    if (!cleanPhoneNum || !password) {
      setError('No HP dan password wajib diisi');
      setLoading(false);
      return;
    }

    const fakeEmail = phoneToEmail(cleanPhoneNum);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (error) throw error;

      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard footerText="Dengan masuk, Anda menyetujui syarat dan ketentuan kami">
        <AuthHeader 
          title="Zona Edukasi"
          subtitle="Masuk ke akun Anda"
        />

        <ErrorMessage message={error} />

        <form onSubmit={handleLogin} className="space-y-5">
          <FormInput
            id="phone"
            label="Nomor HP"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="081234567890"
            icon={<PhoneIcon />}
            required
          />

          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            required
          />

          <SubmitButton
            loading={loading}
            loadingText="Memproses..."
            text="Masuk"
          />
        </form>

        <AuthLink
          text="Belum punya akun?"
          linkText="Daftar Sekarang"
          href="/auth/register"
        />
      </AuthCard>
    </AuthLayout>
  );
}