'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  tryout_id?: string;
  created_at?: string;
};

export default function TryoutPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [multipleAnswers, setMultipleAnswers] = useState<number[][]>([]);
  const [reasoningAnswers, setReasoningAnswers] = useState<{ [key: number]: { [key: number]: 'benar' | 'salah' } }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tryout data
  useEffect(() => {
    const fetchTryoutData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('duration_minutes')
        .eq('id', tryoutId)
        .single();

      if (tryoutError || !tryoutData) {
        alert('Tryout tidak ditemukan');
        router.push('/dashboard');
        return;
      }

      const totalSeconds = tryoutData.duration_minutes * 60;
      setDuration(totalSeconds);
      setTimeLeft(totalSeconds);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('tryout_id', tryoutId)
        .order('created_at', { ascending: true });

      if (questionsError || !questionsData || questionsData.length === 0) {
        alert('Soal tidak tersedia');
        router.push('/dashboard');
        return;
      }

      setQuestions(questionsData);
      
      const savedAnswers = localStorage.getItem(`tryout_${tryoutId}_answers`);
      const savedMultipleAnswers = localStorage.getItem(`tryout_${tryoutId}_multiple_answers`);
      const savedReasoningAnswers = localStorage.getItem(`tryout_${tryoutId}_reasoning_answers`);
      
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      } else {
        setAnswers(new Array(questionsData.length).fill(-1));
      }
      
      if (savedMultipleAnswers) {
        setMultipleAnswers(JSON.parse(savedMultipleAnswers));
      } else {
        setMultipleAnswers(new Array(questionsData.length).fill(null).map(() => []));
      }

      if (savedReasoningAnswers) {
        setReasoningAnswers(JSON.parse(savedReasoningAnswers));
      } else {
        setReasoningAnswers({});
      }

      setLoading(false);
    };

    fetchTryoutData();
  }, [tryoutId, router]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTryout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions.length]);

  // Save answers to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(`tryout_${tryoutId}_answers`, JSON.stringify(answers));
      localStorage.setItem(`tryout_${tryoutId}_multiple_answers`, JSON.stringify(multipleAnswers));
      localStorage.setItem(`tryout_${tryoutId}_reasoning_answers`, JSON.stringify(reasoningAnswers));
    }
  }, [answers, multipleAnswers, reasoningAnswers, tryoutId, questions.length]);

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
                      <th key={idx} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium dark:text-white">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white">
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
              className="max-w-full h-auto my-3 rounded border dark:border-gray-700"
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
        return imgPart ? <span key={`${partIndex}-${index}`} className="dark:text-white">{imgPart}</span> : null;
      });
    });
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleMultipleAnswerToggle = (optionIndex: number) => {
    const newMultipleAnswers = [...multipleAnswers];
    const currentAnswers = newMultipleAnswers[currentQuestionIndex] || [];
    const answerIndex = currentAnswers.indexOf(optionIndex);
    
    if (answerIndex > -1) {
      currentAnswers.splice(answerIndex, 1);
    } else {
      currentAnswers.push(optionIndex);
    }
    
    newMultipleAnswers[currentQuestionIndex] = currentAnswers.sort();
    setMultipleAnswers(newMultipleAnswers);
  };

  const handleReasoningAnswerChange = (optionIndex: number, value: 'benar' | 'salah') => {
    const newReasoningAnswers = { ...reasoningAnswers };
    if (!newReasoningAnswers[currentQuestionIndex]) {
      newReasoningAnswers[currentQuestionIndex] = {};
    }
    newReasoningAnswers[currentQuestionIndex][optionIndex] = value;
    setReasoningAnswers(newReasoningAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTryout = async () => {
    console.log('🚀 SUBMIT FUNCTION CALLED');
    
    if (submitting) {
      console.log('⏸️ Already submitting...');
      return;
    }
    
    setSubmitting(true);

    try {
      console.log('📝 Step 1: Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('❌ No session found');
        router.push('/auth/login');
        return;
      }
      
      console.log('✅ Session found:', session.user.id);

      // Calculate score
      console.log('📊 Step 2: Calculating score...');
      let score = 0;
      const userAnswersData: any[] = [];

      questions.forEach((q, i) => {
        let isCorrect = false;

        if (q.question_type === 'multiple' && q.correct_answers) {
          const userAnswers = multipleAnswers[i] || [];
          const correctAnswers = q.correct_answers;
          
          isCorrect = userAnswers.length === correctAnswers.length &&
            userAnswers.every(ans => correctAnswers.includes(ans));
          
          userAnswersData.push({
            question_id: q.id,
            user_answer: -1,
            user_answers: userAnswers,
            user_reasoning: null,
            is_correct: isCorrect,
          });
        } else if (q.question_type === 'reasoning' && q.reasoning_answers) {
          const userAns = reasoningAnswers[i] || {};
          const correctAns = q.reasoning_answers;
          
          isCorrect = true;
          for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
            if (userAns[optIdx] !== correctAns[optIdx]) {
              isCorrect = false;
              break;
            }
          }
          
          userAnswersData.push({
            question_id: q.id,
            user_answer: -1,
            user_answers: null,
            user_reasoning: userAns,
            is_correct: isCorrect,
          });
        } else {
          isCorrect = answers[i] === q.correct_answer_index;
          
          userAnswersData.push({
            question_id: q.id,
            user_answer: answers[i] || -1,
            user_answers: null,
            user_reasoning: null,
            is_correct: isCorrect,
          });
        }

        if (isCorrect) score++;
      });

      console.log('✅ Score:', score, '/', questions.length);

      // Save result
      console.log('💾 Step 3: Saving result...');
      const { data: resultData, error: resultError } = await supabase
        .from('results')
        .insert({
          user_id: session.user.id,
          tryout_id: tryoutId,
          score,
          total_questions: questions.length,
          duration_seconds: duration - timeLeft,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (resultError) {
        console.error('❌ Result error:', resultError);
        alert('Gagal menyimpan hasil: ' + resultError.message);
        setSubmitting(false);
        return;
      }

      console.log('✅ Result saved:', resultData.id);

      // Save user answers
      console.log('💾 Step 4: Saving answers...');
      const answersToInsert = userAnswersData.map(ans => ({
        ...ans,
        result_id: resultData.id,
      }));

      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(answersToInsert);

      if (answersError) {
        console.error('❌ Answers error:', answersError);
      } else {
        console.log('✅ Answers saved');
      }

      // Clear localStorage
      localStorage.removeItem(`tryout_${tryoutId}_answers`);
      localStorage.removeItem(`tryout_${tryoutId}_multiple_answers`);
      localStorage.removeItem(`tryout_${tryoutId}_reasoning_answers`);

      // Redirect
      console.log('🎉 Redirecting...');
      router.push(`/tryout/result?score=${score}&total=${questions.length}&duration=${duration - timeLeft}`);
    } catch (err: any) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="dark:text-white">Memuat soal...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6 py-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold dark:text-white">Tryout</h1>
          <div className="bg-red-600 text-white px-3 py-1 rounded font-mono">
            {minutes}:{seconds < 10 ? '0' : ''}{seconds}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span>Soal {currentQuestionIndex + 1} dari {questions.length}</span>
            <span>
              Terjawab: {
                questions.filter((q, i) => {
                  if (q.question_type === 'multiple') {
                    return multipleAnswers[i] && multipleAnswers[i].length > 0;
                  } else if (q.question_type === 'reasoning') {
                    const userAns = reasoningAnswers[i] || {};
                    return Object.keys(userAns).length === q.options.length;
                  } else {
                    return answers[i] !== -1;
                  }
                }).length
              }/{questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 dark:shadow-gray-900">
          {currentQuestion.image_url && (
            <img
              src={getImageUrl(currentQuestion.image_url) || ''}
              alt="Soal"
              className="max-w-full h-auto mb-4 rounded border dark:border-gray-700"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          
          <div className="text-lg font-medium mb-4 dark:text-white">
            {renderQuestionText(currentQuestion.question_text)}
          </div>
          
          {currentQuestion.question_type === 'multiple' && (
            <div className="mb-3 inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full font-medium">
              📋 PGK MCMA - Pilih lebih dari satu jawaban
            </div>
          )}
          
          {currentQuestion.question_type === 'reasoning' && (
            <div className="mb-3 inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-3 py-1 rounded-full font-medium">
              ⚖️ PGK Kategori - Tentukan Benar/Salah
            </div>
          )}
          
          {/* Display Options Based on Question Type */}
          {currentQuestion.question_type === 'reasoning' ? (
            // Reasoning Type - Table with Benar/Salah
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left dark:text-white">#</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-left dark:text-white">Pernyataan</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-24 dark:text-white">Benar</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-24 dark:text-white">Salah</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuestion.options.map((option, idx) => {
                    const userAnswer = reasoningAnswers[currentQuestionIndex]?.[idx];
                    
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                        <td className="border border-gray-300 dark:border-gray-600 p-3 font-bold text-gray-700 dark:text-gray-200">
                          {String.fromCharCode(65 + idx)}.
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3 dark:text-white">
                          {option}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleReasoningAnswerChange(idx, 'benar')}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              userAnswer === 'benar'
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                            }`}
                          >
                            {userAnswer === 'benar' && (
                              <svg className="w-5 h-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleReasoningAnswerChange(idx, 'salah')}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              userAnswer === 'salah'
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                            }`}
                          >
                            {userAnswer === 'salah' && (
                              <svg className="w-5 h-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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
          ) : (
            // Regular Options (Single or Multiple)
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isMultiple = currentQuestion.question_type === 'multiple';
                const isSelected = isMultiple
                  ? (multipleAnswers[currentQuestionIndex] || []).includes(idx)
                  : answers[currentQuestionIndex] === idx;
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => isMultiple ? handleMultipleAnswerToggle(idx) : handleAnswerSelect(idx)}
                    className={`w-full text-left p-3 rounded border transition-colors flex items-start ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500 font-medium'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center mr-3 mt-1">
                      {isMultiple ? (
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isSelected ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' : 'border-gray-400 dark:border-gray-500'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                          isSelected ? 'border-blue-500 dark:border-blue-500' : 'border-gray-400 dark:border-gray-500'
                        }`}>
                          {isSelected && <div className="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded-full"></div>}
                        </div>
                      )}
                    </div>
                    <span className="flex-1 dark:text-white">
                      <strong>{String.fromCharCode(65 + idx)}.</strong> {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50 dark:text-white"
          >
            Sebelumnya
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={submitTryout}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Selesai'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded dark:bg-blue-700"
            >
              Berikutnya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}