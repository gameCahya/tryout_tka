// components/review/ReviewQuestionCard.tsx
'use client';

import { useState } from 'react';
import { Question } from '@/types/tryout';
import { UserAnswer } from '@/types/review';

type ReviewQuestionCardProps = {
  question: Question;
  userAnswer?: UserAnswer;
  questionNumber: number;
  hasPaid: boolean;
  onUnlockClick: () => void;
};

export default function ReviewQuestionCard({
  question,
  userAnswer,
  questionNumber,
  hasPaid,
  onUnlockClick,
}: ReviewQuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const isCorrect = userAnswer?.is_correct || false;

  const getAnswerStatus = () => {
    if (!userAnswer) return { label: 'Tidak Dijawab', color: 'gray' };
    if (isCorrect) return { label: 'Benar ✓', color: 'green' };
    return { label: 'Salah ✗', color: 'red' };
  };

  const status = getAnswerStatus();

  const renderAnswer = () => {
    if (question.question_type === 'multiple') {
      return (
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isUserAnswer = userAnswer?.user_answers?.includes(index) || false;
            const isCorrectAnswer = question.correct_answers?.includes(index) || false;
            
            let bgColor = 'bg-gray-50 dark:bg-gray-700/30';
            let borderColor = 'border-gray-200 dark:border-gray-600';
            let textColor = 'text-gray-900 dark:text-white';

            if (isUserAnswer && isCorrectAnswer) {
              bgColor = 'bg-green-100 dark:bg-green-900/30';
              borderColor = 'border-green-500 dark:border-green-600';
              textColor = 'text-green-900 dark:text-green-200';
            } else if (isUserAnswer) {
              bgColor = 'bg-red-100 dark:bg-red-900/30';
              borderColor = 'border-red-500 dark:border-red-600';
              textColor = 'text-red-900 dark:text-red-200';
            } else if (isCorrectAnswer) {
              bgColor = 'bg-green-50 dark:bg-green-900/20';
              borderColor = 'border-green-400 dark:border-green-700';
            }

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                  {isUserAnswer && <span className="text-sm">Jawaban Anda</span>}
                  {isCorrectAnswer && <span className="text-sm">✓ Benar</span>}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.question_type === 'reasoning') {
      return (
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const userAns = userAnswer?.user_reasoning?.[index];
            const correctAns = question.reasoning_answers?.[index];
            const isCorrect = userAns === correctAns;

            let bgColor = 'bg-gray-50 dark:bg-gray-700/30';
            let borderColor = 'border-gray-200 dark:border-gray-600';

            if (userAns && isCorrect) {
              bgColor = 'bg-green-100 dark:bg-green-900/30';
              borderColor = 'border-green-500 dark:border-green-600';
            } else if (userAns) {
              bgColor = 'bg-red-100 dark:bg-red-900/30';
              borderColor = 'border-red-500 dark:border-red-600';
            }

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
              >
                <p className="font-medium text-gray-900 dark:text-white mb-2">{option}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    Jawaban Anda: <strong>{userAns || '-'}</strong>
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Benar: <strong>{correctAns}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Single choice
    return (
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isUserAnswer = userAnswer?.user_answer === index;
          const isCorrectAnswer = question.correct_answer_index === index;

          let bgColor = 'bg-gray-50 dark:bg-gray-700/30';
          let borderColor = 'border-gray-200 dark:border-gray-600';
          let textColor = 'text-gray-900 dark:text-white';

          if (isUserAnswer && isCorrectAnswer) {
            bgColor = 'bg-green-100 dark:bg-green-900/30';
            borderColor = 'border-green-500 dark:border-green-600';
            textColor = 'text-green-900 dark:text-green-200';
          } else if (isUserAnswer) {
            bgColor = 'bg-red-100 dark:bg-red-900/30';
            borderColor = 'border-red-500 dark:border-red-600';
            textColor = 'text-red-900 dark:text-red-200';
          } else if (isCorrectAnswer) {
            bgColor = 'bg-green-50 dark:bg-green-900/20';
            borderColor = 'border-green-400 dark:border-green-700';
          }

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {String.fromCharCode(65 + index)}. {option}
                </span>
                {isUserAnswer && <span className="text-sm">Jawaban Anda</span>}
                {isCorrectAnswer && <span className="text-sm">✓ Benar</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Soal #{questionNumber}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.color === 'green'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : status.color === 'red'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
          }`}
        >
          {status.label}
        </span>
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="text-gray-900 dark:text-white prose dark:prose-invert max-w-none">
          {question.question_text}
        </div>
      </div>

      {/* Answers */}
      <div className="mb-6">{renderAnswer()}</div>

      {/* Explanation Section */}
      {question.explanation && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {!hasPaid ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 text-center">
              <div className="text-5xl mb-3">🔒</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Pembahasan Terkunci
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Dapatkan akses pembahasan lengkap dengan penjelasan detail untuk semua soal
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  Rp 15.000
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Akses selamanya untuk tryout ini
                </p>
              </div>
              <button
                onClick={onUnlockClick}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔓 Buka Pembahasan Sekarang
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                  💡 Pembahasan
                </h4>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  {showExplanation ? 'Sembunyikan' : 'Lihat Pembahasan'}
                </button>
              </div>
              {showExplanation && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}