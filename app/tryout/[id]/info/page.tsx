'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tryout = {
  id: string;
  title: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  start_time?: string | null; // Time when tryout becomes available (may not exist in DB yet)
  created_at: string;
};

type Question = {
  id: string;
  question_text: string;
  options: string[];
  question_type: string | null;
};

export default function TryoutInfoPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = params.id as string;

  const [tryout, setTryout] = useState<Tryout | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTryoutInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Get user profile to check role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          router.push('/auth/login');
          return;
        }

        // Get tryout data
        const { data: tryoutData, error: tryoutError } = await supabase
          .from('tryouts')
          .select('id, title, description, total_questions, duration_minutes, created_at')
          .eq('id', tryoutId)
          .single();

        if (tryoutError || !tryoutData) {
          setError('Tryout tidak ditemukan');
          setLoading(false);
          return;
        }

        // Fetch tryout with start_time separately to handle backward compatibility
        const { data: tryoutWithStartTime, error: tryoutWithStartTimeError } = await supabase
          .from('tryouts')
          .select('start_time')
          .eq('id', tryoutId)
          .single();

        // Check access based on role and start_time if column exists
        let hasAccess = true;
        if (!tryoutWithStartTimeError && tryoutWithStartTime) {
          const now = new Date();
          const startTime = tryoutWithStartTime.start_time ? new Date(tryoutWithStartTime.start_time) : null;
          
          // If user is not admin and tryout has a start_time that hasn't passed yet, deny access
          if (profileData?.role !== 'admin' && startTime && startTime > now) {
            hasAccess = false;
          }
        }

        if (!hasAccess) {
          setError('Tryout ini belum tersedia. Silakan kembali pada waktu yang telah ditentukan.');
          setLoading(false);
          return;
        }

        setTryout(tryoutData);

        // Get questions for the tryout
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, options, question_type')
          .eq('tryout_id', tryoutId)
          .order('created_at', { ascending: true });

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
        } else {
          setQuestions(questionsData || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching tryout info:', err);
        setError('Terjadi kesalahan saat memuat informasi tryout');
        setLoading(false);
      }
    };

    fetchTryoutInfo();
  }, [tryoutId, router]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleStart = () => {
    router.push(`/tryout/${tryoutId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat informasi tryout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-6 my-8 text-center">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={handleBack}
              className="mt-4 bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-6 my-8 text-center">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">Tryout Tidak Ditemukan</h3>
            <p className="text-yellow-700 dark:text-yellow-300">Tryout yang Anda cari tidak ditemukan.</p>
            <button
              onClick={handleBack}
              className="mt-4 bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <span>←</span>
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tryout.title}</h1>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <span>📝</span>
                  <span>{tryout.total_questions} soal</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <span>⏱️</span>
                  <span>{tryout.duration_minutes} menit</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <span>🕒</span>
                  <span>
                    {tryout.start_time 
                      ? new Date(tryout.start_time).toLocaleString('id-ID') 
                      : 'Tidak ada batas waktu'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {tryout.description && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Deskripsi</h2>
              <p className="text-gray-700 dark:text-gray-300">{tryout.description}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
            >
              Mulai Tryout
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>

        {/* Questions Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preview Soal</h2>
          
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Belum ada soal dalam tryout ini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.slice(0, 5).map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[30px]">#{index + 1}</span>
                    <div className="flex-1">
                      <div 
                        className="text-gray-900 dark:text-white mb-3"
                        dangerouslySetInnerHTML={{ __html: question.question_text.replace(/\n/g, '<br>') }}
                      />
                      
                      {question.question_type && (
                        <div className="mb-3">
                          <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                            {question.question_type === 'multiple' 
                              ? 'PGK MCMA - Pilih lebih dari satu jawaban' 
                              : question.question_type === 'reasoning' 
                                ? 'PGK Kategori - Tentukan Benar/Salah' 
                                : 'Pilihan Ganda'}
                          </span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-start gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[20px]">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {questions.length > 5 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Dan {questions.length - 5} soal lainnya...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}