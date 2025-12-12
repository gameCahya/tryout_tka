'use client';

import { Question } from '@/types/tryout';
import { UserAnswer } from '@/types/review';
import SingleChoiceQuestion from '@/components/tryout/SingleChoiceQuestion';
import MultipleChoiceQuestion from '@/components/tryout/MultipleChoiceQuestion';
import ReasoningQuestion from '@/components/tryout/ReasoningQuestion';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

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
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const renderQuestionText = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({node, ...props}) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => (
            <thead className="bg-gray-100 dark:bg-gray-700" {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium dark:text-white" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-gray-200" {...props} />
          ),
          img: ({node, src, alt, ...props}) => {
            const imageUrl = getImageUrl(typeof src === 'string' ? src : '');
            if (!imageUrl) return null;
            return (
              <img
                src={imageUrl}
                alt={alt || 'Soal'}
                className="max-w-full h-auto my-3 rounded border dark:border-gray-600"
                {...props}
              />
            );
          },
          p: ({node, ...props}) => (
            <p className="text-gray-800 dark:text-gray-200 mb-2" {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  const isMultiple = question.question_type === 'multiple';
  const isReasoning = question.question_type === 'reasoning';
  const correctAnswers = isMultiple 
    ? (question.correct_answers || []) 
    : [question.correct_answer_index];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
      {/* Status Badge */}
      <div className="mb-4 flex flex-wrap gap-2">
        {userAnswer?.is_correct ? (
          <div className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Jawaban Benar
          </div>
        ) : (
          <div className="inline-flex items-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
            ✗ Jawaban Salah
          </div>
        )}
        {isMultiple && (
          <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
            📋 PGK MCMA
          </div>
        )}
        {isReasoning && (
          <div className="inline-flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
            ⚖️ PGK Kategori
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          Soal {questionNumber}
        </h3>
        {question.image_url && (
          <img
            src={getImageUrl(question.image_url) || ''}
            alt="Soal"
            className="max-w-full h-auto mb-4 rounded border dark:border-gray-600"
          />
        )}
        <div className="text-gray-800 dark:text-gray-200">
          {renderQuestionText(question.question_text)}
        </div>
      </div>

      {/* Answer Section */}
      {isReasoning ? (
        <ReviewReasoningAnswers
          question={question}
          userAnswer={userAnswer}
        />
      ) : (
        <ReviewChoiceAnswers
          question={question}
          userAnswer={userAnswer}
          correctAnswers={correctAnswers}
          isMultiple={isMultiple}
        />
      )}

      {/* Explanation */}
      <div className="border-t dark:border-gray-600 pt-6 mt-6">
        <h4 className="font-semibold text-lg mb-3 flex items-center text-gray-800 dark:text-white">
          💡 Pembahasan
        </h4>
        {hasPaid ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-gray-800 dark:text-gray-200">
              {question.explanation || 'Pembahasan belum tersedia untuk soal ini.'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h5 className="font-semibold text-gray-800 dark:text-white mb-2">
              Pembahasan Terkunci
            </h5>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upgrade ke Premium untuk melihat pembahasan lengkap semua soal
            </p>
            <button
              onClick={onUnlockClick}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium"
            >
              🎓 Unlock Pembahasan Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for choice answers
function ReviewChoiceAnswers({
  question,
  userAnswer,
  correctAnswers,
  isMultiple,
}: {
  question: Question;
  userAnswer?: UserAnswer;
  correctAnswers: number[];
  isMultiple: boolean;
}) {
  return (
    <div className="space-y-2 mb-6">
      {question.options.map((option, idx) => {
        const isUserAnswer = isMultiple
          ? userAnswer?.user_answers.includes(idx)
          : userAnswer?.user_answer === idx;
        const isCorrectAnswer = correctAnswers.includes(idx);

        // Determine the styling based on answer status
        let borderColor = 'border-gray-300 dark:border-gray-600';
        let bgColor = 'bg-white dark:bg-gray-800';
        let iconColor = '';
        let icon = null;

        if (isCorrectAnswer) {
          borderColor = 'border-green-500 dark:border-green-600';
          bgColor = 'bg-green-50 dark:bg-green-900/20';
          iconColor = 'text-green-600 dark:text-green-400';
          icon = '✓';
        } else if (isUserAnswer) {
          borderColor = 'border-red-500 dark:border-red-600';
          bgColor = 'bg-red-50 dark:bg-red-900/20';
          iconColor = 'text-red-600 dark:text-red-400';
          icon = '✗';
        }

        return (
          <div
            key={idx}
            className={`p-3 rounded border-2 ${borderColor} ${bgColor}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {icon && (
                  <span className={`${iconColor} font-bold text-lg`}>{icon}</span>
                )}
              </div>
              <div className="flex-1 text-gray-800 dark:text-gray-200">
                <strong className="text-gray-900 dark:text-white">
                  {String.fromCharCode(65 + idx)}.
                </strong>{' '}
                {option}
                {isCorrectAnswer && (
                  <span className="ml-2 text-green-600 dark:text-green-400 text-sm font-medium">
                    (Jawaban Benar)
                  </span>
                )}
                {!isCorrectAnswer && isUserAnswer && (
                  <span className="ml-2 text-red-600 dark:text-red-400 text-sm font-medium">
                    (Jawaban Anda)
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper component for reasoning answers
function ReviewReasoningAnswers({
  question,
  userAnswer,
}: {
  question: Question;
  userAnswer?: UserAnswer;
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-gray-800 dark:text-white">#</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-gray-800 dark:text-white">Pernyataan</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-32 text-gray-800 dark:text-white">Jawaban Anda</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-32 text-gray-800 dark:text-white">Jawaban Benar</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-20 text-gray-800 dark:text-white">Status</th>
          </tr>
        </thead>
        <tbody>
          {question.options.map((option, idx) => {
            const userAns = userAnswer?.user_reasoning?.[idx];
            const correctAns = question.reasoning_answers?.[idx];
            const isCorrect = userAns === correctAns;
            
            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                <td className="border border-gray-300 dark:border-gray-600 p-3 font-bold text-gray-800 dark:text-white">
                  {String.fromCharCode(65 + idx)}.
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">
                  {option}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    userAns === 'benar' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                    userAns === 'salah' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {userAns === 'benar' ? 'Benar' : userAns === 'salah' ? 'Salah' : '-'}
                  </span>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    correctAns === 'benar' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {correctAns === 'benar' ? 'Benar' : 'Salah'}
                  </span>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  {isCorrect ? (
                    <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}