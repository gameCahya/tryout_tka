// app/tryout/[id]/components/QuestionCard.tsx

import { Question } from '../../types/tryout';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import ReasoningQuestion from './ReasoningQuestion';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

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
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
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
          tr: ({node, ...props}) => {
            const index = (props as any).index;
            return (
              <tr
                className={index && index % 2 === 0
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-750'}
                {...props} />
            );
          },
          img: ({node, src, alt, ...props}) => {
            // Convert Blob to URL if needed
            let imageSource: string | null = null;
                    
            if (typeof src === 'string') {
              imageSource = src;
            } else if (src instanceof Blob) {
              imageSource = URL.createObjectURL(src);
            }
            
            const imageUrl = getImageUrl(imageSource || '');
            if (!imageUrl) return null;
            
            return (
              <img
                src={imageUrl}
                alt={alt || 'Soal'}
                className="max-w-full h-auto my-3 rounded border dark:border-gray-600"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                {...props}
              />
            );
          },
          p: ({node, ...props}) => (
            <p className="text-gray-800 dark:text-gray-200 mb-2" {...props} />
          ),
          strong: ({node, ...props}) => (
            <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/50 mb-6">
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

      <div className="text-lg font-medium mb-4">
        {renderQuestionText(question.question_text)}
      </div>

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