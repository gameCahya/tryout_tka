// components/tryout/QuestionCard.tsx
import { Question } from '../../types/tryout';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import ReasoningQuestion from './ReasoningQuestion';
import HTMLRenderer from './HTMLRenderer';
import { supabase } from '@/lib/supabase';

type QuestionCardProps = {
  question: Question;
  selectedAnswer: number;
  selectedMultipleAnswers: number[];
  selectedReasoningAnswers: { [key: number]: 'benar' | 'salah' };
  onAnswerSelect: (index: number) => void;
  onMultipleAnswerToggle: (index: number) => void;
  onReasoningAnswerChange: (index: number, value: 'benar' | 'salah') => void;
};

export default function QuestionCard({
  question,
  selectedAnswer,
  selectedMultipleAnswers,
  selectedReasoningAnswers,
  onAnswerSelect,
  onMultipleAnswerToggle,
  onReasoningAnswerChange,
}: QuestionCardProps) {
  // Get image URL from Supabase storage or direct URL
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/50 mb-6">
      {/* Image display with error handling */}
      {question.image_url && (
        <img
          src={getImageUrl(question.image_url) || ''}
          alt="Soal"
          className="max-w-full h-auto mb-4 rounded border dark:border-gray-600"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {/* Question text with HTMLRenderer for rich content support */}
      <div className="text-lg font-medium mb-4">
        <HTMLRenderer 
          content={question.question_text}
          className="text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Question type specific components */}
      {question.question_type === 'multiple' ? (
        <MultipleChoiceQuestion
          options={question.options}
          selectedAnswers={selectedMultipleAnswers}
          onAnswerToggle={onMultipleAnswerToggle}
        />
      ) : question.question_type === 'reasoning' ? (
        <ReasoningQuestion
          options={question.options}
          reasoningAnswers={selectedReasoningAnswers}
          onAnswerChange={onReasoningAnswerChange}
        />
      ) : (
        <SingleChoiceQuestion
          options={question.options}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
        />
      )}
    </div>
  );
}