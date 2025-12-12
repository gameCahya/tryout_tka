// components/review/ReviewNavigator.tsx
'use client';

import { useState } from 'react';

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[] | null;
  reasoning_answers: { [key: number]: 'benar' | 'salah' } | null;
  question_type: 'single' | 'multiple' | 'reasoning';
  explanation: string;
};

type UserAnswer = {
  question_id: string;
  user_answer: number;
  user_answers: number[];
  user_reasoning: { [key: number]: 'benar' | 'salah' };
  is_correct: boolean;
};

type ReviewNavigatorProps = {
  questions: Question[];
  currentIndex: number;
  userAnswers: Map<string, UserAnswer>;
  onQuestionSelect: (index: number) => void;
};

export default function ReviewNavigator({
  questions,
  currentIndex,
  userAnswers,
  onQuestionSelect,
}: ReviewNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate statistics
  const correctCount = questions.filter((q, i) => 
    i !== currentIndex && userAnswers.get(q.id)?.is_correct
  ).length;

  const incorrectCount = questions.filter((q, i) => 
    i !== currentIndex && userAnswers.get(q.id) && !userAnswers.get(q.id)?.is_correct
  ).length;

  const getQuestionStatus = (index: number, questionId: string): 'current' | 'correct' | 'incorrect' | 'unanswered' => {
    if (index === currentIndex) return 'current';
    const answer = userAnswers.get(questionId);
    if (!answer) return 'unanswered';
    return answer.is_correct ? 'correct' : 'incorrect';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'correct':
        return 'bg-green-500 dark:bg-green-600 text-white';
      case 'incorrect':
        return 'bg-red-500 dark:bg-red-600 text-white';
      case 'current':
        return 'bg-blue-600 dark:bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-400';
      default:
        return 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-full shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigator Panel */}
      <div
        className={`
          fixed lg:sticky top-0 right-0 h-screen lg:h-auto
          w-80 lg:w-full
          bg-white dark:bg-gray-800 
          shadow-lg lg:shadow-none
          z-40 lg:z-0
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Navigasi Soal
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 dark:text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-4 grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(index, question.id);
            const colorClass = getStatusColor(status);

            return (
              <button
                key={question.id}
                onClick={() => {
                  onQuestionSelect(index);
                  setIsOpen(false);
                }}
                className={`
                  p-2 rounded text-sm font-medium transition-colors
                  ${colorClass}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-lg text-green-600 dark:text-green-400">
                {correctCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Benar</div>
            </div>
            <div>
              <div className="font-bold text-lg text-red-600 dark:text-red-400">
                {incorrectCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Salah</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}