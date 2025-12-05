'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SimpleQuestionForm } from '@/components/admin/SimpleQuestionForm';
import { SimpleQuestionList } from '@/components/admin/SimpleQuestionList';

type Tryout = {
  id: string;
  title: string;
  total_questions: number;
};

type Question = {
  id: string;
  tryout_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  explanation: string | null;
};

export default function TryoutQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const tryoutId = params.id as string;
  
  const [tryout, setTryout] = useState<Tryout | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchTryoutAndQuestions();
  }, [tryoutId]);

  const fetchTryoutAndQuestions = async () => {
    setLoading(true);
    setError(null);

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Sesi tidak ditemukan, silakan login kembali');
      setLoading(false);
      return;
    }

    // Check if user has teacher or admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData || !['admin', 'teacher'].includes(profileData.role)) {
      setError('Anda tidak memiliki akses untuk mengelola soal');
      setLoading(false);
      return;
    }

    try {
      // Fetch tryout
      const { data: tryoutData, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title, total_questions')
        .eq('id', tryoutId)
        .single();

      if (tryoutError) throw tryoutError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('tryout_id', tryoutId)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;

      setTryout(tryoutData);
      setQuestions(questionsData || []);
    } catch (err: any) {
      console.error('Error fetching tryout and questions:', err);
      setError(err.message || 'Gagal memuat data tryout dan soal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      // Refresh questions
      fetchTryoutAndQuestions();
    } catch (err: any) {
      console.error('Error deleting question:', err);
      setError(err.message || 'Gagal menghapus soal');
    }
  };

  const handleSaveQuestion = async (questionData: Omit<Question, 'id'> | Partial<Question>) => {
    try {
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
      } else {
        // Insert new question
        const { error } = await supabase
          .from('questions')
          .insert([{ ...questionData, tryout_id: tryoutId }]);

        if (error) throw error;
      }

      // Refresh questions
      fetchTryoutAndQuestions();
      setShowForm(false);
    } catch (err: any) {
      console.error('Error saving question:', err);
      setError(err.message || 'Gagal menyimpan soal');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tryout?.title || 'Soal Tryout'}
              </h1>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Kembali
              </button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tryout?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {questions.length} soal | {tryout?.total_questions} total soal
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Daftar Soal
            </h2>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>Tambah Soal</span>
            </button>
          </div>

          {showForm ? (
            <div className="mb-8">
              <QuestionForm
                question={editingQuestion || undefined}
                onSave={handleSaveQuestion}
                onCancel={handleCancelForm}
              />
            </div>
          ) : null}

          <QuestionList
            questions={questions}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
          />
        </div>
      </div>
    </div>
  );
}