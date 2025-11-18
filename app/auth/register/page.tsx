'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Bersihkan no HP
  const cleanPhone = (input: string): string => {
    let num = input.replace(/\D/g, '');
    if (num.startsWith('0')) {
      return num;
    } else if (num.startsWith('62')) {
      return '0' + num.substring(2);
    } else if (num.length === 11 && num.startsWith('8')) {
      return '0' + num;
    }
    return num;
  };

  // Fungsi untuk mengirim WhatsApp
  const sendWelcomeWA = async (phone: string, fullName: string) => {
    try {
      const response = await fetch('/api/send-wa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, fullName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Gagal mengirim WA:', data);
        // Tidak throw error agar registrasi tetap berhasil
      } else {
        console.log('WhatsApp berhasil dikirim:', data);
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      // Tidak throw error agar registrasi tetap berhasil
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

    const fakeEmail = `${cleanPhoneNum}@tryout.id`;

    try {
      // 1. SignUp
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

      // 2. Login otomatis
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (loginError) throw loginError;

      // 3. Insert ke profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          phone: cleanPhoneNum,
          school: school,
        });

      if (profileError) throw profileError;

      // 4. Kirim WhatsApp selamat datang
      await sendWelcomeWA(cleanPhoneNum, fullName);

      // Redirect
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Daftar</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              No HP (contoh: 081234567890)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
              Asal Sekolah
            </label>
            <input
              id="school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}