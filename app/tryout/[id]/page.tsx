'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
};

export default function TryoutPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Ambil data tryout & soal
  useEffect(() => {
    const fetchTryoutData = async () => {
      // Cek session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Ambil durasi tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('duration_minutes')
        .eq('id', tryoutId)
        .single();

      if (tryoutError || !tryoutData) {
        alert('Tryout tidak ditemukan');
        router.push('/dashboard');
        return;
      }

      const totalSeconds = tryoutData.duration_minutes * 60;
      setDuration(totalSeconds);
      setTimeLeft(totalSeconds);

      // Ambil soal
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer_index, explanation')
        .eq('tryout_id', tryoutId)
        .order('created_at', { ascending: true });

      if (questionsError || !questionsData || questionsData.length === 0) {
        alert('Soal tidak tersedia');
        router.push('/dashboard');
        return;
      }

      setQuestions(questionsData);
      const savedAnswers = localStorage.getItem(`tryout_${tryoutId}_answers`);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      } else {
        setAnswers(new Array(questionsData.length).fill(-1));
      }

      setLoading(false);
    };

    fetchTryoutData();
  }, [tryoutId, router]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions.length]);

  // Simpan jawaban sementara
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(`tryout_${tryoutId}_answers`, JSON.stringify(answers));
    }
  }, [answers, tryoutId, questions.length]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
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

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Hitung skor
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer_index) score++;
    });

    // Simpan hasil
    const { error } = await supabase.from('results').insert({
      user_id: session.user.id,
      tryout_id: tryoutId,
      score,
      total_questions: questions.length,
      duration_seconds: duration - timeLeft,
    });

    if (error) {
      console.error('Gagal simpan hasil:', error);
      alert('Gagal menyimpan hasil. Coba lagi.');
      setSubmitting(false);
      return;
    }

    // Hapus cache localStorage
    localStorage.removeItem(`tryout_${tryoutId}_answers`);

    // Redirect ke halaman hasil
    router.push(`/tryout/result?score=${score}&total=${questions.length}&duration=${duration - timeLeft}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat soal...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 py-4 border-b">
          <h1 className="text-xl font-bold">Tryout</h1>
          <div className="bg-red-600 text-white px-3 py-1 rounded font-mono">
            {minutes}:{seconds < 10 ? '0' : ''}{seconds}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Soal {currentQuestionIndex + 1} dari {questions.length}</span>
            <span>
              Terjawab: {answers.filter(a => a !== -1).length}/{questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Soal */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div
            className="text-lg font-medium mb-4"
            dangerouslySetInnerHTML={{
              __html: currentQuestion.question_text.replace(
                /!\[Soal\]\(([^)]+)\)/g,
                '<img src="$1" alt="Soal" class="max-w-full h-auto my-3 rounded" />'
              ),
            }}
          />
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full text-left p-3 rounded border ${
                  answers[currentQuestionIndex] === idx
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {String.fromCharCode(65 + idx)}. {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigasi */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Sebelumnya
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Selesai'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Berikutnya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}