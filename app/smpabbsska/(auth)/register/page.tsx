'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface RegisterFormData {
  full_name: string;
  sd_asal: string;
  phone: string;
}

interface RegistrationSuccess {
  username: string;
  full_name: string;
  phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: '',
    sd_asal: '',
    phone: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null);

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
      // Validasi
      if (formData.phone.length < 10) {
        throw new Error('Nomor HP minimal 10 digit');
      }

      if (formData.full_name.trim().length < 3) {
        throw new Error('Nama minimal 3 karakter');
      }

      // Step 1: Generate username
      const { data: usernameData, error: usernameError } = await supabase
        .rpc('generate_username_nama_sd', {
          p_full_name: formData.full_name,
          p_sd_asal: formData.sd_asal,
        });

      if (usernameError) throw usernameError;

      const username = usernameData as string;
      const email = `${username}@smpabbs.local`;

      // Step 2: Create auth user dengan password = phone
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.phone, // PASSWORD = NOMOR HP
        options: {
          data: {
            username: username,
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Gagal membuat akun');

      // Step 3: Insert ke smpabbs_profiles
      const { error: profileError } = await supabase
        .from('smpabbs_profiles')
        .insert({
          auth_user_id: authData.user.id,
          username: username,
          email: email,
          phone: formData.phone,
          full_name: formData.full_name,
          sd_asal: formData.sd_asal,
          role: 'student',
          is_active: true,
        });

      if (profileError) throw profileError;

      // Show success
      setSuccess({
        username: username,
        full_name: formData.full_name,
        phone: formData.phone,
      });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/smpabbsska/auth/login');
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pendaftaran Berhasil!
              </h2>
              <p className="text-gray-600">
                Selamat datang, {success.full_name}
              </p>
            </div>

            {/* Login Info */}
            <div className="bg-linear-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                Informasi Login Kamu:
              </h3>
              
              {/* Username */}
              <div className="bg-white rounded-lg p-4 mb-3">
                <p className="text-xs text-gray-500 mb-1">Username:</p>
                <p className="text-xl font-bold text-center bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {success.username}
                </p>
              </div>

              {/* Password */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Password:</p>
                <p className="text-xl font-bold text-center text-gray-900">
                  {success.phone}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  (Nomor HP kamu)
                </p>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Password kamu = Nomor HP kamu</strong><br />
                  Jangan beritahu ke teman ya!
                </p>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleGoToLogin}
              className="w-full bg-linear-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all mb-4"
            >
              Login Sekarang
            </button>

            {/* Tips */}
            <div className="text-center text-sm text-gray-500">
              <p>💡 Username kamu mudah diingat:</p>
              <p className="font-mono text-xs mt-1">{success.username}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-green-600 text-white text-2xl font-bold mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daftar Tryout
          </h1>
          <p className="text-gray-600">
            SMP ABBS Surakarta
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              ✨ <strong>Super mudah!</strong><br />
              Cukup 3 data, langsung bisa login
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ahmad Rizki"
              />
              <p className="mt-1 text-xs text-gray-500">
                Username akan pakai nama depan kamu
              </p>
            </div>

            <div>
              <label htmlFor="sd_asal" className="block text-sm font-medium text-gray-700 mb-2">
                Asal SD
              </label>
              <input
                type="text"
                id="sd_asal"
                name="sd_asal"
                required
                value={formData.sd_asal}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SD Negeri 1 Surakarta"
              />
              <p className="mt-1 text-xs text-gray-500">
                Contoh: SD Negeri 1, SD Muhammadiyah 2
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor HP
                <span className="text-blue-600 font-semibold ml-1">(akan jadi password)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="081234567890"
              />
              <p className="mt-1 text-xs text-gray-500">
                ⚠️ Nomor HP ini akan jadi password kamu
              </p>
            </div>

            {/* Info tentang username */}
            {formData.full_name && formData.sd_asal && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 text-center">
                  Username kamu nanti:<br />
                  <span className="font-mono font-bold">
                    {formData.full_name.split(' ')[0].toLowerCase()}_
                    {formData.sd_asal.toLowerCase().includes('negeri') ? 'sdn' : 
                     formData.sd_asal.toLowerCase().includes('muhammadiyah') ? 'sdm' : 'sd'}_001
                  </span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link
                href="/smpabbsska/auth/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 SMP ABBS Surakarta</p>
        </div>
      </div>
    </div>
  );
}