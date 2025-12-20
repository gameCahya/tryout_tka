'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Question } from '@/types/tryout';
import TryoutHeader from '@/components/tryout/TryoutHeader';
import ProgressBar from '@/components/tryout/ProgressBar';
import QuestionNavigator from '@/components/tryout/QuestionNavigator';
import QuestionCard from '@/components/tryout/QuestionCard';
import NavigationButtons from '@/components/tryout/NavigationButtons';
import AttemptInfo from '@/components/tryout/AttemptInfo';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      setCurrentUserId(session.user.id);
      const totalSeconds = tryoutData.duration_minutes * 60;
      setDuration(totalSeconds);

      // Check if there's a saved start time
      const savedStartTime = localStorage.getItem(`tryout_${tryoutId}_start_time`);
      
      if (savedStartTime) {
        // Calculate time left based on elapsed time
        const startTime = parseInt(savedStartTime);
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const remainingTime = Math.max(0, totalSeconds - elapsedSeconds);
        
        if (remainingTime === 0) {
          // Time's up, submit automatically
          setTimeLeft(0);
          setLoading(false);
          setTimeout(() => submitTryout(), 100);
          return;
        }
        
        setTimeLeft(remainingTime);
      } else {
        // First time starting this tryout, save the start time
        const startTime = Date.now();
        localStorage.setItem(`tryout_${tryoutId}_start_time`, startTime.toString());
        setTimeLeft(totalSeconds);
      }

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

  // Calculate answered count
  const getAnsweredCount = () => {
    return questions.filter((q, i) => {
      if (q.question_type === 'multiple') {
        return multipleAnswers[i] && multipleAnswers[i].length > 0;
      } else if (q.question_type === 'reasoning') {
        const userAns = reasoningAnswers[i] || {};
        return Object.keys(userAns).length === q.options.length;
      } else {
        return answers[i] !== -1;
      }
    }).length;
  };

  // Answer handlers
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

  // Navigation handlers
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

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Submit tryout
 const submitTryout = async () => {
  if (submitting) return;
  setSubmitting(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Calculate time spent
    const savedStartTime = localStorage.getItem(`tryout_${tryoutId}_start_time`);
    let timeSpent = duration - timeLeft;
    
    if (savedStartTime) {
      const startTime = parseInt(savedStartTime);
      const currentTime = Date.now();
      timeSpent = Math.floor((currentTime - startTime) / 1000);
    }

    // Calculate score
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const userAnswersData: any[] = [];

    questions.forEach((q, i) => {
      let isCorrect = false;
      let hasAnswer = false;

      if (q.question_type === 'multiple' && q.correct_answers) {
        const userAnswers = multipleAnswers[i] || [];
        hasAnswer = userAnswers.length > 0;
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
        hasAnswer = Object.keys(userAns).length === q.options.length;

        isCorrect = true;
        for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
          if (userAns[optIdx] !== q.reasoning_answers[optIdx]) {
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
        hasAnswer = answers[i] !== -1;
        isCorrect = answers[i] === q.correct_answer_index;

        userAnswersData.push({
          question_id: q.id,
          user_answer: answers[i] || -1,
          user_answers: null,
          user_reasoning: null,
          is_correct: isCorrect,
        });
      }

      if (isCorrect) {
        score++;
        correctCount++;
      } else if (hasAnswer) {
        wrongCount++;
      } else {
        unansweredCount++;
      }
    });

    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;

    // Call function untuk handle submission
    const { data: submissionData, error: submissionError } = await supabase
      .rpc('handle_tryout_submission', {
        p_user_id: session.user.id,
        p_tryout_id: tryoutId,
        p_score: score,
        p_total_questions: questions.length,
        p_duration_seconds: timeSpent,
        p_percentage: percentage,
        p_correct_answers: correctCount,
        p_wrong_answers: wrongCount,
        p_unanswered: unansweredCount,
      });

    if (submissionError) {
      console.error('Submission error:', submissionError);
      alert('Gagal menyimpan hasil: ' + submissionError.message);
      setSubmitting(false);
      return;
    }

    const resultInfo = submissionData[0];
    const resultId = resultInfo.result_id;
    const shouldUpdateRanking = resultInfo.should_update_ranking;

    console.log('Result info:', resultInfo);

    // Save user answers
    const answersToInsert = userAnswersData.map(ans => ({
      ...ans,
      result_id: resultId,
    }));

    const { error: answersError } = await supabase
      .from('user_answers')
      .insert(answersToInsert);

    if (answersError) {
      console.error('Answers error:', answersError);
    }

    // ✅ UPDATE RANKING HANYA UNTUK ATTEMPT PERTAMA
    if (shouldUpdateRanking) {
      console.log('🏆 Updating ranking (attempt #1)');
      
      // Cek apakah sudah ada ranking
      const { data: existingRank } = await supabase
        .from('rankings')
        .select('id')
        .eq('tryout_id', tryoutId)
        .eq('profile_id', session.user.id)
        .single();

      if (existingRank) {
        // Update existing ranking
        await supabase
          .from('rankings')
          .update({
            result_id: resultId,
            total_score: score,
            percentage: percentage,
            duration_seconds: timeSpent,
            correct_answers: correctCount,
            wrong_answers: wrongCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRank.id);
      } else {
        // Insert new ranking
        await supabase
          .from('rankings')
          .insert({
            tryout_id: tryoutId,
            profile_id: session.user.id,
            result_id: resultId,
            rank_position: 0, // Will be updated by trigger/function
            total_score: score,
            percentage: percentage,
            duration_seconds: timeSpent,
            correct_answers: correctCount,
            wrong_answers: wrongCount,
          });
      }
    } else {
      console.log('ℹ️ Skipping ranking update (attempt #' + resultInfo.attempt_number + ')');
    }

    // Clear localStorage
    localStorage.removeItem(`tryout_${tryoutId}_answers`);
    localStorage.removeItem(`tryout_${tryoutId}_multiple_answers`);
    localStorage.removeItem(`tryout_${tryoutId}_reasoning_answers`);
    localStorage.removeItem(`tryout_${tryoutId}_start_time`);

    // Show message if overwrite happened
    if (resultInfo.is_overwrite) {
      alert(`⚠️ ${resultInfo.message}\n\n📌 Percobaan pertama Anda tetap terlindungi dan digunakan untuk ranking.`);
    }

    // Redirect
    router.push(`/tryout/results?score=${score}&total=${questions.length}&duration=${timeSpent}&tryout_id=${tryoutId}`);

  } catch (err: any) {
    console.error('Error:', err);
    alert('Error: ' + err.message);
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-800 dark:text-gray-200">Memuat soal...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          {currentUserId && (
          <AttemptInfo tryoutId={tryoutId} userId={currentUserId} />
           )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3">
            <TryoutHeader timeLeft={timeLeft} />
            <ProgressBar
              currentIndex={currentQuestionIndex}
              total={questions.length}
              answeredCount={getAnsweredCount()}
            />
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={answers[currentQuestionIndex]}
              selectedMultipleAnswers={multipleAnswers[currentQuestionIndex] || []}
              selectedReasoningAnswers={reasoningAnswers[currentQuestionIndex] || {}}
              onAnswerSelect={handleAnswerSelect}
              onMultipleAnswerToggle={handleMultipleAnswerToggle}
              onReasoningAnswerChange={handleReasoningAnswerChange}
            />
            <NavigationButtons
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              submitting={submitting}
              onPrev={handlePrev}
              onNext={handleNext}
              onSubmit={submitTryout}
            />
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <QuestionNavigator
              questions={questions}
              currentIndex={currentQuestionIndex}
              answers={answers}
              multipleAnswers={multipleAnswers}
              reasoningAnswers={reasoningAnswers}
              onQuestionSelect={handleQuestionSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}