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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchReviewData = async () => {
      const { data : { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Ambil soal
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer_index, explanation')
        .eq('tryout_id', tryoutId)
        .order('created_at', { ascending: true });

      if (questionsError || !questionsData) {
        alert('Soal tidak ditemukan');
        router.push('/dashboard');
        return;
      }

      // Ambil jawaban dari localStorage
      const savedAnswers = localStorage.getItem(`tryout_${tryoutId}_answers`);
      const answersArray = savedAnswers ? JSON.parse(savedAnswers) : new Array(questionsData.length).fill(-1);

      setQuestions(questionsData);
      setAnswers(answersArray);
      setLoading(false);
    };

    fetchReviewData();
  }, [tryoutId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat pembahasan...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = answers[currentQuestionIndex];
  const isCorrect = userAnswer === currentQuestion.correct_answer_index;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 py-4 border-b">
          <h1 className="text-xl font-bold">Pembahasan</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Selesai
          </button>
        </div>

        {/* Navigasi Soal */}
        <div className="mb-6 flex flex-wrap gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                idx === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : answers[idx] === -1
                  ? 'bg-gray-200 text-gray-700'
                  : answers[idx] === questions[idx].correct_answer_index
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Soal */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h2>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              let bgColor = 'border-gray-300';
              if (idx === userAnswer && idx === currentQuestion.correct_answer_index) {
                bgColor = 'border-green-500 bg-green-50';
              } else if (idx === userAnswer) {
                bgColor = 'border-red-500 bg-red-50';
              } else if (idx === currentQuestion.correct_answer_index) {
                bgColor = 'border-green-500 bg-green-50';
              }

              return (
                <div
                  key={idx}
                  className={`p-3 rounded border ${bgColor}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                  {idx === currentQuestion.correct_answer_index && (
                    <span className="ml-2 text-green-600 font-medium">✓ (Benar)</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Penjelasan */}
          {currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Pembahasan:</h3>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigasi */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}