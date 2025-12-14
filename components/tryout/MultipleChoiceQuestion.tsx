// app/tryout/[id]/components/MultipleChoiceQuestion.tsx

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

type MultipleChoiceQuestionProps = {
  options: string[];
  selectedAnswers: number[];
  onAnswerToggle: (index: number) => void;
};

export default function MultipleChoiceQuestion({
  options,
  selectedAnswers,
  onAnswerToggle,
}: MultipleChoiceQuestionProps) {
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const renderOption = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({node, src, alt, ...props}) => {
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
                alt={alt || 'Option'}
                className="max-w-full h-auto my-2 rounded border dark:border-gray-600"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                {...props}
              />
            );
          },
          p: ({node, ...props}) => (
            <span className="inline" {...props} />
          ),
          strong: ({node, ...props}) => (
            <strong className="font-semibold" {...props} />
          ),
          sup: ({node, ...props}) => (
            <sup {...props} />
          ),
          sub: ({node, ...props}) => (
            <sub {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <>
      <div className="mb-3 inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-medium">
        📋 PGK MCMA - Pilih lebih dari satu jawaban
      </div>
      
      <div className="space-y-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswers.includes(idx);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswerToggle(idx)}
              className={`
                w-full text-left p-3 rounded border transition-colors flex items-start
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 font-medium dark:text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200'
                }
              `}
            >
              <div className="flex items-center mr-3 mt-1">
                <div
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>
              <span className="flex-1">
                <strong className="mr-1">{String.fromCharCode(65 + idx)}.</strong>
                {renderOption(option)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}