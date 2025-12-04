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
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState<string | null>(null);

  const rememberPaymentContext = (
    merchantOrderId: string | null | undefined,
    paymentUrl?: string | null,
    fallbackTryoutId?: string
  ) => {
    if (!merchantOrderId || typeof window === 'undefined') return;
    if (!resultId) return;

    const context = {
      merchantOrderId,
      paymentUrl: paymentUrl || null,
      tryoutId: result?.tryout_id || tryoutId || fallbackTryoutId || '',
      resultId,
      reviewPath: `/history/${resultId}/review`,
    };

    try {
      sessionStorage.setItem('lastPaymentContext', JSON.stringify(context));
    } catch (err) {
      console.warn('Unable to persist payment context:', err);
    }
  };

  const clearPaymentContext = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastPaymentContext');
    }
    setPendingPaymentUrl(null);
  };

  const checkPaymentStatus = async (tryoutId: string, userId: string) => {
    try {
      console.log('Checking payment status for:', { tryoutId, userId });
      
      const response = await fetch(`/api/payment/check-status?tryoutId=${tryoutId}&userId=${userId}`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Payment status check failed:', response.status);
        return { hasAccess: false, pendingPaymentUrl: null, pendingMerchantOrderId: null };
      }

      const text = await response.text();
      console.log('Response text:', text);
      
      if (!text) {
        console.error('Empty response from payment status check');
        return { hasAccess: false, pendingPaymentUrl: null, pendingMerchantOrderId: null };
      }

      const data = JSON.parse(text);
      console.log('Parsed data:', data);
      return {
        hasAccess: data.hasAccess || false,
        pendingPaymentUrl: data.pendingPaymentUrl || null,
        pendingMerchantOrderId: data.pendingMerchantOrderId || null,
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { hasAccess: false, pendingPaymentUrl: null, pendingMerchantOrderId: null };
    }
  };

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
    if (!resultId || !tryoutId) return;

    const fetchReviewData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || '');

      // Fetch result data first
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

      // Check payment status after getting resultData
      const paymentStatus = await checkPaymentStatus(resultData.tryout_id, session.user.id);
      setHasPaid(paymentStatus.hasAccess || false);
      if (paymentStatus.hasAccess) {
        clearPaymentContext();
      } else if (paymentStatus.pendingPaymentUrl) {
        setPendingPaymentUrl(paymentStatus.pendingPaymentUrl);
        rememberPaymentContext(paymentStatus.pendingMerchantOrderId, paymentStatus.pendingPaymentUrl, resultData.tryout_id);
      } else {
        setPendingPaymentUrl(null);
      }

      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('title')
        .eq('id', resultData.tryout_id)
        .single();

      if (tryoutError) {
        console.error('Error fetching tryout:', tryoutError);
      }

      setResult({
        ...resultData,
        tryouts: { title: tryoutData?.title || 'Tryout' }
      });

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

      const { data: userAnswersData, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('result_id', resultId);

      if (answersError) {
        console.error('Error fetching user answers:', answersError);
      }

      const answersMap = new Map<string, UserAnswer>();
      
      if (userAnswersData && userAnswersData.length > 0) {
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
      setLoading(false);
    };

    fetchReviewData();
  }, [resultId, tryoutId, router]);

  const handleUnlockPayment = async () => {
    if (processingPayment) return;
    
    setProcessingPayment(true);
    
    try {
      const response = await fetch('/api/payment/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tryoutId: result.tryout_id,
          userId,
          email: userEmail,
          customerName: userEmail.split('@')[0],
        }),
      });

      const text = await response.text();
      console.log('Response text:', text);

      if (!text) {
        alert('Response kosong dari server');
        setProcessingPayment(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        alert('Terjadi kesalahan pada response server');
        setProcessingPayment(false);
        return;
      }

      if (data.success && data.paymentUrl) {
        rememberPaymentContext(data.merchantOrderId, data.paymentUrl, result?.tryout_id || tryoutId);
        // Redirect to Duitku payment page
        window.location.href = data.paymentUrl;
      } else if (data.pendingPayment && data.paymentUrl) {
        rememberPaymentContext(data.merchantOrderId, data.paymentUrl, result?.tryout_id || tryoutId);
        // Ada pembayaran yang sedang diproses, simpan URL-nya
        setPendingPaymentUrl(data.paymentUrl);
        setProcessingPayment(false);
      } else {
        alert('Gagal membuat invoice pembayaran: ' + (data.error || 'Unknown error'));
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Terjadi kesalahan saat memproses pembayaran');
      setProcessingPayment(false);
    }
  };

  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const renderQuestionText = (text: string) => {
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
            className="max-w-full h-auto my-3 rounded border"
          />
        );
      }
      if (index % 3 === 1) return null;
      return part ? <span key={index}>{part}</span> : null;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat review...</p>
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/history')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Kembali ke History
          </button>
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              📝 Review: {result?.tryouts?.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Skor: <strong className="text-blue-600">{result?.score}/{result?.total_questions}</strong></span>
              <span>Persentase: <strong className="text-green-600">{((result?.score / result?.total_questions) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Navigasi Soal</h3>
            <span className="text-sm text-gray-600">
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
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            {userAnswer?.is_correct ? (
              <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✓ Jawaban Benar
              </div>
            ) : (
              <div className="inline-flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                ✗ Jawaban Salah
              </div>
            )}
            {isMultiple && (
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium ml-2">
                📋 PGK MCMA
              </div>
            )}
            {isReasoning && (
              <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium ml-2">
                ⚖️ PGK Kategori
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Soal {currentQuestionIndex + 1}</h3>
            {currentQuestion.image_url && (
              <img
                src={getImageUrl(currentQuestion.image_url) || ''}
                alt="Soal"
                className="max-w-full h-auto mb-4 rounded border"
              />
            )}
            <div className="text-gray-800">{renderQuestionText(currentQuestion.question_text)}</div>
          </div>

          {isReasoning ? (
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-3 text-left">#</th>
                    <th className="border border-gray-300 p-3 text-left">Pernyataan</th>
                    <th className="border border-gray-300 p-3 text-center w-32">Jawaban Anda</th>
                    <th className="border border-gray-300 p-3 text-center w-32">Jawaban Benar</th>
                    <th className="border border-gray-300 p-3 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuestion.options.map((option, idx) => {
                    const userAns = userAnswer?.user_reasoning?.[idx];
                    const correctAns = currentQuestion.reasoning_answers?.[idx];
                    const isCorrect = userAns === correctAns;
                    
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-3 font-bold">
                          {String.fromCharCode(65 + idx)}.
                        </td>
                        <td className="border border-gray-300 p-3">
                          {option}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            userAns === 'benar' ? 'bg-green-100 text-green-700' : 
                            userAns === 'salah' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {userAns === 'benar' ? 'Benar' : userAns === 'salah' ? 'Salah' : '-'}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            correctAns === 'benar' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {correctAns === 'benar' ? 'Benar' : 'Salah'}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {isCorrect ? (
                            <span className="text-green-600 text-xl">✓</span>
                          ) : (
                            <span className="text-red-600 text-xl">✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
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
                        ? 'border-green-500 bg-green-50'
                        : isUserAnswer
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {isCorrectAnswer && <span className="text-green-600 font-bold">✓</span>}
                        {!isCorrectAnswer && isUserAnswer && <span className="text-red-600 font-bold">✗</span>}
                      </div>
                      <div className="flex-1">
                        <strong>{String.fromCharCode(65 + idx)}.</strong> {option}
                        {isCorrectAnswer && (
                          <span className="ml-2 text-green-600 text-sm font-medium">(Jawaban Benar)</span>
                        )}
                        {!isCorrectAnswer && isUserAnswer && (
                          <span className="ml-2 text-red-600 text-sm font-medium">(Jawaban Anda)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explanation Section */}
          <div className="border-t pt-6">
            <h4 className="font-semibold text-lg mb-3 flex items-center">
              💡 Pembahasan
            </h4>
            {hasPaid ? (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-gray-800 whitespace-pre-line">
                  {currentQuestion.explanation || 'Pembahasan belum tersedia untuk soal ini.'}
                </p>
              </div>
            ) : pendingPaymentUrl ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300 text-center">
                <div className="text-5xl mb-3">⏳</div>
                <h5 className="font-bold text-gray-900 mb-2 text-xl">Pembayaran Sedang Diproses</h5>
                <p className="text-gray-700 mb-4">
                  Anda memiliki pembayaran yang sedang menunggu konfirmasi. Klik tombol di bawah untuk melanjutkan pembayaran.
                </p>
                <button
                  onClick={() => window.location.href = pendingPaymentUrl}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-bold text-lg shadow-lg"
                >
                  💳 Lanjutkan Pembayaran
                </button>
                <button
                  onClick={() => {
                    setPendingPaymentUrl(null);
                    handleUnlockPayment();
                  }}
                  className="mt-3 text-gray-600 hover:text-gray-800 text-sm underline"
                >
                  Buat Invoice Baru
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300 text-center">
                <div className="text-5xl mb-3">🔒</div>
                <h5 className="font-bold text-gray-900 mb-2 text-xl">Pembahasan Terkunci</h5>
                <p className="text-gray-700 mb-2">
                  Unlock pembahasan lengkap untuk <strong>semua hasil tryout ini</strong>
                </p>
                <p className="text-2xl font-bold text-orange-600 mb-4">
                  Rp 15.000
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  💳 Pembayaran aman melalui Duitku (ShopeePay, QRIS, dll)
                </p>
                <button
                  onClick={handleUnlockPayment}
                  disabled={processingPayment}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    '🎓 Unlock Pembahasan Sekarang'
                  )}
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
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400 transition-colors"
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