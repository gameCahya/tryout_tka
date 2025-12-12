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
  const [resultId, setResultId] = useState<string>('');
  const [tryoutId, setTryoutId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      setResultId(resolvedParams.id);
      setTryoutId(resolvedSearchParams.tryout_id || '');
    };
    resolveParams();
  }, [params, searchParams]);

  // Fetch review data
  useEffect(() => {
    if (!resultId || !tryoutId) return;

    const fetchReviewData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .single();

        setUserProfile(profileData);

        // Check payment status
        const paymentResponse = await fetch(
          `/api/payment/status?userId=${session.user.id}&tryoutId=${tryoutId}`
        );
        const paymentData = await paymentResponse.json();
        setHasPaid(paymentData.hasPaid || false);

        // Fetch result
        const { data: resultData, error: resultError } = await supabase
          .from('results')
          .select('id, tryout_id, user_id, score, total_questions, duration_seconds, completed_at')
          .eq('id', resultId)
          .single();

        if (resultError || !resultData) {
          throw new Error('Result not found');
        }

        // Fetch tryout title
        const { data: tryoutData } = await supabase
          .from('tryouts')
          .select('title')
          .eq('id', resultData.tryout_id)
          .single();

        setResult({
          ...resultData,
          tryouts: { title: tryoutData?.title || 'Tryout' }
        });

        // Fetch questions
        const actualTryoutId = tryoutId || resultData.tryout_id;
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('tryout_id', actualTryoutId)
          .order('created_at', { ascending: true });

        if (questionsError || !questionsData?.length) {
          throw new Error('Questions not found');
        }

        setQuestions(questionsData);

        // Fetch user answers
        const { data: userAnswersData } = await supabase
          .from('user_answers')
          .select('*')
          .eq('result_id', resultId);

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
      } catch (error) {
        console.error('Error fetching review data:', error);
        alert('Gagal memuat data review');
        router.push('/history');
      }
    };

    fetchReviewData();
  }, [resultId, tryoutId, router]);

  const handleUnlockClick = async () => {
    if (paymentLoading) return;

    try {
      setPaymentLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Create payment
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tryoutId,
          userId: session.user.id,
          email: session.user.email || 'user@example.com',
          phoneNumber: userProfile?.phone || '08123456789',
          customerName: userProfile?.full_name || 'User',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to payment page
      if (data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        throw new Error('Payment URL not found');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Gagal membuat pembayaran');
      setPaymentLoading(false);
    }
  };

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
              onSubmit={() => {}} // Not needed in review
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