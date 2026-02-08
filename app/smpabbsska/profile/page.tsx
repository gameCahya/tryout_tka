'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface ProfileData {
  id: string;
  auth_user_id: string;
  username: string;
  full_name: string;
  phone: string;
  school?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    school: '',
  });

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/smpabbsska/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('smpabbs_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profil tidak ditemukan');

        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          school: profileData.school || '',
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Gagal memuat profil. Silakan login kembali.');
        router.push('/smpabbsska/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      if (!profile) throw new Error('Profil tidak valid');

      // Validasi nama lengkap
      if (formData.full_name.trim().length < 3) {
        throw new Error('Nama lengkap minimal 3 karakter');
      }

      const { error: updateError } = await supabase
        .from('smpabbs_profiles')
        .update({
          full_name: formData.full_name.trim(),
          school: formData.school.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name.trim(),
        school: formData.school.trim() || prev.school,
      } : null);
      
      setSuccess('Profil berhasil diperbarui!');
      setEditMode(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memperbarui profil. Silakan coba lagi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/smpabbsska/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Gagal logout. Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-linear-to-r from-blue-600 to-green-600 text-white font-bold text-xl px-4 py-1 rounded-full shadow-lg mb-4">
            SMP ABBS Surakarta
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Profil Saya
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Kelola informasi akun Anda
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
            <p className="text-green-700 dark:text-green-300 font-medium">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header Section */}
          <div className="bg-linear-to-r from-blue-600 to-green-600 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Informasi Profil</h2>
                <p className="mt-1 opacity-90">Detail akun Anda di platform tryout</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                  >
                    <span>✏️</span>
                    <span className="ml-2">Edit Profil</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          full_name: profile.full_name || '',
                          school: profile.school || '',
                        });
                        setError('');
                        setSuccess('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={saving}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <span>✅</span>
                          <span className="ml-2">Simpan Perubahan</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Username Section */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">ID</span>
                  Username Akun
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                    {profile.username}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Username ini digunakan untuk login ke sistem tryout
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi Pribadi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Nama Lengkap
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        required
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {profile.full_name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Nomor HP
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {profile.phone}
                      </p>
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Digunakan sebagai password login
                      </p>
                    </div>
                  </div>

                  {/* School */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Sekolah Asal
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="school"
                        value={formData.school}
                        onChange={handleInputChange}
                        placeholder="Contoh: SD Negeri 1 Surakarta"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <p className="text-lg text-gray-900 dark:text-white">
                          {profile.school || 'Belum diisi'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi Akun
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status Akun</p>
                    <p className={`mt-1 text-lg font-semibold ${
                      profile.is_active 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {profile.is_active ? 'Aktif' : 'Belum Aktif'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role Pengguna</p>
                    <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {profile.role === 'admin' ? 'Administrator' : 'Siswa'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Daftar</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(profile.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID Profil</p>
                    <p className="mt-1 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 break-all">
                      {profile.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 gap-4">
                <div>
                  <Link
                    href={profile.role === 'admin' 
                      ? '/smpabbsska/dashboard/admin' 
                      : '/smpabbsska/dashboard'
                    }
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>⬅️</span>
                    <span className="ml-2">Kembali ke Dashboard</span>
                  </Link>
                </div>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md"
                >
                  <span>🚪</span>
                  <span className="ml-2">Logout Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">ℹ️</span>
            Bantuan Profil
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-300">
            <p>• Untuk mengubah nomor HP, silakan hubungi admin sekolah Anda</p>
            <p>• Username tidak dapat diubah karena digunakan sebagai identitas akun</p>
            <p>• Perubahan profil akan langsung tersimpan ke database</p>
            <p>• Jika menemui masalah, hubungi tim teknis SMP ABBS Surakarta</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              📞 Kontak Admin: 0812-3456-7890 (Bpk/Ibu Guru)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
