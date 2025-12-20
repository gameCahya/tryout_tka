// app/admin/tryout/[id]/preview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Question } from '@/types/tryout';
import QuestionCard from '@/components/tryout/QuestionCard';

export default function AdminTryoutPreview() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = params.id as string;

  const [tryout, setTryout] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [multipleAnswers, setMultipleAnswers] = useState<number[][]>([]);
  const [reasoningAnswers, setReasoningAnswers] = useState<{ [key: number]: { [key: number]: 'benar' | 'salah' } }>({});
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchTryoutData();
  }, [tryoutId]);

  // Timer (can be paused)
  useEffect(() => {
    if (timeLeft <= 0 || isPaused || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, questions.length]);

  const fetchTryoutData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check if user is admin or teacher
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        alert('Akses ditolak. Hanya admin dan guru yang dapat preview tryout.');
        router.push('/dashboard');
        return;
      }

      // Fetch tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('*')
        .eq('id', tryoutId)
        .single();

      if (tryoutError || !tryoutData) {
        alert('Tryout tidak ditemukan');
        router.push('/admin');
        return;
      }

      setTryout(tryoutData);
      setTimeLeft(tryoutData.duration_minutes * 60);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('tryout_id', tryoutId)
        .order('created_at', { ascending: true });

      if (questionsError || !questionsData || questionsData.length === 0) {
        alert('Soal tidak tersedia');
        router.push('/admin');
        return;
      }

      setQuestions(questionsData);
      setAnswers(new Array(questionsData.length).fill(-1));
      setMultipleAnswers(new Array(questionsData.length).fill(null).map(() => []));
      setReasoningAnswers({});
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
      router.push('/admin');
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleMultipleAnswerToggle = (optionIndex: number) => {
    const newMultipleAnswers = [...multipleAnswers];
    const currentAnswers = newMultipleAnswers[currentQuestionIndex] || [];
    const answerIndex = currentAnswers.indexOf(optionIndex);

    if (answerIndex > -1) {
      currentAnswers.splice(answerIndex, 1);
    } else {
      currentAnswers.push(optionIndex);
    }

    newMultipleAnswers[currentQuestionIndex] = currentAnswers.sort();
    setMultipleAnswers(newMultipleAnswers);
  };

  const handleReasoningAnswerChange = (optionIndex: number, value: 'benar' | 'salah') => {
    const newReasoningAnswers = { ...reasoningAnswers };
    if (!newReasoningAnswers[currentQuestionIndex]) {
      newReasoningAnswers[currentQuestionIndex] = {};
    }
    newReasoningAnswers[currentQuestionIndex][optionIndex] = value;
    setReasoningAnswers(newReasoningAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const getAnsweredCount = () => {
    return questions.filter((q, i) => {
      if (q.question_type === 'multiple') {
        return multipleAnswers[i] && multipleAnswers[i].length > 0;
      } else if (q.question_type === 'reasoning') {
        const userAns = reasoningAnswers[i] || {};
        return Object.keys(userAns).length === q.options.length;
      } else {
        return answers[i] !== -1;
      }
    }).length;
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      let isCorrect = false;

      if (q.question_type === 'multiple' && q.correct_answers) {
        const userAnswers = multipleAnswers[i] || [];
        const correctAnswers = q.correct_answers;
        isCorrect = userAnswers.length === correctAnswers.length &&
          userAnswers.every(ans => correctAnswers.includes(ans));
      } else if (q.question_type === 'reasoning' && q.reasoning_answers) {
        const userAns = reasoningAnswers[i] || {};
        isCorrect = true;
        for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
          if (userAns[optIdx] !== q.reasoning_answers[optIdx]) {
            isCorrect = false;
            break;
          }
        }
      } else {
        isCorrect = answers[i] === q.correct_answer_index;
      }

      if (isCorrect) score++;
    });
    return score;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isQuestionAnswered = (index: number) => {
    const q = questions[index];
    if (q.question_type === 'multiple') {
      return multipleAnswers[index] && multipleAnswers[index].length > 0;
    } else if (q.question_type === 'reasoning') {
      const userAns = reasoningAnswers[index] || {};
      return Object.keys(userAns).length === q.options.length;
    } else {
      return answers[index] !== -1;
    }
  };

  const isQuestionCorrect = (index: number) => {
    const q = questions[index];
    if (q.question_type === 'multiple' && q.correct_answers) {
      const userAnswers = multipleAnswers[index] || [];
      const correctAnswers = q.correct_answers;
      return userAnswers.length === correctAnswers.length &&
        userAnswers.every(ans => correctAnswers.includes(ans));
    } else if (q.question_type === 'reasoning' && q.reasoning_answers) {
      const userAns = reasoningAnswers[index] || {};
      for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
        if (userAns[optIdx] !== q.reasoning_answers[optIdx]) {
          return false;
        }
      }
      return true;
    } else {
      return answers[index] === q.correct_answer_index;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat preview...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const score = calculateScore();
  const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Admin Preview Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-700 dark:to-purple-900 p-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👁️</span>
                <h1 className="text-2xl font-bold">Mode Preview - Admin</h1>
              </div>
              <p className="text-purple-100">{tryout?.title}</p>
              <p className="text-sm text-purple-200 mt-1">
                ⚠️ Ini adalah mode preview. Jawaban tidak akan disimpan ke database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                {isPaused ? '▶️ Lanjutkan' : '⏸️ Pause'}
              </button>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
              >
                {showAnswers ? '🙈 Sembunyikan Jawaban' : '👁️ Tampilkan Jawaban'}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                ❌ Keluar Preview
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Timer & Progress */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                  {isPaused && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                      ⏸️ Paused
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Soal {currentQuestionIndex + 1} dari {questions.length} • 
                  {showAnswers && ` Skor: ${score}/${questions.length} (${percentage.toFixed(1)}%)`}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getAnsweredCount()}/{questions.length} Dijawab
                </span>
              </div>
            </div>

            {/* Question Card with Answer Indicator */}
            <div className="relative">
              {showAnswers && (
                <div className={`absolute -top-3 right-4 z-10 px-4 py-2 rounded-lg text-white font-bold shadow-lg ${
                  isQuestionAnswered(currentQuestionIndex) && isQuestionCorrect(currentQuestionIndex)
                    ? 'bg-green-600'
                    : isQuestionAnswered(currentQuestionIndex)
                    ? 'bg-red-600'
                    : 'bg-gray-600'
                }`}>
                  {isQuestionAnswered(currentQuestionIndex)
                    ? isQuestionCorrect(currentQuestionIndex) ? '✅ Benar' : '❌ Salah'
                    : '⚪ Belum Dijawab'
                  }
                </div>
              )}
              
              <QuestionCard
                question={currentQuestion}
                selectedAnswer={answers[currentQuestionIndex]}
                selectedMultipleAnswers={multipleAnswers[currentQuestionIndex] || []}
                selectedReasoningAnswers={reasoningAnswers[currentQuestionIndex] || {}}
                onAnswerSelect={handleAnswerSelect}
                onMultipleAnswerToggle={handleMultipleAnswerToggle}
                onReasoningAnswerChange={handleReasoningAnswerChange}
              />

              {/* Show Correct Answer */}
              {showAnswers && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                    ✅ Jawaban Benar:
                  </h3>
                  {currentQuestion.question_type === 'single' && (
                    <p className="text-blue-800 dark:text-blue-300">
                      Opsi ke-{currentQuestion.correct_answer_index + 1}: {currentQuestion.options[currentQuestion.correct_answer_index]}
                    </p>
                  )}
                  {currentQuestion.question_type === 'multiple' && currentQuestion.correct_answers && (
                    <p className="text-blue-800 dark:text-blue-300">
                      Opsi: {currentQuestion.correct_answers.map(idx => `${idx + 1} (${currentQuestion.options[idx]})`).join(', ')}
                    </p>
                  )}
                  {currentQuestion.question_type === 'reasoning' && currentQuestion.reasoning_answers && (
                    <div className="space-y-1">
                      {currentQuestion.options.map((opt, idx) => (
                        <p key={idx} className="text-blue-800 dark:text-blue-300">
                          {idx + 1}. {opt}: <span className="font-bold">{currentQuestion.reasoning_answers![idx]}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {currentQuestion.explanation && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">💡 Penjelasan:</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Selanjutnya →
              </button>
            </div>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>🗂️</span>
                <span>Navigasi Soal</span>
              </h3>
              <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                {questions.map((q, idx) => {
                  const answered = isQuestionAnswered(idx);
                  const correct = isQuestionCorrect(idx);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuestionSelect(idx)}
                      className={`
                        aspect-square rounded-lg font-bold text-sm transition-all
                        ${idx === currentQuestionIndex
                          ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 scale-110'
                          : ''
                        }
                        ${showAnswers && answered && correct
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : showAnswers && answered && !correct
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : answered
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-gray-600 dark:text-gray-400">Belum dijawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Sudah dijawab</span>
                </div>
                {showAnswers && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Jawaban benar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Jawaban salah</span>
                    </div>
                  </>
                )}
              </div>

              {/* Preview Stats */}
              {showAnswers && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    📊 Statistik Preview
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Skor:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{score}/{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Persentase:</span>
                      <span className={`font-bold ${percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-blue-600' : 'text-red-600'}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dijawab:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{getAnsweredCount()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}