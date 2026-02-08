'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

// Interfaces
interface LoginFormData {
  phone: string;
}

interface LoginInfo {
  username: string;
  is_active: boolean;
  role: string;
  auth_user_id: string;
}

interface ProfileData {
  id: string;
  auth_user_id: string;
  username: string;
  email: string;
  phone: string;
  full_name: string;
  sd_asal: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Supabase Error Type
interface SupabaseError {
  message?: string; // Optional karena bisa undefined
  status?: number;
  code?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState<LoginFormData>({
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Memulai proses login...');

      // 1. Validasi Input
      if (!formData.phone.trim()) {
        throw new Error('Nomor HP harus diisi');
      }

      if (formData.phone.length < 10) {
        throw new Error('Nomor HP minimal 10 digit');
      }

      console.log('🔍 Mencari informasi login berdasarkan nomor HP...');

      // 2. Gunakan RPC Function untuk mendapatkan username dan status
      const { data: loginInfoArray, error: rpcError } = await supabase
        .rpc('get_login_info_by_phone', { p_phone: formData.phone });

      if (rpcError) {
        console.error('❌ Error saat memanggil RPC:', rpcError);
        
        // PERBAIKAN: Cek apakah objek error kosong {}
        if (Object.keys(rpcError).length === 0) {
            throw new Error('Sistem login sedang diperbaiki. RPC function tidak ditemukan. Hubungi admin.');
        }

        // Cek apakah error karena function tidak ditemukan
        if (rpcError.code === '42883' || (rpcError.message && rpcError.message.includes('does not exist'))) {
           throw new Error('Sistem login sedang diperbaiki. Hubungi admin.');
        }
        // Error lainnya, mungkin koneksi atau database
        throw new Error('Terjadi kesalahan sistem. Silakan coba lagi.');
      }

      if (!loginInfoArray || loginInfoArray.length === 0) {
        throw new Error('Nomor HP tidak terdaftar. Silakan daftar terlebih dahulu.');
      }

      if (loginInfoArray.length > 1) {
        // Ini seharusnya tidak terjadi jika RPC function menggunakan LIMIT 1
        console.warn('⚠️ Lebih dari satu akun ditemukan untuk HP ini (harusnya tidak mungkin).');
        throw new Error('Data akun tidak konsisten. Hubungi admin.');
      }

      const loginInfo = loginInfoArray[0] as LoginInfo;

      if (!loginInfo.is_active) {
        throw new Error('Akun Anda belum diaktifkan. Silakan hubungi admin.');
      }

      // 3. Konversi username ke email untuk login
      const email = `${loginInfo.username}@smpabbs.local`;
      console.log('📧 Email untuk login:', email);

      // 4. Login dengan Supabase Auth (password = nomor HP)
      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.phone, // Password = Nomor HP
      });

      if (authError) {
        console.error('❌ Error autentikasi:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          // Kita asumsikan HP salah karena username diambil dari DB
          throw new Error('Nomor HP atau password salah. Pastikan nomor HP yang Anda masukkan benar.');
        }
        throw new Error('Login gagal: ' + authError.message);
      }

      // Pastikan signInData ada sebelum mengakses user
      if (!signInData || !signInData.user) {
        throw new Error('Login gagal. Silakan coba lagi.');
      }

      console.log('✅ Autentikasi berhasil');

      // 5. Ambil profil lengkap setelah login untuk cek role
      const { data: fullProfile, error: fullProfileError } = await supabase
        .from('smpabbs_profiles')
        .select('*') // Ambil semua data profil
        .eq('auth_user_id', signInData.user.id) // Filter berdasarkan user yang login
        .single(); // Ambil satu row

      if (fullProfileError || !fullProfile) {
        console.error('❌ Error ambil profil lengkap setelah login:', fullProfileError);
        throw new Error('Profil tidak ditemukan. Silakan hubungi admin.');
      }

      console.log('👤 Profil lengkap diambil, role:', (fullProfile as ProfileData).role);

      // 6. Redirect berdasarkan role
      if ((fullProfile as ProfileData).role === 'admin') {
        router.push('/smpabbsska/dashboard/admin');
      } else {
        router.push('/smpabbsska/dashboard');
      }

      router.refresh(); // Opsional: refresh state router

    } catch (err) {
      console.error('💥 Error login:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        const supaErr = err as SupabaseError;
        setError(supaErr.message || 'Terjadi kesalahan. Silakan coba lagi.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8 max-w-md w-full">
        <div className="inline-block bg-linear-to-r from-blue-600 to-green-600 text-white font-bold text-xl px-4 py-1 rounded-full shadow-lg mb-2">
          SMP ABBS Surakarta
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
          Login Tryout
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Masuk untuk mengikuti tryout
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            💡 Cukup masukkan <strong>nomor HP</strong> yang kamu daftarkan
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Nomor HP
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors text-lg"
              placeholder="081234567890"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Nomor HP yang kamu pakai saat daftar
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            <strong>Lupa nomor HP?</strong> <br />
            Hubungi admin atau guru SD kamu
          </p>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Belum punya akun?{' '}
            <Link
              href="/smpabbsska/register"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 max-w-md w-full">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 text-center">
          ℹ️ Cara Login
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>1. Masukkan nomor HP yang kamu pakai saat daftar</p>
          <p>2. Klik tombol &quot;Login&quot;</p>
          <p>3. Selesai! Kamu akan masuk ke dashboard</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Username kamu akan dikirim via WhatsApp setelah daftar
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 SMP ABBS Surakarta</p>
      </div>
    </div>
  );
}