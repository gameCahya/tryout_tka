'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// ===================== TYPES =====================
interface Tryout {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface Question {
  id: string;
  tryout_id: string;
  question_text: string;
  question_type: 'single' | 'multiple';
  options: string[];
  correct_answer_index: number | null;
  correct_answers: number[] | null;
  question_points: number;
  question_order: number;
}

interface TryoutForm {
  title: string;
  description: string;
  duration_minutes: number;
}

interface QuestionForm {
  question_text: string;
  question_type: 'single' | 'multiple';
  options: string[];
  correct_answer_index: number;
  correct_answers: number[];
  question_points: number;
}

const EMPTY_QUESTION: QuestionForm = {
  question_text: '',
  question_type: 'single',
  options: ['', '', '', ''],
  correct_answer_index: 0,
  correct_answers: [],
  question_points: 1,
};

// ===================== MAIN COMPONENT =====================
export default function AdminTryoutsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTryout, setSelectedTryout] = useState<Tryout | null>(null);

  // Modal states
  const [showCreateTryout, setShowCreateTryout] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [savingTryout, setSavingTryout] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Forms
  const [tryoutForm, setTryoutForm] = useState<TryoutForm>({
    title: '', description: '', duration_minutes: 60,
  });
  const [questionForm, setQuestionForm] = useState<QuestionForm>({ ...EMPTY_QUESTION });

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastIsError, setToastIsError] = useState(false);

  const toast = (msg: string, isError = false) => {
    setToastMsg(msg);
    setToastIsError(isError);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadTryouts = useCallback(async () => {
    const { data, error } = await supabase
      .from('smpabbs_tryouts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTryouts(data || []);
  }, [supabase]);

  const loadQuestions = useCallback(async (tryoutId: string) => {
    const { data, error } = await supabase
      .from('smpabbs_questions')
      .select('*')
      .eq('tryout_id', tryoutId)
      .order('question_order', { ascending: true });
    if (!error) setQuestions(data || []);
  }, [supabase]);

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

  // ===== TRYOUT HANDLERS =====
  const handleSelectTryout = async (tryout: Tryout) => {
    setSelectedTryout(tryout);
    await loadQuestions(tryout.id);
  };

  const handleCreateTryout = async () => {
    if (!tryoutForm.title.trim()) { toast('Judul tryout harus diisi', true); return; }
    setSavingTryout(true);
    try {
      const { data, error } = await supabase
        .from('smpabbs_tryouts')
        .insert({
          title: tryoutForm.title.trim(),
          description: tryoutForm.description.trim(),
          duration_minutes: tryoutForm.duration_minutes,
          total_questions: 0,
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;

      setTryouts(prev => [data, ...prev]);
      setShowCreateTryout(false);
      setTryoutForm({ title: '', description: '', duration_minutes: 60 });
      setSelectedTryout(data);
      setQuestions([]);
      toast('Tryout berhasil dibuat! Sekarang tambahkan soal.');
    } catch (err) {
      toast(`Gagal: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`, true);
    } finally {
      setSavingTryout(false);
    }
  };

  const handleDeleteTryout = async (tryout: Tryout) => {
    if (!confirm(`Hapus tryout "${tryout.title}"? Semua soal akan ikut terhapus.`)) return;
    try {
      const { error } = await supabase.from('smpabbs_tryouts').delete().eq('id', tryout.id);
      if (error) throw error;
      setTryouts(prev => prev.filter(t => t.id !== tryout.id));
      if (selectedTryout?.id === tryout.id) { setSelectedTryout(null); setQuestions([]); }
      toast('Tryout berhasil dihapus.');
    } catch { toast('Gagal menghapus tryout.', true); }
  };

  const handleToggleTryoutStatus = async (tryout: Tryout) => {
    const { error } = await supabase
      .from('smpabbs_tryouts')
      .update({ is_active: !tryout.is_active })
      .eq('id', tryout.id);
    if (!error) {
      const updated = { ...tryout, is_active: !tryout.is_active };
      setTryouts(prev => prev.map(t => t.id === tryout.id ? updated : t));
      if (selectedTryout?.id === tryout.id) setSelectedTryout(updated);
      toast(`Tryout ${!tryout.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    }
  };

  // ===== QUESTION HANDLERS =====
  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ ...EMPTY_QUESTION });
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: [...q.options],
      correct_answer_index: q.correct_answer_index ?? 0,
      correct_answers: q.correct_answers || [],
      question_points: q.question_points,
    });
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setQuestionForm({ ...EMPTY_QUESTION });
  };

  const handleSaveQuestion = async () => {
    if (!selectedTryout) return;
    if (!questionForm.question_text.trim()) { toast('Teks soal harus diisi', true); return; }
    if (questionForm.options.some(o => !o.trim())) { toast('Semua pilihan jawaban harus diisi', true); return; }
    if (questionForm.question_type === 'multiple' && questionForm.correct_answers.length === 0) {
      toast('Pilih minimal satu jawaban benar', true); return;
    }

    setSavingQuestion(true);
    try {
      const questionData = {
        tryout_id: selectedTryout.id,
        question_text: questionForm.question_text.trim(),
        question_type: questionForm.question_type,
        options: questionForm.options.map(o => o.trim()),
        correct_answer_index: questionForm.question_type === 'single' ? questionForm.correct_answer_index : null,
        correct_answers: questionForm.question_type === 'multiple' ? questionForm.correct_answers : null,
        question_points: questionForm.question_points,
        question_order: editingQuestion ? editingQuestion.question_order : questions.length + 1,
      };

      if (editingQuestion) {
        const { error } = await supabase.from('smpabbs_questions').update(questionData).eq('id', editingQuestion.id);
        if (error) throw error;
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } as Question : q));
        toast('Soal berhasil diperbarui.');
      } else {
        const { data, error } = await supabase.from('smpabbs_questions').insert(questionData).select().single();
        if (error) throw error;
        const newQuestions = [...questions, data];
        setQuestions(newQuestions);
        const newTotal = newQuestions.length;
        await supabase.from('smpabbs_tryouts').update({ total_questions: newTotal }).eq('id', selectedTryout.id);
        setSelectedTryout(prev => prev ? { ...prev, total_questions: newTotal } : null);
        setTryouts(prev => prev.map(t => t.id === selectedTryout.id ? { ...t, total_questions: newTotal } : t));
        toast('Soal berhasil ditambahkan!');
      }
      closeQuestionModal();
    } catch (err) {
      toast(`Gagal: ${err instanceof Error ? err.message : 'Error'}`, true);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Hapus soal ini?')) return;
    try {
      const { error } = await supabase.from('smpabbs_questions').delete().eq('id', questionId);
      if (error) throw error;
      const newQuestions = questions.filter(q => q.id !== questionId);
      setQuestions(newQuestions);
      if (selectedTryout) {
        await supabase.from('smpabbs_tryouts').update({ total_questions: newQuestions.length }).eq('id', selectedTryout.id);
        setSelectedTryout(prev => prev ? { ...prev, total_questions: newQuestions.length } : null);
        setTryouts(prev => prev.map(t => t.id === selectedTryout.id ? { ...t, total_questions: newQuestions.length } : t));
      }
      toast('Soal berhasil dihapus.');
    } catch { toast('Gagal menghapus soal.', true); }
  };

  // ===== OPTIONS HELPERS =====
  const updateOption = (i: number, value: string) => {
    const opts = [...questionForm.options];
    opts[i] = value;
    setQuestionForm(prev => ({ ...prev, options: opts }));
  };

  const addOption = () => {
    if (questionForm.options.length < 6)
      setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (i: number) => {
    if (questionForm.options.length <= 2) return;
    const opts = questionForm.options.filter((_, idx) => idx !== i);
    setQuestionForm(prev => ({
      ...prev,
      options: opts,
      correct_answer_index: Math.min(prev.correct_answer_index, opts.length - 1),
      correct_answers: prev.correct_answers.filter(idx => idx < opts.length),
    }));
  };

  const toggleMultiCorrect = (i: number) => {
    setQuestionForm(prev => ({
      ...prev,
      correct_answers: prev.correct_answers.includes(i)
        ? prev.correct_answers.filter(x => x !== i)
        : [...prev.correct_answers, i],
    }));
  };

  // ===================== LOADING =====================
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Memuat halaman admin...</p>
        </div>
      </div>
    );
  }

  // ===================== RENDER =====================
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

      {/* ===== HEADER ===== */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/smpabbsska/dashboard/admin"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Kembali ke Dashboard"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ===== LEFT: TRYOUT LIST ===== */}
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Daftar Tryout</h2>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {tryouts.length}
                </span>
              </div>

              {tryouts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Belum ada tryout</p>
                  <button onClick={() => setShowCreateTryout(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Buat tryout baru →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {tryouts.map(tryout => (
                    <div
                      key={tryout.id}
                      onClick={() => handleSelectTryout(tryout)}
                      className={`p-4 cursor-pointer transition-all group relative ${
                        selectedTryout?.id === tryout.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tryout.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <p className={`text-sm font-semibold truncate ${selectedTryout?.id === tryout.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                              {tryout.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 ml-3.5">
                            {tryout.total_questions} soal · {tryout.duration_minutes} mnt
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteTryout(tryout); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-0.5 shrink-0"
                          title="Hapus tryout"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===== RIGHT: QUESTION MANAGER ===== */}
          <div className="flex-1 min-w-0">
            {!selectedTryout ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
                <div className="text-5xl mb-4">👈</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pilih Tryout</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                  Klik salah satu tryout di panel kiri untuk mulai mengelola soal-soalnya.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Tryout Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTryout.title}</h2>
                      {selectedTryout.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedTryout.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                          📋 {questions.length} soal
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2.5 py-1 rounded-full font-medium">
                          ⏱ {selectedTryout.duration_minutes} menit
                        </span>
                        <button
                          onClick={() => handleToggleTryoutStatus(selectedTryout)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            selectedTryout.is_active
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {selectedTryout.is_active ? '✓ Aktif' : '⏸ Nonaktif'} (klik toggle)
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={openAddQuestion}
                      className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Soal
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                {questions.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="text-4xl mb-3">📄</div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Belum ada soal</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                      Klik &quot;Tambah Soal&quot; untuk mulai membuat soal tryout ini.
                    </p>
                    <button
                      onClick={openAddQuestion}
                      className="bg-linear-to-r from-blue-600 to-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
                    >
                      Tambah Soal Pertama
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {questions.map((q, idx) => {
                      return (
                        <div key={q.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                              q.question_type === 'single'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed pr-2">
                                  {q.question_text}
                                </p>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => openEditQuestion(q)}
                                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Edit soal"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Hapus soal"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Options */}
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options.map((opt, optIdx) => {
                                  const isCorrect = q.question_type === 'single'
                                    ? q.correct_answer_index === optIdx
                                    : (q.correct_answers || []).includes(optIdx);
                                  return (
                                    <div key={optIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                                      isCorrect
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      <span className="font-mono text-xs opacity-60 shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span className="truncate">{opt}</span>
                                      {isCorrect && <span className="ml-auto shrink-0 text-xs">✓</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  q.question_type === 'single'
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                }`}>
                                  {q.question_type === 'single' ? 'Pilihan Ganda' : 'Multi Jawaban'}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{q.question_points} poin</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL: CREATE TRYOUT ===== */}
      {showCreateTryout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Buat Tryout Baru</h3>
              <button onClick={() => setShowCreateTryout(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Judul Tryout <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tryoutForm.title}
                  onChange={e => setTryoutForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Contoh: Tryout Matematika Kelas 6"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Deskripsi</label>
                <textarea
                  value={tryoutForm.description}
                  onChange={e => setTryoutForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  placeholder="Deskripsi singkat tryout ini..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Durasi (menit)</label>
                <div className="flex gap-2 mb-2">
                  {[30, 45, 60, 90, 120].map(m => (
                    <button key={m} onClick={() => setTryoutForm(p => ({ ...p, duration_minutes: m }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tryoutForm.duration_minutes === m
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  type="number" min={5} max={300}
                  value={tryoutForm.duration_minutes}
                  onChange={e => setTryoutForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowCreateTryout(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button onClick={handleCreateTryout} disabled={savingTryout}
                className="flex-1 py-2.5 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-60 shadow-sm">
                {savingTryout ? 'Menyimpan...' : 'Buat Tryout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD/EDIT QUESTION ===== */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-2xl">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {editingQuestion ? '✏️ Edit Soal' : '➕ Tambah Soal Baru'}
              </h3>
              <button onClick={closeQuestionModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Tipe Soal</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'single', label: 'Pilihan Ganda', desc: 'Satu jawaban benar', icon: '◉' },
                    { key: 'multiple', label: 'Multi Jawaban', desc: 'Beberapa jawaban benar', icon: '☑' },
                  ].map(type => (
                    <button
                      key={type.key}
                      onClick={() => setQuestionForm(p => ({
                        ...p,
                        question_type: type.key as 'single' | 'multiple',
                        correct_answers: [],
                        correct_answer_index: 0,
                      }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        questionForm.question_type === type.key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xl block mb-1">{type.icon}</span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{type.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Teks Soal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={e => setQuestionForm(p => ({ ...p, question_text: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  placeholder="Tuliskan pertanyaan di sini..."
                  autoFocus={!editingQuestion}
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Pilihan Jawaban <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {questionForm.question_type === 'single'
                      ? '🔵 Klik lingkaran = jawaban benar'
                      : '✅ Centang semua jawaban benar'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {questionForm.options.map((opt, i) => {
                    const isMarkedCorrect = questionForm.question_type === 'single'
                      ? questionForm.correct_answer_index === i
                      : questionForm.correct_answers.includes(i);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        {/* Correct indicator */}
                        {questionForm.question_type === 'single' ? (
                          <button
                            onClick={() => setQuestionForm(p => ({ ...p, correct_answer_index: i }))}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isMarkedCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                            }`}
                            title="Tandai jawaban benar"
                          >
                            {isMarkedCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleMultiCorrect(i)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isMarkedCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                            }`}
                            title="Tandai jawaban benar"
                          >
                            {isMarkedCorrect && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )}

                        {/* Letter badge */}
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                          {String.fromCharCode(65 + i)}
                        </div>

                        {/* Input */}
                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(i, e.target.value)}
                          placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                          className={`flex-1 px-3 py-2.5 border text-sm rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            isMarkedCorrect
                              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        />

                        {questionForm.options.length > 2 && (
                          <button onClick={() => removeOption(i)}
                            className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {questionForm.options.length < 6 && (
                  <button onClick={addOption}
                    className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah pilihan jawaban
                  </button>
                )}
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Poin per Soal</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5].map(p => (
                    <button key={p}
                      onClick={() => setQuestionForm(prev => ({ ...prev, question_points: p }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        questionForm.question_points === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      {p}
                    </button>
                  ))}
                  <input
                    type="number" min={1} max={100}
                    value={questionForm.question_points}
                    onChange={e => setQuestionForm(p => ({ ...p, question_points: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={closeQuestionModal}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveQuestion} disabled={savingQuestion}
                className="flex-1 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-60 shadow-sm">
                {savingQuestion ? 'Menyimpan...' : editingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}