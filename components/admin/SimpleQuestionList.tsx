'use client';

import { useState } from 'react';

type Question = {
  id: string;
  tryout_id: string;
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

type SimpleQuestionListProps = {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
};

export default function SimpleQuestionList({ questions, onEdit, onDelete }: SimpleQuestionListProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">Belum ada soal. Tambahkan soal pertama Anda!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Daftar Soal ({questions.length})
      </h3>
      
      <div className="space-y-3">
        {questions.map((question) => (
          <div 
            key={question.id} 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Soal #{question.question_number}
                  </h4>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                    Jawaban: {question.correct_answer}
                  </span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                  {question.question_text}
                </p>
                
                {expandedQuestion === question.id && (
                  <div className="mt-3 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <p className="text-sm"><strong>A:</strong> {question.option_a}</p>
                      <p className="text-sm"><strong>B:</strong> {question.option_b}</p>
                      <p className="text-sm"><strong>C:</strong> {question.option_c}</p>
                      <p className="text-sm"><strong>D:</strong> {question.option_d}</p>
                      <p className="text-sm col-span-2"><strong>E:</strong> {question.option_e}</p>
                    </div>
                    
                    {question.explanation && (
                      <div className="text-sm">
                        <strong>Penjelasan:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => toggleExpand(question.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {expandedQuestion === question.id ? '▲' : '▼'}
                </button>
                <button
                  onClick={() => onEdit(question)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(question.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}