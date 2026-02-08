// app/smpabbsska/tryout/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// Interfaces
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

// Tipe data dari database (mungkin bisa null)
interface RawQuestionData {
  id: string;
  question_text: string;
  options: string[]; // Pastikan ini benar-benar string[]
  correct_answer_index: number | null; // Bisa null di database
}

// Tipe data internal untuk komponen
interface TryoutQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number; // Tidak boleh null untuk keperluan internal
}

interface TryoutData {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
}

interface UserAnswer {
  question_id: string;
  user_answer: number;
  is_correct: boolean;
}

interface ResultData {
  id: string;
  total_score: number;
  total_questions: number;
  percentage: number;
  time_used: number;
  completed_at: string;
  smpabbs_user_answers?: UserAnswer[];
}

export default function TryoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tryout, setTryout] = useState<TryoutData | null>(null);
  const [questions, setQuestions] = useState<TryoutQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // question_id: selected_option_index
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  const handleSubmitTryout = useCallback(async () => {
    if (isSubmitting || !profile || !tryout) return;
    setIsSubmitting(true);

    try {
      let correctCount = 0;
      const userAnswersData: Array<{question_id: string, user_answer: number, is_correct: boolean}> = [];
      
      questions.forEach((q: TryoutQuestion) => {
        const userAnswer = answers[q.id] !== undefined ? answers[q.id] : -1;
        const isCorrect = userAnswer !== -1 && userAnswer === q.correct_answer_index && q.correct_answer_index >= 0;
        
        if (isCorrect) {
          correctCount++;
        }

        userAnswersData.push({
          question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect
        });
      });

      const percentage = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
      const timeUsed = tryout.duration_minutes * 60 - timeLeft;

      // Simpan hasil tryout ke tabel results
      const { data: resultData, error: resultError } = await supabase
        .from('smpabbs_results')
        .insert({
          user_id: profile.id,
          tryout_id: tryoutId,
          total_score: correctCount,
          total_questions: questions.length,
          percentage: percentage,
          time_used: timeUsed,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (resultError) {
        throw new Error(`Gagal menyimpan hasil: ${resultError.message}`);
      }

      // Simpan jawaban user ke tabel user_answers
      if (resultData) {
        const userAnswersPromises = userAnswersData.map(answer => 
          supabase.from('smpabbs_user_answers').insert({
            result_id: resultData.id,
            question_id: answer.question_id,
            user_answer: answer.user_answer,
            is_correct: answer.is_correct
          })
        );

        const results = await Promise.all(userAnswersPromises);
        const hasError = results.some(r => r.error);
        
        if (hasError) {
          console.error('Error saving some answers');
        }
      }

      // Ambil data result lengkap dengan user answers
      const { data: fullResultData, error: fetchError } = await supabase
        .from('smpabbs_results')
        .select(`
          *,
          smpabbs_user_answers (
            question_id,
            user_answer,
            is_correct
          )
        `)
        .eq('id', resultData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching result details:', fetchError);
      }

      setResult(fullResultData || resultData);
      setShowResults(true);

    } catch (err) {
      console.error('Submission error:', err);
      setError('Gagal menyimpan hasil tryout. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, questions, profile, tryoutId, tryout, timeLeft, supabase]);

  // Cek auth dan load profil + tryout data
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // Struktur yang benar untuk getSession()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw new Error('Sesi tidak valid. Silakan login kembali.');
        }

        const session = sessionData.session;
        
        if (!session) {
          router.push('/smpabbsska/login');
          return;
        }

        // Struktur yang benar untuk fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('smpabbs_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError);
          throw new Error('Profil tidak ditemukan.');
        }

        setProfile(profileData);

        // Ambil data tryout berdasarkan ID
        const { data: tryoutData, error: tryoutError } = await supabase
          .from('smpabbs_tryouts')
          .select('id, title, description, total_questions, duration_minutes, is_active')
          .eq('id', tryoutId)
          .single();

        if (tryoutError || !tryoutData) {
          console.error('Error fetching tryout:', tryoutError);
          throw new Error('Tryout tidak ditemukan.');
        }

        if (!tryoutData.is_active) {
          throw new Error('Tryout ini sudah tidak aktif.');
        }

        setTryout(tryoutData);

        // Ambil soal-soal berdasarkan tryout_id
        const { data: questionData, error: questionError } = await supabase
          .from('smpabbs_questions')
          .select('id, question_text, options, correct_answer_index')
          .eq('tryout_id', tryoutId)
          .order('created_at', { ascending: true });

        if (questionError || !questionData) {
          console.error('Error fetching questions:', questionError);
          throw new Error('Soal tryout tidak ditemukan.');
        }

        // --- MAPPING DATA DARI DATABASE KE TIPE INTERNAL ---
        const mappedQuestions: TryoutQuestion[] = questionData.map((rawQuestion: RawQuestionData) => {
          const correctIndex = rawQuestion.correct_answer_index ?? -1;
          const optionsList = Array.isArray(rawQuestion.options) ? rawQuestion.options : [];
          return {
            id: rawQuestion.id,
            question_text: rawQuestion.question_text,
            options: optionsList,
            correct_answer_index: correctIndex,
          };
        });

        if (mappedQuestions.length === 0) {
          throw new Error('Belum ada soal untuk tryout ini.');
        }

        setQuestions(mappedQuestions);

        // Set waktu berdasarkan durasi tryout
        const initialTime = tryoutData.duration_minutes * 60;
        setTimeLeft(initialTime);

        // Cek apakah user sudah pernah mengerjakan tryout ini
        const { data: previousResult } = await supabase
          .from('smpabbs_results')
          .select(`
            *,
            smpabbs_user_answers (
              question_id,
              user_answer,
              is_correct
            )
          `)
          .eq('user_id', profileData.id)
          .eq('tryout_id', tryoutId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (previousResult) {
          setResult(previousResult);
          setShowResults(true);
          
          // Load jawaban sebelumnya ke state answers
          if (previousResult.smpabbs_user_answers) {
            const previousAnswers: Record<string, number> = {};
            previousResult.smpabbs_user_answers.forEach((answer: UserAnswer) => {
              if (answer.user_answer !== -1) {
                previousAnswers[answer.question_id] = answer.user_answer;
              }
            });
            setAnswers(previousAnswers);
          }
        }

      } catch (err: unknown) {
        console.error('Error loading tryout:', err);
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat tryout. Silakan coba lagi atau hubungi admin.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [supabase, router, tryoutId]);

  // Timer effect
  useEffect(() => {
    if (loading || showResults || !tryout || isTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          handleSubmitTryout(); // Submit otomatis saat waktu habis
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, showResults, tryout, isTimeUp, handleSubmitTryout]);

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev: Record<string, number>) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins} menit ${secs > 0 ? `${secs} detik` : ''}`;
    }
    return `${secs} detik`;
  };

  const calculateProgress = (): number => {
    if (questions.length === 0) return 0;
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-xl text-gray-700 dark:text-gray-300 font-medium">Memuat soal tryout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href="/smpabbsska/dashboard"
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kembali ke Dashboard
              </Link>
              <Link
                href="/smpabbsska/tryout"
                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Lihat Tryout Lain
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !tryout) {
    return null;
  }

  if (showResults && result) {
    const userAnswersMap = result.smpabbs_user_answers 
      ? result.smpabbs_user_answers.reduce((acc: Record<string, UserAnswer>, answer: UserAnswer) => {
          acc[answer.question_id] = answer;
          return acc;
        }, {})
      : {};

    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-linear-to-r from-green-600 to-blue-600 p-8 text-white text-center">
              <h1 className="text-3xl font-bold">Hasil Tryout</h1>
              <p className="mt-2 text-xl opacity-90">
                {isTimeUp ? 'Waktu telah habis!' : 'Selamat!'} {profile.full_name}
              </p>
              <p className="mt-1 opacity-80">{tryout.title}</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-linear-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 mb-4">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {result.percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{result.total_score}</div>
                <div className="text-gray-600 dark:text-gray-300 text-lg">dari {result.total_questions} Soal Benar</div>
                
                <div className="mt-6 w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-linear-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${result.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Waktu pengerjaan: {formatDuration(result.time_used)}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selesai: {new Date(result.completed_at).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Detail Jawaban</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Soal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Jawaban Anda
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {questions.map((q: TryoutQuestion, index: number) => {
                        const userAnswer = userAnswersMap[q.id];
                        const isAnswered = userAnswer && userAnswer.user_answer !== -1;
                        const userAnswerText = isAnswered ? q.options[userAnswer.user_answer] : 'Tidak dijawab';
                        const isCorrect = userAnswer ? userAnswer.is_correct : false;
                        
                        return (
                          <tr key={q.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                              {q.question_text}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {userAnswerText}
                              </span>
                              {!isCorrect && q.correct_answer_index >= 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Jawaban benar: {q.options[q.correct_answer_index]}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isCorrect
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : isAnswered
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }`}>
                                {isCorrect ? 'Benar' : isAnswered ? 'Salah' : 'Tidak dijawab'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
                <Link
                  href="/smpabbsska/tryout"
                  className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Coba Tryout Lain
                </Link>
                <Link
                  href="/smpabbsska/dashboard"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 SMP ABBS Surakarta - Hasil Tryout</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-linear-to-r from-blue-600 to-green-600 text-white font-bold text-xl px-4 py-1 rounded-full shadow-md">
                ABBS
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tryout: {tryout.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tryout.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              <button
                onClick={handleSubmitTryout}
                disabled={isSubmitting}
                className="px-4 py-2 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? 'Memproses...' : 'Selesaikan Tryout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informasi Tryout</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {questions.length} Soal
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {tryout.duration_minutes} Menit
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {profile.full_name}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateProgress()}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Selesai</div>
              </div>
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-linear-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Soal Tryout</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.keys(answers).length} dari {questions.length} dijawab
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Soal tryout belum tersedia.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((question: TryoutQuestion, index: number) => (
                  <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="shrink-0">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full mr-4 font-bold ${
                          answers[question.id] !== undefined
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{question.question_text}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {question.options.map((option: string, optIndex: number) => (
                            <label 
                              key={optIndex} 
                              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                answers[question.id] === optIndex
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={optIndex}
                                checked={answers[question.id] === optIndex}
                                onChange={() => handleAnswerSelect(question.id, optIndex)}
                                className="sr-only"
                              />
                              <span className="mr-3 font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                              <span className="flex-1">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Submit Button for Mobile */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{Object.keys(answers).length}</span> dari <span className="font-semibold">{questions.length}</span> soal terjawab
              </div>
              <button
                onClick={handleSubmitTryout}
                disabled={isSubmitting}
                className="px-6 py-3 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isSubmitting ? 'Memproses...' : 'Selesaikan Tryout'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/smpabbsska/tryout"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Daftar Tryout
          </Link>
          <Link
            href="/smpabbsska/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ke Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}