// app/tryout/[id]/components/ReasoningQuestion.tsx

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

type ReasoningQuestionProps = {
  options: string[];
  reasoningAnswers: { [key: number]: 'benar' | 'salah' };
  onAnswerChange: (index: number, value: 'benar' | 'salah') => void;
};

export default function ReasoningQuestion({
  options,
  reasoningAnswers,
  onAnswerChange,
}: ReasoningQuestionProps) {
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
                alt={alt || 'Statement'}
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
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <>
      <div className="mb-3 inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-medium">
        ⚖️ PGK Kategori - Tentukan Benar/Salah
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-left dark:text-white">
                #
              </th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-left dark:text-white">
                Pernyataan
              </th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-24 dark:text-white">
                Benar
              </th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-24 dark:text-white">
                Salah
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((option, idx) => {
              const userAnswer = reasoningAnswers[idx];

              return (
                <tr
                  key={idx}
                  className={
                    idx % 2 === 0
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }
                >
                  <td className="border border-gray-300 dark:border-gray-600 p-3 font-bold text-gray-700 dark:text-gray-300">
                    {String.fromCharCode(65 + idx)}.
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-3 dark:text-gray-200">
                    {renderOption(option)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onAnswerChange(idx, 'benar')}
                      className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mx-auto
                        ${
                          userAnswer === 'benar'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                        }
                      `}
                    >
                      {userAnswer === 'benar' && (
                        <svg
                          className="w-5 h-5 text-white"
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
                    </button>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onAnswerChange(idx, 'salah')}
                      className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mx-auto
                        ${
                          userAnswer === 'salah'
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-red-400'
                        }
                      `}
                    >
                      {userAnswer === 'salah' && (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}