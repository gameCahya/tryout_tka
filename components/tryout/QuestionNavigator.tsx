// app/tryout/[id]/components/QuestionNavigator.tsx
'use client';

import { useState } from 'react';
import { Question } from '../../types/tryout';

type QuestionNavigatorProps = {
  questions: Question[];
  currentIndex: number;
  answers: number[];
  multipleAnswers: number[][];
  reasoningAnswers: { [key: number]: { [key: number]: 'benar' | 'salah' } };
  onQuestionSelect: (index: number) => void;
};

export default function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  multipleAnswers,
  reasoningAnswers,
  onQuestionSelect,
}: QuestionNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getQuestionStatus = (index: number): 'answered' | 'current' | 'unanswered' => {
    if (index === currentIndex) return 'current';
    
    const question = questions[index];
    if (question.question_type === 'multiple') {
      return multipleAnswers[index] && multipleAnswers[index].length > 0 ? 'answered' : 'unanswered';
    } else if (question.question_type === 'reasoning') {
      const userAns = reasoningAnswers[index] || {};
      return Object.keys(userAns).length === question.options.length ? 'answered' : 'unanswered';
    } else {
      return answers[index] !== -1 ? 'answered' : 'unanswered';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500 dark:bg-green-600 text-white border-green-500';
      case 'current':
        return 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300 dark:ring-blue-400';
      case 'unanswered':
        return 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
      default:
        return '';
    }
  };

  const getQuestionTypeIcon = (type?: string) => {
    switch (type) {
      case 'multiple':
        return '📋';
      case 'reasoning':
        return '⚖️';
      default:
        return '📝';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
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
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 dark:text-white">Navigasi Soal</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Legend */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Terjawab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300"></div>
              <span>Soal sekarang</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></div>
              <span>Belum dijawab</span>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(index);
            const statusColor = getStatusColor(status);
            const icon = getQuestionTypeIcon(question.question_type);

            return (
              <button
                key={question.id}
                onClick={() => {
                  onQuestionSelect(index);
                  setIsOpen(false);
                }}
                className={`
                  relative
                  aspect-square
                  flex flex-col items-center justify-center
                  rounded-lg border-2 
                  font-semibold text-sm
                  transition-all duration-200
                  hover:scale-105
                  ${statusColor}
                `}
                title={`Soal ${index + 1}${question.question_type ? ` (${question.question_type})` : ''}`}
              >
                <span className="text-xs mb-0.5">{icon}</span>
                <span>{index + 1}</span>
                {status === 'answered' && (
                  <svg className="w-3 h-3 absolute -top-1 -right-1 text-white bg-green-600 rounded-full p-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-lg text-green-600 dark:text-green-400">
                {questions.filter((_, i) => getQuestionStatus(i) === 'answered').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Terjawab</div>
            </div>
            <div>
              <div className="font-bold text-lg text-gray-600 dark:text-gray-400">
                {questions.filter((_, i) => getQuestionStatus(i) === 'unanswered').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Belum</div>
            </div>
            <div>
              <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {questions.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}