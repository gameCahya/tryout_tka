// app/tryout/[id]/components/QuestionCard.tsx

import { Question } from '../../types/tryout';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import ReasoningQuestion from './ReasoningQuestion';
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
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const renderQuestionText = (text: string) => {
    const tableRegex = /\n\n(\|[^\n]+\|\n(?:\|[\s:-]+\|[\s\S]*?\n)?(?:\|[^\n]+\|\n)*)/g;
    const parts = text.split(tableRegex);

    return parts.map((part, partIndex) => {
      if (part.startsWith('|') && part.includes('\n')) {
        const rows = part.trim().split('\n').filter(r => r.trim());
        const tableData = rows.map(row =>
          row.split('|').map(cell => cell.trim()).filter(cell => cell)
        );

        const dataRows = tableData.filter(row =>
          !row.every(cell => /^[\s:-]+$/.test(cell))
        );

        if (dataRows.length > 0) {
          const headers = dataRows[0];
          const bodyRows = dataRows.slice(1);

          return (
            <div key={partIndex} className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    {headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium dark:text-white"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={
                        rowIdx % 2 === 0
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-gray-50 dark:bg-gray-750'
                      }
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-gray-200"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }

      const imageParts = part.split(/!\[([^\]]*)\]\(([^)]+)\)/g);

      return imageParts.map((imgPart, index) => {
        if (index % 3 === 2) {
          const imageUrl = getImageUrl(imgPart);
          if (!imageUrl) return null;

          return (
            <img
              key={`${partIndex}-${index}`}
              src={imageUrl}
              alt={imageParts[index - 1] || 'Soal'}
              className="max-w-full h-auto my-3 rounded border dark:border-gray-600"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          );
        }
        if (index % 3 === 1) {
          return null;
        }
        return imgPart ? <span key={`${partIndex}-${index}`}>{imgPart}</span> : null;
      });
    });
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

      <div className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
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