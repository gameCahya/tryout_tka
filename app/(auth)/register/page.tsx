// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cleanPhone, phoneToEmail, validateIndonesianPhone } from '@/lib/phoneUtils';
import { getErrorMessage } from '@/utils/error-handler';
import type { FonnteResponse } from '@/lib/fonnte';

// Import components
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthHeader from '@/components/auth/AuthHeader';
import ErrorMessage from '@/components/auth/ErrorMessage';
import FormInput, { UserIcon, PhoneIcon, SchoolIcon } from '@/components/auth/FormInput';
import PasswordInput from '@/components/auth/PasswordInput';
import SubmitButton from '@/components/auth/SubmitButton';
import AuthLink from '@/components/auth/AuthLink';

// Types for API responses
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fungsi untuk mengirim WhatsApp selamat datang ke user
  const sendWelcomeWA = async (phone: string, fullName: string): Promise<void> => {
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

      if (!response.ok) {
        const errorData: ApiResponse = await response.json();
        console.error('Gagal mengirim WA ke user:', errorData);
      } else {
        const data: ApiResponse = await response.json();
        console.log('WhatsApp selamat datang berhasil dikirim ke user:', data);
      }
    } catch (error: unknown) {
      console.error('Error sending WhatsApp to user:', getErrorMessage(error));
    }
  };

  // Fungsi untuk mengirim notifikasi pendaftaran ke admin
  const sendRegistrationNotification = async (
    fullName: string, 
    phone: string, 
    school: string
  ): Promise<void> => {
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

      if (!response.ok) {
        const errorData: ApiResponse = await response.json();
        console.error('Gagal mengirim notifikasi admin:', errorData);
      } else {
        const data: ApiResponse = await response.json();
        console.log('Notifikasi pendaftaran berhasil dikirim ke admin:', data);
      }
    } catch (error: unknown) {
      console.error('Error sending registration notification:', getErrorMessage(error));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPhoneNum = cleanPhone(phone);
    
    // Validation
    if (!fullName.trim() || !cleanPhoneNum || !school.trim() || !password) {
      setError('Semua field wajib diisi');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    // Validate phone number format
    if (!validateIndonesianPhone(cleanPhoneNum)) {
      setError('Format nomor HP tidak valid. Gunakan format 08xxxxxxxxxx');
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
            full_name: fullName.trim(),
            phone: cleanPhoneNum,
            school: school.trim(),
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('Registrasi gagal - tidak ada data user');
      }

      console.log('Registration successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        session: authData.session ? 'Session created' : 'No session (email confirmation required)'
      });

      // Kirim WhatsApp notifications (run in background)
      Promise.all([
        sendWelcomeWA(cleanPhoneNum, fullName),
        sendRegistrationNotification(fullName, cleanPhoneNum, school)
      ]).catch(error => {
        console.error('Error sending WhatsApp notifications:', getErrorMessage(error));
        // Don't show error to user, just log it
      });

      // Check if we have a session (email confirmation might be disabled)
      if (authData.session) {
        // Auto-login successful, redirect to dashboard
        router.push('/dashboard');
      } else {
        // Email confirmation required
        setError('Registrasi berhasil! Silakan cek email Anda untuk konfirmasi akun.');
        // Optional: Clear form
        setFullName('');
        setPhone('');
        setSchool('');
        setPassword('');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      setError(getErrorMessage(error));
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
            helperText="Contoh: 081234567890"
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
          href="/login"
        />
      </AuthCard>
    </AuthLayout>
  );
}