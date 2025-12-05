'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tryout = {
  id: string;
  title: string;
  total_questions: number;
};

type User = {
  id: string;
  full_name: string;
  phone: string;
  school: string;
};

type TryoutResult = {
  id: string;
  user_id: string;
  tryout_id: string;
  score: number | null;
  completed_at: string | null;
  answers: any[] | null;
};

type Question = {
  id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  explanation: string | null;
};

export default function UserTryoutResultsPage() {
  const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;
  const userId = params.userId as string;
  
  const [tryout, setTryout] = useState<Tryout | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [result, setResult] = useState<TryoutResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTryoutResult();
  }, [tryoutId, userId]);

  const fetchTryoutResult = async () => {
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
      setError('Anda tidak memiliki akses untuk melihat hasil tryout siswa');
      setLoading(false);
      return;
    }

    try {
      // Fetch tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions')
        .eq('id', tryoutId)
        .single();

      if (tryoutError) throw tryoutError;

      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, school')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Fetch tryout result
      const { data: resultData, error: resultError } = await supabase
        .from('tryout_results')
        .select('*')
        .eq('tryout_id', tryoutId)
        .eq('user_id', userId)
        .single();

      if (resultError) throw resultError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('tryout_id', tryoutId)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;

      setTryout(tryoutData);
      setUser(userData);
      setResult(resultData);
      setQuestions(questionsData || []);
    } catch (err: any) {
      console.error('Error fetching tryout result:', err);
      setError(err.message || 'Gagal memuat hasil tryout');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hasil Tryout Siswa
              </h1>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Kembali
              </button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalQuestions = questions.length;
  const answeredQuestions = result?.answers ? result.answers.length : 0;
  const correctAnswers = result?.answers 
    ? result.answers.filter((answer: any) => {
        const question = questions.find(q => q.question_number === answer.question_number);
        return question && question.correct_answer === answer.selected_answer;
      }).length 
    : 0;
  const score = result?.score || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hasil Tryout Siswa
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {tryout?.title} - {user?.full_name}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>

          {/* User and Tryout Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Siswa</p>
              <p className="font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tryout</p>
              <p className="font-medium text-gray-900 dark:text-white">{tryout?.title}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {result?.completed_at ? 'Selesai' : 'Belum Selesai'}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100">Total Soal</p>
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-3xl font-bold">{totalQuestions}</p>
              <p className="text-sm text-blue-100 mt-1">Jumlah soal</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100">Dijawab</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold">{answeredQuestions}</p>
              <p className="text-sm text-green-100 mt-1">Soal terjawab</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100">Benar</p>
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-3xl font-bold">{correctAnswers}</p>
              <p className="text-sm text-purple-100 mt-1">Jawaban benar</p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-indigo-100">Nilai</p>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold">{score}%</p>
              <p className="text-sm text-indigo-100 mt-1">Skor akhir</p>
            </div>
          </div>

          {/* Question Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Detail Jawaban
            </h2>
            
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Belum ada soal dalam tryout ini</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const userAnswer = result?.answers?.find(
                    (answer: any) => answer.question_number === question.question_number
                  );
                  const isCorrect = userAnswer && question.correct_answer === userAnswer.selected_answer;
                  
                  return (
                    <div 
                      key={question.id} 
                      className={`p-4 rounded-lg border ${
                        userAnswer 
                          ? isCorrect 
                            ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                            : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Soal #{question.question_number}: {question.question_text}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userAnswer 
                            ? isCorrect 
                              ? 'bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                        }`}>
                          {userAnswer ? (isCorrect ? 'Benar' : 'Salah') : 'Belum Dijawab'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Jawaban Siswa:
                          </p>
                          <p className={`p-2 rounded ${
                            userAnswer 
                              ? isCorrect 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-200'
                          }`}>
                            {userAnswer ? `(${userAnswer.selected_answer}) ${getAnswerText(userAnswer.selected_answer, question)}` : '-'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Jawaban Benar:
                          </p>
                          <p className="p-2 rounded bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200">
                            ({question.correct_answer}) {getAnswerText(question.correct_answer, question)}
                          </p>
                        </div>
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Penjelasan:
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-100 dark:bg-gray-700/30 p-3 rounded">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get answer text based on option
function getAnswerText(option: string, question: Question): string {
  switch (option) {
    case 'A':
      return question.option_a;
    case 'B':
      return question.option_b;
    case 'C':
      return question.option_c;
    case 'D':
      return question.option_d;
    case 'E':
      return question.option_e;
    default:
      return '';
  }
}