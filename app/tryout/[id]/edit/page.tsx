'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type TryoutForm = {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
};

export default function EditTryoutPage() {
  const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;
  
  const [formData, setFormData] = useState<TryoutForm>({
    id: '',
    title: '',
    total_questions: 10,
    duration_minutes: 60,
    start_time: null,
    end_time: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTryout();
  }, [tryoutId]);

  const fetchTryout = async () => {
    setLoading(true);
    setError(null);

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

    if (profileError || !profileData || !['admin', 'teacher'].includes(profileData.role)) {
      setError('Anda tidak memiliki akses untuk mengedit tryout');
      setLoading(false);
      return;
    }

    try {
      // Fetch tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions, duration_minutes, start_time, end_time')
        .eq('id', tryoutId)
        .single();

      if (tryoutError) throw tryoutError;

      setFormData(tryoutData);
    } catch (err: any) {
      console.error('Error fetching tryout:', err);
      setError(err.message || 'Gagal memuat data tryout');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Sesi tidak ditemukan, silakan login kembali');
      setSubmitting(false);
      return;
    }

    // Check if user has teacher or admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData || !['admin', 'teacher'].includes(profileData.role)) {
      setError('Anda tidak memiliki akses untuk mengedit tryout');
      setSubmitting(false);
      return;
    }

    try {
      // Update tryout
      const { error: updateError } = await supabase
        .from('tryouts')
        .update({
          title: formData.title,
          total_questions: formData.total_questions,
          duration_minutes: formData.duration_minutes,
          start_time: formData.start_time,
          end_time: formData.end_time,
        })
        .eq('id', tryoutId);

      if (updateError) throw updateError;

      // Redirect to questions page
      router.push(`/tryout/${tryoutId}/questions`);
    } catch (err: any) {
      console.error('Error updating tryout:', err);
      setError(err.message || 'Gagal mengupdate tryout');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Tryout
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
                Judul Tryout
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
                  Jumlah Soal
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
                  Durasi (menit)
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
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                  submitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Mengupdate...' : 'Update Tryout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}