// app/history/[id]/review/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Question } from '@/types/tryout';
import { UserAnswer } from '@/types/review';
import ReviewQuestionCard from '@/components/review/ReviewQuestionCard';
import ReviewNavigator from '@/components/review/ReviewNavigator';
import NavigationButtons from '@/components/tryout/NavigationButtons';

type ReviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tryout_id?: string }>;
};

export default function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        // 1. Resolve params
        const resolvedParams = await params;
        const resolvedSearchParams = await searchParams;
        const resultId = resolvedParams.id;
        
        console.log('🔍 Step 1: Resolved params', { resultId, searchParams: resolvedSearchParams });

        if (!resultId) {
          throw new Error('Result ID tidak ditemukan');
        }

        // 2. Check auth
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Step 2: Auth check', { hasSession: !!session, userId: session?.user?.id });
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // 3. Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .single();

        console.log('🔍 Step 3: User profile', { 
          profileData, 
          profileError: profileError?.message 
        });

        setUserProfile(profileData);

        // 4. Fetch result
        const { data: resultData, error: resultError } = await supabase
          .from('results')
          .select('id, tryout_id, user_id, score, total_questions, duration_seconds, completed_at')
          .eq('id', resultId)
          .single();

        console.log('🔍 Step 4: Result data', { 
          resultData, 
          resultError: resultError?.message 
        });

        if (resultError || !resultData) {
          throw new Error('Hasil tryout tidak ditemukan');
        }

        // 5. Get tryout_id
        const tryoutId = resolvedSearchParams.tryout_id || resultData.tryout_id;
        
        console.log('🔍 Step 5: Tryout ID', { 
          fromSearchParams: resolvedSearchParams.tryout_id,
          fromResult: resultData.tryout_id,
          finalTryoutId: tryoutId 
        });

        if (!tryoutId) {
          throw new Error('Tryout ID tidak ditemukan di result maupun searchParams');
        }

        // 6. Check payment status
        const paymentResponse = await fetch(
          `/api/payment/status?userId=${session.user.id}&tryoutId=${tryoutId}`
        );
        const paymentData = await paymentResponse.json();
        
        console.log('🔍 Step 6: Payment status', { 
          statusCode: paymentResponse.status,
          paymentData 
        });
        
        setHasPaid(paymentData.hasPaid || false);

        // 7. Fetch tryout title
        const { data: tryoutData, error: tryoutError } = await supabase
          .from('tryouts')
          .select('title')
          .eq('id', tryoutId)
          .single();

        console.log('🔍 Step 7: Tryout data', { 
          tryoutData, 
          tryoutError: tryoutError?.message 
        });

        // IMPORTANT: Store tryout_id in result for payment
        const finalResult = {
          ...resultData,
          tryout_id: tryoutId, // ✅ This is crucial for payment
          tryouts: { title: tryoutData?.title || 'Tryout' }
        };

        console.log('🔍 Step 8: Final result object', finalResult);
        
        setResult(finalResult);

        // 8. Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('tryout_id', tryoutId)
          .order('created_at', { ascending: true });

        console.log('🔍 Step 9: Questions', { 
          count: questionsData?.length, 
          questionsError: questionsError?.message 
        });

        if (questionsError) {
          throw new Error('Gagal memuat soal: ' + questionsError.message);
        }

        if (!questionsData || questionsData.length === 0) {
          throw new Error('Tidak ada soal ditemukan untuk tryout ini');
        }

        setQuestions(questionsData);

        // 9. Fetch user answers
        const { data: userAnswersData, error: answersError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('result_id', resultId);

        console.log('🔍 Step 10: User answers', { 
          count: userAnswersData?.length, 
          answersError: answersError?.message 
        });

        const answersMap = new Map<string, UserAnswer>();
        userAnswersData?.forEach((ans: any) => {
          answersMap.set(ans.question_id, {
            question_id: ans.question_id,
            user_answer: ans.user_answer,
            user_answers: ans.user_answers || [],
            user_reasoning: ans.user_reasoning || {},
            is_correct: ans.is_correct,
          });
        });

        setUserAnswers(answersMap);
        setLoading(false);
        
        console.log('✅ All data loaded successfully');

      } catch (error: any) {
        console.error('❌ Error fetching review data:', error);
        setError(error.message || 'Gagal memuat data review');
        setLoading(false);
        
        setTimeout(() => {
          router.push('/history');
        }, 3000);
      }
    };

    fetchReviewData();
  }, [params, searchParams, router]);

  const handleUnlockClick = async () => {
    if (paymentLoading || !result) {
      console.warn('⚠️ Payment blocked:', { paymentLoading, hasResult: !!result });
      return;
    }

    try {
      setPaymentLoading(true);
      
      console.log('💳 Starting payment process...');

      // 1. Check session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('💳 Step 1: Session check', { 
        hasSession: !!session, 
        userId: session?.user?.id 
      });
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // 2. Get tryout ID from result
      const tryoutId = result.tryout_id;
      
      console.log('💳 Step 2: Tryout ID', { 
        tryoutId,
        resultObject: result 
      });

      if (!tryoutId) {
        throw new Error('Tryout ID tidak ditemukan dalam result object');
      }

      // 3. Prepare payment data
      const paymentPayload = {
        tryoutId,
        userId: session.user.id,
        email: session.user.email || 'user@example.com',
        phoneNumber: userProfile?.phone || '08123456789',
        customerName: userProfile?.full_name || 'User',
      };

      console.log('💳 Step 3: Payment payload', paymentPayload);

      // 4. Create payment
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      console.log('💳 Step 4: API response', { 
        status: response.status,
        statusText: response.statusText 
      });

      const data = await response.json();
      console.log('💳 Step 5: Response data', data);

      if (!response.ok) {
        throw new Error(data.error || `Payment API error: ${response.status}`);
      }

      // 5. Redirect to payment
      if (data.data?.paymentUrl) {
        console.log('💳 Step 6: Redirecting to payment URL', data.data.paymentUrl);
        window.location.href = data.data.paymentUrl;
      } else {
        throw new Error('Payment URL tidak ditemukan dalam response');
      }
      
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      alert(`Error: ${error.message || 'Gagal membuat pembayaran'}`);
      setPaymentLoading(false);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Mengalihkan ke halaman history...
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat review...</p>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 dark:text-gray-400">Tidak ada soal untuk ditampilkan</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers.get(currentQuestion.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/history')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center"
              >
                ← Kembali ke History
              </button>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  📝 Review: {result?.tryouts?.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Skor: <strong className="text-blue-600 dark:text-blue-400">{result?.score}/{result?.total_questions}</strong></span>
                  <span>Persentase: <strong className="text-green-600 dark:text-green-400">{((result?.score / result?.total_questions) * 100).toFixed(1)}%</strong></span>
                  {hasPaid && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <span>✓</span>
                      <strong>Pembahasan Terbuka</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Question Card */}
            <ReviewQuestionCard
              question={currentQuestion}
              userAnswer={userAnswer}
              questionNumber={currentQuestionIndex + 1}
              hasPaid={hasPaid}
              onUnlockClick={handleUnlockClick}
            />

            {/* Navigation Buttons */}
            <NavigationButtons
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              submitting={false}
              onPrev={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              onNext={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              onSubmit={() => {}}
            />
          </div>

          {/* Navigator Sidebar */}
          <div className="lg:w-80">
            <ReviewNavigator
              questions={questions}
              currentIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onQuestionSelect={setCurrentQuestionIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}