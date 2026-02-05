'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface LoginFormData {
  username: string;
  password: string;
}

interface SupabaseError {
  message: string;
  status?: number;
}

export default function LoginPage() {
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert username to email
      const email = `${formData.username}@smpabbs.local`;

      // Login dengan Supabase Auth (password = phone)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password, // Password = Nomor HP
      });

      if (authError) {
        throw new Error('Username atau password salah. Pastikan password = nomor HP kamu.');
      }

      if (!authData.user) {
        throw new Error('Login gagal. Silakan coba lagi.');
      }

      // Check profile di smpabbs_profiles
      const { data: profile, error: profileError } = await supabase
        .from('smpabbs_profiles')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (profileError) {
        throw new Error('Profile tidak ditemukan. Silakan hubungi admin.');
      }

      if (!profile) {
        throw new Error('Profile tidak ditemukan. Silakan hubungi admin.');
      }

      if (!profile.is_active) {
        throw new Error('Akun Anda belum diaktifkan. Silakan hubungi admin.');
      }

      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/smpabbsska/dashboard/admin');
      } else {
        router.push('/smpabbsska/dashboard');
      }

      router.refresh();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as SupabaseError).message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-white text-2xl font-bold mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Login SMP ABBS
          </h1>
          <p className="text-gray-600">
            Masuk untuk mengikuti tryout
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              💡 <strong>Password = Nomor HP</strong> yang kamu daftarkan
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ahmad_sdn1_001"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: nama_sd_kode (contoh: ahmad_sdn1_001)
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
                <span className="text-blue-600 ml-1">(Nomor HP)</span>
              </label>
              <input
                type="tel"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="081234567890"
              />
              <p className="mt-1 text-xs text-gray-500">
                Masukkan nomor HP yang kamu daftarkan
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center w-full"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lupa username atau password?
            </button>

            {showHelp && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="text-sm">
                  <p className="font-semibold text-gray-700 mb-2">
                    💡 Tips Login:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2">1️⃣</span>
                      <span><strong>Username</strong> pakai nama depan + SD + nomor<br />
                      Contoh: ahmad_sdn1_001</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2️⃣</span>
                      <span><strong>Password</strong> adalah nomor HP yang kamu daftarkan</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3️⃣</span>
                      <span>Lupa username? Lihat di halaman sukses pendaftaran</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Masih bermasalah? Hubungi admin atau guru SD kamu
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Belum punya akun?{' '}
              <Link
                href="/smpabbsska/auth/register"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Example Card */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            📝 Contoh Login
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Username:</span>
                <span className="font-semibold">ahmad_sdn1_001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Password:</span>
                <span className="font-semibold">081234567890</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Username pakai nama "Ahmad" dari "SD Negeri 1"
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 SMP ABBS Surakarta</p>
        </div>
      </div>
    </div>
  );
}