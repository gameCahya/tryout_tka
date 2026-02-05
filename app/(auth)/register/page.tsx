// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cleanPhone, phoneToEmail } from '@/lib/phoneUtils';

// Import components
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthHeader from '@/components/auth/AuthHeader';
import ErrorMessage from '@/components/auth/ErrorMessage';
import FormInput, { UserIcon, PhoneIcon, SchoolIcon } from '@/components/auth/FormInput';
import PasswordInput from '@/components/auth/PasswordInput';
import SubmitButton from '@/components/auth/SubmitButton';
import AuthLink from '@/components/auth/AuthLink';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fungsi untuk mengirim WhatsApp selamat datang ke user
  const sendWelcomeWA = async (phone: string, fullName: string) => {
    try {
      const response = await fetch('/api/send-wa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone, 
          fullName,
          isNotification: false
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Gagal mengirim WA ke user:', data);
      } else {
        console.log('WhatsApp selamat datang berhasil dikirim ke user:', data);
      }
    } catch (error) {
      console.error('Error sending WhatsApp to user:', error);
    }
  };

  // Fungsi untuk mengirim notifikasi pendaftaran ke admin
  const sendRegistrationNotification = async (fullName: string, phone: string, school: string) => {
    try {
      const response = await fetch('/api/send-wa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isNotification: true,
          registrationData: { fullName, phone, school }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Gagal mengirim notifikasi admin:', data);
      } else {
        console.log('Notifikasi pendaftaran berhasil dikirim ke admin:', data);
      }
    } catch (error) {
      console.error('Error sending registration notification:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPhoneNum = cleanPhone(phone);
    if (!fullName || !cleanPhoneNum || !school || !password) {
      setError('Semua field wajib diisi');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    const fakeEmail = phoneToEmail(cleanPhoneNum);

    try {
      // SignUp - trigger otomatis handle profiles
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: cleanPhoneNum,
            school: school,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registrasi gagal');

      // Kirim WhatsApp
      await sendWelcomeWA(cleanPhoneNum, fullName);
      await sendRegistrationNotification(fullName, cleanPhoneNum, school);

      // Redirect
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard footerText="Dengan mendaftar, Anda menyetujui syarat dan ketentuan kami">
        <AuthHeader 
          title="Zona Edukasi"
          subtitle="Buat akun baru Anda"
        />

        <ErrorMessage message={error} />

        <form onSubmit={handleRegister} className="space-y-5">
          <FormInput
            id="fullName"
            label="Nama Lengkap"
            type="text"
            value={fullName}
            onChange={setFullName}
            placeholder="Masukkan nama lengkap"
            icon={<UserIcon />}
            required
          />

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

          <FormInput
            id="school"
            label="Asal Sekolah"
            type="text"
            value={school}
            onChange={setSchool}
            placeholder="Nama sekolah"
            icon={<SchoolIcon />}
            required
          />

          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Minimal 6 karakter"
            minLength={6}
            required
            helperText="Gunakan minimal 6 karakter"
          />

          <SubmitButton
            loading={loading}
            loadingText="Mendaftar..."
            text="Daftar Sekarang"
          />
        </form>

        <AuthLink
          text="Sudah punya akun?"
          linkText="Login"
          href="/auth/login"
        />
      </AuthCard>
    </AuthLayout>
  );
}