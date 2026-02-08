'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type TryoutForm = {
  title: string;
  total_questions: number;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  explanation_price: number;
};

export default function CreateTryoutPage() {
  const [formData, setFormData] = useState<TryoutForm>({
    title: '',
    total_questions: 10,
    duration_minutes: 60,
    start_time: null,
    end_time: null,
    explanation_price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_questions' || name === 'duration_minutes' || name === 'explanation_price' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sesi tidak ditemukan, silakan login kembali');
        setLoading(false);
        return;
      }

      // Check if user has teacher or admin role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Gagal memverifikasi akses pengguna');
        setLoading(false);
        return;
      }

      if (!profileData || !['admin', 'teacher'].includes(profileData.role)) {
        setError('Anda tidak memiliki akses untuk membuat tryout');
        setLoading(false);
        return;
      }

      // Validate form data
      if (!formData.title.trim()) {
        setError('Judul tryout tidak boleh kosong');
        setLoading(false);
        return;
      }

      if (formData.total_questions < 1) {
        setError('Jumlah soal minimal 1');
        setLoading(false);
        return;
      }

      if (formData.duration_minutes < 1) {
        setError('Durasi minimal 1 menit');
        setLoading(false);
        return;
      }

      // Create tryout with teacher_id
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .insert([{
          title: formData.title.trim(),
          total_questions: formData.total_questions,
          duration_minutes: formData.duration_minutes,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          explanation_price: formData.explanation_price || 0,
          teacher_id: session.user.id, // Changed from created_by to teacher_id
        }])
        .select()
        .single();

      if (tryoutError) {
        console.error('Error creating tryout:', tryoutError);
        throw tryoutError;
      }

      if (!tryoutData) {
        throw new Error('Data tryout tidak ditemukan setelah dibuat');
      }

      // Redirect to question creation page
      router.push(`/tryout/${tryoutData.id}/questions`);
    } catch (err: any) {
      console.error('Error creating tryout:', err);
      setError(err.message || 'Gagal membuat tryout');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Buat Tryout Baru
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Judul Tryout <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:bg-gray-700 dark:text-white"
                placeholder="Masukkan judul tryout"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="total_questions" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Jumlah Soal <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="total_questions"
                  name="total_questions"
                  value={formData.total_questions}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="duration_minutes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Durasi (menit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Harga (Rp)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.explanation_price}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:bg-gray-700 dark:text-white"
                placeholder="0 untuk gratis"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kosongkan atau isi 0 jika tryout gratis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Waktu Mulai (opsional)
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Jika diisi, tryout hanya bisa diakses setelah waktu ini
                </p>
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Waktu Berakhir (opsional)
                </label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white dark:bg-gray-700/50 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Jika diisi, tryout tidak bisa diakses setelah waktu ini
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Membuat...
                  </span>
                ) : (
                  'Buat Tryout'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}