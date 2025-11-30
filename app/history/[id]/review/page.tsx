'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers?: number[] | null;
  question_type?: string;
  reasoning_answers?: { [key: number]: 'benar' | 'salah' } | null;
  explanation?: string;
  image_url?: string | null;
};

type UserAnswer = {
  question_id: string;
  user_answer: number;
  user_answers: number[];
  user_reasoning?: { [key: number]: 'benar' | 'salah' };
  is_correct: boolean;
};

type ReviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tryout_id?: string }>;
};

export default function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const router = useRouter();
  const [resultId, setResultId] = useState<string>('');
  const [tryoutId, setTryoutId] = useState<string>('');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Resolve params first
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      
      setResultId(resolvedParams.id);
      setTryoutId(resolvedSearchParams.tryout_id || '');
    };
    
    resolveParams();
  }, [params, searchParams]);

  useEffect(() => {
    // Skip if params not resolved yet
    if (!resultId || !tryoutId) return;

    const fetchReviewData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Ambil hasil tryout
      const { data: resultData, error: resultError } = await supabase
        .from('results')
        .select('id, tryout_id, user_id, score, total_questions, duration_seconds, completed_at')
        .eq('id', resultId)
        .single();

      if (resultError) {
        console.error('Error fetching result:', resultError);
        alert('Gagal memuat data: ' + resultError.message);
        router.push('/history');
        return;
      }

      if (!resultData) {
        alert('Data tidak ditemukan');
        router.push('/history');
        return;
      }

      // Ambil tryout title secara terpisah
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('title')
        .eq('id', resultData.tryout_id)
        .single();

      if (tryoutError) {
        console.error('Error fetching tryout:', tryoutError);
      }

      // Set result dengan tryout title
      setResult({
        ...resultData,
        tryouts: { title: tryoutData?.title || 'Tryout' }
      });

      // Ambil soal-soal
      const actualTryoutId = tryoutId || resultData.tryout_id;
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('tryout_id', actualTryoutId)
        .order('created_at', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        alert('Gagal memuat soal: ' + questionsError.message);
        router.push('/history');
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        alert('Soal tidak ditemukan untuk tryout ini');
        router.push('/history');
        return;
      }

      setQuestions(questionsData);

      // Ambil jawaban user dari database
      const { data: userAnswersData, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('result_id', resultId);

      if (answersError) {
        console.error('Error fetching user answers:', answersError);
      }

      // Build user answers map dari database
      const answersMap = new Map<string, UserAnswer>();
      
      if (userAnswersData && userAnswersData.length > 0) {
        // Dari database
        userAnswersData.forEach((ans: any) => {
          answersMap.set(ans.question_id, {
            question_id: ans.question_id,
            user_answer: ans.user_answer,
            user_answers: ans.user_answers || [],
            user_reasoning: ans.user_reasoning || {},
            is_correct: ans.is_correct,
          });
        });
      } else {
        // Fallback ke localStorage jika tidak ada di database
        const savedAnswers = localStorage.getItem(`tryout_${actualTryoutId}_answers`);
        const savedMultipleAnswers = localStorage.getItem(`tryout_${actualTryoutId}_multiple_answers`);
        const savedReasoningAnswers = localStorage.getItem(`tryout_${actualTryoutId}_reasoning_answers`);
        
        const answers = savedAnswers ? JSON.parse(savedAnswers) : [];
        const multipleAnswers = savedMultipleAnswers ? JSON.parse(savedMultipleAnswers) : [];
        const reasoningAnswers = savedReasoningAnswers ? JSON.parse(savedReasoningAnswers) : {};

        questionsData.forEach((q: Question, idx: number) => {
          let isCorrect = false;
          let userAns: number[] = [];
          let userReasoning: { [key: number]: 'benar' | 'salah' } = {};

          if (q.question_type === 'multiple') {
            userAns = multipleAnswers[idx] || [];
            const correctAns = q.correct_answers || [];
            isCorrect = userAns.length === correctAns.length && userAns.every((a: number) => correctAns.includes(a));
          } else if (q.question_type === 'reasoning') {
            userReasoning = reasoningAnswers[idx] || {};
            const correctReasoning = q.reasoning_answers || {};
            
            isCorrect = true;
            for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
              if (userReasoning[optIdx] !== correctReasoning[optIdx]) {
                isCorrect = false;
                break;
              }
            }
          } else {
            userAns = [answers[idx]];
            isCorrect = answers[idx] === q.correct_answer_index;
          }

          answersMap.set(q.id, {
            question_id: q.id,
            user_answer: answers[idx] || -1,
            user_answers: userAns,
            user_reasoning: userReasoning,
            is_correct: isCorrect,
          });
        });
      }

      setUserAnswers(answersMap);

      // TODO: Check payment status dari database
      setHasPaid(false);

      setLoading(false);
    };

    fetchReviewData();
  }, [resultId, tryoutId, router]);

  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const renderQuestionText = (text: string) => {
    // Enhanced render to handle tables and other formatting
    // Split text by markdown table pattern first
    const tableRegex = /\n\|.*\|\n\|[-|: ]+\|\n(?:\|(?:[^|\n]*\|)+\n?)+/;
    const hasTable = tableRegex.test(text);
    
    if (hasTable) {
      // Split by table
      const parts = text.split(/(\n\|.*\|\n\|[-|: ]+\|\n(?:\|(?:[^|\n]*\|)+\n?)+)/g);
      return parts.map((part, index) => {
        if (part.startsWith('\n|')) {
          // This is a table
          const lines = part.trim().split('\n');
          const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
          const isHeaderRow = lines[1].includes('|-');
          const rows = lines.slice(isHeaderRow ? 2 : 1).map(line => 
            line.split('|').map(cell => cell.trim()).filter(cell => cell)
          ).filter(row => row.length > 0);

          return (
            <div key={`table-${index}`} className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    {headers.map((header, hIndex) => (
                      <th key={hIndex} className="border border-border px-4 py-2 text-left font-medium text-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIndex) => (
                    <tr key={rIndex} className={rIndex % 2 === 0 ? 'bg-background' : 'bg-muted'}>
                      {row.map((cell, cIndex) => (
                        <td key={cIndex} className="border border-border px-4 py-2 text-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else {
          // Process regular text with image support
          const textParts = part.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
          return textParts.map((textPart, textIndex) => {
            if (textIndex % 3 === 2) {
              const imageUrl = getImageUrl(textPart);
              if (!imageUrl) return null;
              return (
                <img
                  key={`img-${index}-${textIndex}`}
                  src={imageUrl}
                  alt="Soal"
                  className="max-w-full h-auto my-3 rounded border border-border"
                />
              );
            }
            if (textIndex % 3 === 1) return null;
            return textPart ? <span key={`text-${index}-${textIndex}`}>{textPart}</span> : null;
          });
        }
      });
    } else {
      // Original processing for non-table content
      const parts = text.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
      return parts.map((part, index) => {
        if (index % 3 === 2) {
          const imageUrl = getImageUrl(part);
          if (!imageUrl) return null;
          return (
            <img
              key={index}
              src={imageUrl}
              alt="Soal"
              className="max-w-full h-auto my-3 rounded border border-border"
            />
          );
        }
        if (index % 3 === 1) return null;
        return part ? <span key={index} className="text-foreground">{part}</span> : null;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat review...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers.get(currentQuestion.id);
  const isMultiple = currentQuestion.question_type === 'multiple';
  const isReasoning = currentQuestion.question_type === 'reasoning';
  const correctAnswers = isMultiple ? (currentQuestion.correct_answers || []) : [currentQuestion.correct_answer_index];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/history')}
            className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 mb-4 flex items-center"
          >
            ← Kembali ke History
          </button>
          <div className="bg-card rounded-lg shadow border border-border p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              📝 Review: {result?.tryouts?.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Skor: <strong className="text-blue-600 dark:text-blue-400">{result?.score}/{result?.total_questions}</strong></span>
              <span>Persentase: <strong className="text-green-600 dark:text-green-400">{((result?.score / result?.total_questions) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-card rounded-lg shadow border border-border p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-foreground">Navigasi Soal</h3>
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, idx) => {
              const ans = userAnswers.get(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`p-2 rounded text-sm font-medium transition-colors ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : ans?.is_correct
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          {/* Status Badge */}
          <div className="mb-4">
            {userAnswer?.is_correct ? (
              <div className="inline-flex items-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                ✓ Jawaban Benar
              </div>
            ) : (
              <div className="inline-flex items-center bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
                ✗ Jawaban Salah
              </div>
            )}
            {isMultiple && (
              <div className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium ml-2">
                📋 PGK MCMA
              </div>
            )}
            {isReasoning && (
              <div className="inline-flex items-center bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium ml-2">
                ⚖️ PGK Kategori
              </div>
            )}
          </div>

          {/* Question */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Soal {currentQuestionIndex + 1}</h3>
            {currentQuestion.image_url && (
              <img
                src={getImageUrl(currentQuestion.image_url) || ''}
                alt="Soal"
                className="max-w-full h-auto mb-4 rounded border border-border"
              />
            )}
            <div className="text-foreground">{renderQuestionText(currentQuestion.question_text)}</div>
          </div>

          {/* Options */}
          {isReasoning ? (
            // Reasoning Type - Show table with correct/user answers
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border p-3 text-left text-foreground">#</th>
                    <th className="border border-border p-3 text-left text-foreground">Pernyataan</th>
                    <th className="border border-border p-3 text-center w-32 text-foreground">Jawaban Anda</th>
                    <th className="border border-border p-3 text-center w-32 text-foreground">Jawaban Benar</th>
                    <th className="border border-border p-3 text-center w-20 text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuestion.options.map((option, idx) => {
                    const userAns = userAnswer?.user_reasoning?.[idx];
                    const correctAns = currentQuestion.reasoning_answers?.[idx];
                    const isCorrect = userAns === correctAns;
                    
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted'}>
                        <td className="border border-border p-3 font-bold text-foreground">
                          {String.fromCharCode(65 + idx)}.
                        </td>
                        <td className="border border-border p-3 text-foreground">
                          {option}
                        </td>
                        <td className="border border-border p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            userAns === 'benar' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                            userAns === 'salah' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 
                            'bg-muted text-muted-foreground dark:bg-gray-800'
                          }`}>
                            {userAns === 'benar' ? 'Benar' : userAns === 'salah' ? 'Salah' : '-'}
                          </span>
                        </td>
                        <td className="border border-border p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            correctAns === 'benar' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {correctAns === 'benar' ? 'Benar' : 'Salah'}
                          </span>
                        </td>
                        <td className="border border-border p-3 text-center">
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
          ) : (
            // Regular options (Single or Multiple)
            <div className="space-y-2 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isUserAnswer = isMultiple
                  ? userAnswer?.user_answers.includes(idx)
                  : userAnswer?.user_answer === idx;
                const isCorrectAnswer = correctAnswers.includes(idx);

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded border-2 ${
                      isCorrectAnswer
                        ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950'
                        : isUserAnswer
                        ? 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {isCorrectAnswer && <span className="text-green-600 dark:text-green-400 font-bold">✓</span>}
                        {!isCorrectAnswer && isUserAnswer && <span className="text-red-600 dark:text-red-400 font-bold">✗</span>}
                      </div>
                      <div className="flex-1">
                        <strong className="text-foreground">{String.fromCharCode(65 + idx)}.</strong> <span className="text-foreground">{option}</span>
                        {isCorrectAnswer && (
                          <span className="ml-2 text-green-600 dark:text-green-400 text-sm font-medium">(Jawaban Benar)</span>
                        )}
                        {!isCorrectAnswer && isUserAnswer && (
                          <span className="ml-2 text-red-600 dark:text-red-400 text-sm font-medium">(Jawaban Anda)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explanation Section */}
          <div className="border-t border-border pt-6">
            <h4 className="font-semibold text-lg mb-3 flex items-center text-foreground">
              💡 Pembahasan
            </h4>
            {hasPaid ? (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-foreground">
                  {currentQuestion.explanation || 'Pembahasan belum tersedia untuk soal ini.'}
                </p>
              </div>
            ) : (
              <div className="bg-muted p-6 rounded border-2 border-dashed border-border text-center">
                <div className="text-4xl mb-3">🔒</div>
                <h5 className="font-semibold text-foreground mb-2">Pembahasan Terkunci</h5>
                <p className="text-muted-foreground mb-4">
                  Upgrade ke Premium untuk melihat pembahasan lengkap semua soal
                </p>
                <button
                  onClick={() => alert('Fitur pembayaran sedang dalam proses (Midtrans)')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium"
                >
                  🎓 Unlock Pembahasan Premium
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-secondary text-foreground rounded disabled:opacity-50 hover:bg-secondary/80 transition-colors"
          >
            ← Soal Sebelumnya
          </button>
          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Soal Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}