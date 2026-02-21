'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

import { Tryout, Question, TryoutForm, QuestionForm, EMPTY_QUESTION } from '../../types';
import { useTryouts } from '../../hooks/useTryouts';
import { useQuestions } from '../../hooks/useQuestions';
import TryoutList from '../../components/TryoutList';
import QuestionManager from '../../components/QuestionManager';
import CreateTryoutModal from '../../components/modals/CreateTryoutModal';
import QuestionModal from '../../components/modals/QuestionModal';

export default function AdminTryoutsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [selectedTryout, setSelectedTryout] = useState<Tryout | null>(null);
  const [showCreateTryout, setShowCreateTryout] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [tryoutForm, setTryoutForm] = useState<TryoutForm>({ title: '', description: '', duration_minutes: 60 });
  const [questionForm, setQuestionForm] = useState<QuestionForm>({ ...EMPTY_QUESTION });

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastIsError, setToastIsError] = useState(false);

  const toast = (msg: string, isError = false) => {
    setToastMsg(msg);
    setToastIsError(isError);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Hooks
  const {
    tryouts, savingTryout,
    loadTryouts, createTryout, deleteTryout, toggleTryoutStatus, updateTryoutQuestionCount,
  } = useTryouts(toast);

  const {
    questions, savingQuestion,
    imagePreview, uploadingImage, fileInputRef,
    loadQuestions, handleImageChange, clearImage, setImagePreview,
    saveQuestion, deleteQuestion, resetQuestions,
  } = useQuestions(toast, (tryoutId, count) => {
    updateTryoutQuestionCount(tryoutId, count);
    setSelectedTryout(prev => prev ? { ...prev, total_questions: count } : null);
  });

  // Auth check
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/smpabbsska/login'); return; }

      const { data: profile } = await supabase
        .from('smpabbs_profiles')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.replace('/smpabbsska/dashboard');
        return;
      }
      await loadTryouts();
      setLoading(false);
    };
    init();
  }, [supabase, router, loadTryouts]);

  // Handlers
  const handleSelectTryout = async (tryout: Tryout) => {
    setSelectedTryout(tryout);
    await loadQuestions(tryout.id);
  };

  const handleCreateTryout = () => {
    createTryout(tryoutForm, (newTryout) => {
      setShowCreateTryout(false);
      setTryoutForm({ title: '', description: '', duration_minutes: 60 });
      setSelectedTryout(newTryout);
      resetQuestions();
    });
  };

  const handleDeleteTryout = (tryout: Tryout) => {
    deleteTryout(tryout, selectedTryout?.id, () => {
      setSelectedTryout(null);
      resetQuestions();
    });
  };

  const handleToggleStatus = (tryout: Tryout) => {
    toggleTryoutStatus(tryout, (updated) => setSelectedTryout(updated));
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ ...EMPTY_QUESTION });
    clearImage();
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ? [...q.options] : ['', '', '', ''],
      correct_answer_index: q.correct_answer_index ?? 0,
      correct_answers: q.correct_answers || [],
      essay_answer: q.essay_answer || '',
      question_points: q.question_points,
      image_url: q.image_url || null,
    });
    setImagePreview(q.image_url || null);
    clearImage();
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setQuestionForm({ ...EMPTY_QUESTION });
    clearImage();
  };

  const handleSaveQuestion = () => {
    if (!selectedTryout) return;
    saveQuestion(questionForm, editingQuestion, selectedTryout, closeQuestionModal);
  };

  const handleRemoveImage = () => {
    clearImage();
    setQuestionForm(prev => ({ ...prev, image_url: null }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">Memuat halaman admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl font-medium text-sm ${
          toastIsError ? 'bg-red-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
        }`}>
          {toastIsError ? '❌' : '✅'} {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/smpabbsska/dashboard/admin"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-600 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
              A
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Kelola Tryout & Soal</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">SMP ABBS Surakarta</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateTryout(true)}
            className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Tryout Baru
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <TryoutList
            tryouts={tryouts}
            selectedTryout={selectedTryout}
            onSelect={handleSelectTryout}
            onDelete={handleDeleteTryout}
            onCreateNew={() => setShowCreateTryout(true)}
          />
          <QuestionManager
            selectedTryout={selectedTryout}
            questions={questions}
            onAddQuestion={openAddQuestion}
            onEditQuestion={openEditQuestion}
            onDeleteQuestion={(id) => selectedTryout && deleteQuestion(id, selectedTryout.id)}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      {/* Modals */}
      {showCreateTryout && (
        <CreateTryoutModal
          form={tryoutForm}
          saving={savingTryout}
          onChange={setTryoutForm}
          onSave={handleCreateTryout}
          onClose={() => setShowCreateTryout(false)}
        />
      )}

      {showQuestionModal && (
        <QuestionModal
          isEditing={!!editingQuestion}
          form={questionForm}
          saving={savingQuestion}
          uploadingImage={uploadingImage}
          imagePreview={imagePreview}
          fileInputRef={fileInputRef}
          onFormChange={setQuestionForm}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
          onSave={handleSaveQuestion}
          onClose={closeQuestionModal}
        />
      )}
    </div>
  );
}