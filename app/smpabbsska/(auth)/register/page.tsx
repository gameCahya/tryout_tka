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
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Generate username di client
  const generateUsername = (fullName: string, sdAsal: string): string => {
    const firstName = fullName
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .substring(0, 15);

    const sdLower = sdAsal.toLowerCase();
    let sdAbbrev = 'sd';

    if (sdLower.includes('negeri')) {
      const numbers = sdAsal.match(/\d+/);
      sdAbbrev = 'sdn' + (numbers ? numbers[0] : '');
    } else if (sdLower.includes('muhammadiyah') || sdLower.includes('muh')) {
      const numbers = sdAsal.match(/\d+/);
      sdAbbrev = 'sdm' + (numbers ? numbers[0] : '');
    } else if (sdLower.includes('islam')) {
      const parts = sdLower.replace('sd islam', '').trim().split(' ');
      if (parts.length >= 2) {
        sdAbbrev = 'sdi' + parts[0].charAt(0) + parts[1].charAt(0);
      } else if (parts[0]) {
        sdAbbrev = 'sdi' + parts[0].substring(0, 3);
      } else {
        sdAbbrev = 'sdi';
      }
    } else if (sdLower.includes('kristen')) {
      const numbers = sdAsal.match(/\d+/);
      sdAbbrev = 'sdk' + (numbers ? numbers[0] : '');
    } else if (sdLower.includes('katolik')) {
      const numbers = sdAsal.match(/\d+/);
      sdAbbrev = 'sdka' + (numbers ? numbers[0] : '');
    } else {
      const words = sdLower.replace('sd', '').trim().split(' ').filter(w => w);
      if (words.length > 0) {
        const initials = words.slice(0, 3).map(w => w.charAt(0)).join('');
        sdAbbrev = 'sd' + initials;
      }
    }

    const timestamp = Date.now().toString().slice(-3);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const counter = timestamp + random;

    return `${firstName}_${sdAbbrev}_${counter}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🚀 Registration started...');
    console.log('Form data:', formData);

    try {
      // Validasi
      if (formData.phone.length < 10) {
        throw new Error('Nomor HP minimal 10 digit');
      }

      if (formData.full_name.trim().length < 3) {
        throw new Error('Nama minimal 3 karakter');
      }

      if (!formData.sd_asal.trim()) {
        throw new Error('Asal SD harus diisi');
      }

      // Cek apakah nomor HP sudah terdaftar
      console.log('🔍 Checking if phone already exists...');
      const { data: existingProfile } = await supabase
        .from('smpabbs_profiles')
        .select('phone')
        .eq('phone', formData.phone)
        .maybeSingle();

      if (existingProfile) {
        throw new Error('Nomor HP sudah terdaftar. Silakan login.');
      }
      console.log('✅ Phone number available');

      // Generate username
      const username = generateUsername(formData.full_name, formData.sd_asal);
      const email = `${username}@smpabbs.local`;

      console.log('📝 Generated credentials:');
      console.log('  Username:', username);
      console.log('  Email:', email);
      console.log('  Password: [HIDDEN]');

      // Create auth user
      console.log('👤 Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.phone,
        options: {
          data: {
            username: username,
            full_name: formData.full_name,
          },
          emailRedirectTo: undefined,
        },
      });

      // DETAILED ERROR LOGGING
      if (authError) {
        console.error('❌ Auth Error Details:');
        console.error('  Message:', authError.message);
        console.error('  Name:', authError.name);
        console.error('  Status:', authError.status);
        console.error('  Full error:', authError);
        
        // User-friendly error messages
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Email confirmation required. Please contact admin to disable email confirmation in Supabase settings.');
        }
        
        if (authError.message.includes('already registered')) {
          throw new Error('Email sudah terdaftar. Silakan coba dengan data berbeda atau login.');
        }

        if (authError.message.includes('Invalid email')) {
          throw new Error('Format email tidak valid. Silakan hubungi admin.');
        }
        
        throw new Error('Gagal membuat akun: ' + authError.message);
      }
      
      if (!authData.user) {
        console.error('❌ No user data returned from signUp');
        throw new Error('Gagal membuat akun. Tidak ada data user.');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Insert profile
      console.log('💾 Inserting profile...');
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

      if (profileError) {
        console.error('❌ Profile Error Details:');
        console.error('  Message:', profileError.message);
        console.error('  Code:', profileError.code);
        console.error('  Details:', profileError.details);
        console.error('  Hint:', profileError.hint);
        console.error('  Full error:', profileError);
        
        throw new Error('Gagal menyimpan data: ' + profileError.message);
      }

      console.log('✅ Profile created successfully');
      console.log('🎉 Registration completed!');

      // Show success
      setSuccess(true);

    } catch (err) {
      console.error('💥 Registration failed:', err);
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
    router.push('/smpabbsska/login');
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Pendaftaran Berhasil!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Selamat datang, {formData.full_name}
              </p>
            </div>

            <div className="bg-linear-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 mb-6 border border-blue-100 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
                Untuk Login:
              </h3>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
                  Masukkan nomor HP kamu:
                </p>
                <p className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                  {formData.phone}
                </p>
              </div>

              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                  💡 Login cukup pakai nomor HP ini saja
                </p>
              </div>
            </div>

            <button
              onClick={handleGoToLogin}
              className="w-full bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Login Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-green-600 text-white text-2xl font-bold mb-4 shadow-lg">
            A
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Daftar Tryout
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            SMP ABBS Surakarta
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              ✨ <strong>Super mudah!</strong><br />
              Isi 3 data, login pakai nomor HP
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-2">Error:</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <p className="text-red-500 dark:text-red-300 text-xs mt-2">
                💡 Buka Console (F12) untuk detail error
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                placeholder="Ahmad Rizki"
              />
            </div>

            <div>
              <label htmlFor="sd_asal" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Asal SD
              </label>
              <input
                type="text"
                id="sd_asal"
                name="sd_asal"
                required
                value={formData.sd_asal}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                placeholder="SD Negeri 1 Surakarta"
              />
            </div>

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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                placeholder="081234567890"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📱 Nomor HP ini untuk login nanti
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
                'Daftar Sekarang'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Sudah punya akun?{' '}
              <Link
                href="/smpabbsska/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 SMP ABBS Surakarta</p>
        </div>
      </div>
    </div>
  );
}