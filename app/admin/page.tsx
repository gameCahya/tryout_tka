'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QuestionForm from '@/components/admin/QuestionForm';
import QuestionList from '@/components/admin/QuestionList';
import ThemeToggle from '@/components/ThemeToggle'; 

type Tryout = { 
  id: string; 
  title: string;
  teacher_id?: string;
  total_questions: number;
  duration_minutes: number;
  explanation_price: number; // Ganti dari price
  school?: string;
  is_shared?: boolean;
};

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[] | null;
  reasoning_answers: { [key: number]: 'benar' | 'salah' } | null;
  question_type: 'single' | 'multiple' | 'reasoning';
  explanation: string;
  tryout_id: string;
};

type TryoutFormData = {
  title: string;
  total_questions: number;
  duration_minutes: number;
  explanation_price: number; // Ganti dari price
  start_time: string;
  end_time: string;
  is_shared: boolean;
};

export default function ManageQuestionsPage() {
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTryoutForView, setSelectedTryoutForView] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'tryout' | 'add' | 'view'>('tryout');
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userSchool, setUserSchool] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showTryoutForm, setShowTryoutForm] = useState(false);
  const [editingTryout, setEditingTryout] = useState<Tryout | null>(null);
  const router = useRouter();

  // Form state
  const [tryoutForm, setTryoutForm] = useState<TryoutFormData>({
    title: '',
    total_questions: 40,
    duration_minutes: 90,
    explanation_price: 15000, // Ganti dari price: 0
    start_time: '',
    end_time: '',
    is_shared: false
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        setUserId(session.user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, school')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          alert('Gagal memuat profil');
          router.push('/dashboard');
          return;
        }

        if (!['admin', 'teacher'].includes(profile.role)) {
          alert('Akses ditolak. Hanya admin dan guru yang dapat mengakses halaman ini.');
          router.push('/dashboard');
          return;
        }

        setUserRole(profile.role);
        setUserSchool(profile.school);

        // Fetch tryouts based on role
        await loadTryouts(profile.role, session.user.id);

        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('Terjadi kesalahan');
        router.push('/dashboard');
      }
    };

    checkAccess();
  }, [router]);

  const loadTryouts = async (role: string, currentUserId: string) => {
  let tryoutQuery = supabase
    .from('tryouts')
    .select('id, title, teacher_id, total_questions, duration_minutes, explanation_price, school, is_shared'); // Ganti price jadi explanation_price

  // If teacher, only show their own tryouts
  if (role === 'teacher') {
    tryoutQuery = tryoutQuery.eq('teacher_id', currentUserId);
  }

  const { data: tryoutList, error: tryoutError } = await tryoutQuery.order('created_at', { ascending: false });

  if (tryoutError) {
    console.error('Error fetching tryouts:', tryoutError);
  } else {
    setTryouts(tryoutList || []);
  }
};

  // Ganti fungsi loadQuestions dengan ini:
const loadQuestions = async (tryoutId: string, forceRefresh = false) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('tryout_id', tryoutId)
    .order('created_at', { ascending: true });

  if (!error && data) {
    // Force new reference to trigger re-render
    if (forceRefresh) {
      setQuestions([]);
      setTimeout(() => {
        setQuestions(data);
      }, 100);
    } else {
      setQuestions(data);
    }
  } else if (error) {
    console.error('Error loading questions:', error);
  }
};


  const handleEdit = (question: Question) => {
    const tryout = tryouts.find(t => t.id === question.tryout_id);
    
    if (userRole === 'teacher' && tryout?.teacher_id !== userId) {
      alert('Anda tidak memiliki izin untuk mengedit soal ini');
      return;
    }

    setEditingQuestion(question);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;

    try {
      const questionToDelete = questions.find(q => q.id === questionId);
      if (!questionToDelete) {
        alert('Soal tidak ditemukan');
        return;
      }

      const tryout = tryouts.find(t => t.id === questionToDelete.tryout_id);
      
      if (userRole === 'teacher' && tryout?.teacher_id !== userId) {
        alert('Anda tidak memiliki izin untuk menghapus soal ini');
        return;
      }

      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      alert('Soal berhasil dihapus!');
      if (selectedTryoutForView) {
        loadQuestions(selectedTryoutForView);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus soal: ' + err.message);
    }
  };

  const handleFormSuccess = () => {
     setEditingQuestion(null);
     if (selectedTryoutForView) {
       loadQuestions(selectedTryoutForView, true); // Add forceRefresh = true
     }
  setActiveTab('view');
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleTryoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tryoutForm.title.trim()) {
      alert('Judul tryout harus diisi');
      return;
    }

    try {
     const tryoutData = {
        title: tryoutForm.title,
        total_questions: tryoutForm.total_questions,
        duration_minutes: tryoutForm.duration_minutes,
        explanation_price: tryoutForm.explanation_price, // Ganti dari price
        start_time: tryoutForm.start_time || null,
        end_time: tryoutForm.end_time || null,
        teacher_id: userId,
        school: userSchool,
        is_shared: tryoutForm.is_shared
      };

      if (editingTryout) {
        // Update existing tryout
        const { error } = await supabase
          .from('tryouts')
          .update(tryoutData)
          .eq('id', editingTryout.id);

        if (error) throw error;
        alert('Tryout berhasil diperbarui!');
      } else {
        // Create new tryout
        const { error } = await supabase
          .from('tryouts')
          .insert([tryoutData]);

        if (error) throw error;
        alert('Tryout berhasil dibuat!');
      }

      // Reset form
      setTryoutForm({
        title: '',
        total_questions: 40,
        duration_minutes: 90,
        explanation_price: 0,
        start_time: '',
        end_time: '',
        is_shared: false
      });
      setShowTryoutForm(false);
      setEditingTryout(null);

      // Reload tryouts
      await loadTryouts(userRole!, userId);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan tryout: ' + err.message);
    }
  };

  const handleEditTryout = (tryout: Tryout) => {
  if (userRole === 'teacher' && tryout.teacher_id !== userId) {
    alert('Anda tidak memiliki izin untuk mengedit tryout ini');
    return;
  }

  setEditingTryout(tryout);
  setTryoutForm({
    title: tryout.title,
    total_questions: tryout.total_questions,
    duration_minutes: tryout.duration_minutes,
    explanation_price: tryout.explanation_price, // Ganti dari price
    start_time: '',
    end_time: '',
    is_shared: tryout.is_shared || false
  });
  setShowTryoutForm(true);
  setActiveTab('tryout');
};

  const handleDeleteTryout = async (tryoutId: string) => {
    const tryout = tryouts.find(t => t.id === tryoutId);
    
    if (userRole === 'teacher' && tryout?.teacher_id !== userId) {
      alert('Anda tidak memiliki izin untuk menghapus tryout ini');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus tryout ini? Semua soal dalam tryout ini akan ikut terhapus.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tryouts')
        .delete()
        .eq('id', tryoutId);

      if (error) throw error;

      alert('Tryout berhasil dihapus!');
      await loadTryouts(userRole!, userId);
      
      if (selectedTryoutForView === tryoutId) {
        setSelectedTryoutForView('');
        setQuestions([]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus tryout: ' + err.message);
    }
  };

  const cancelTryoutForm = () => {
    setShowTryoutForm(false);
    setEditingTryout(null);
    setTryoutForm({
      title: '',
      total_questions: 40,
      duration_minutes: 90,
      explanation_price: 0,
      start_time: '',
      end_time: '',
      is_shared: false
    });
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <ThemeToggle />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userRole === 'admin' ? 'Admin Panel - Kelola Tryout & Soal' : 'Kelola Tryout & Soal'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {userRole === 'admin' 
                ? 'Kelola semua tryout dan soal' 
                : 'Kelola tryout dan soal yang Anda buat'}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Kembali
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('tryout')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'tryout'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            📚 Kelola Tryout
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {editingQuestion ? '✏️ Edit Soal' : '➕ Tambah Soal'}
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            📋 Lihat Soal
          </button>
        </div>

        {/* Tryout Management Tab */}
        {activeTab === 'tryout' && (
          <div>
            {/* Create Tryout Button */}
            {!showTryoutForm && (
              <div className="mb-6">
                <button
                  onClick={() => setShowTryoutForm(true)}
                  className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
                >
                  ➕ Buat Tryout Baru
                </button>
              </div>
            )}

            {/* Tryout Form */}
            {showTryoutForm && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {editingTryout ? '✏️ Edit Tryout' : '➕ Buat Tryout Baru'}
                </h2>
                <form onSubmit={handleTryoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Judul Tryout *
                    </label>
                    <input
                      type="text"
                      value={tryoutForm.title}
                      onChange={(e) => setTryoutForm({ ...tryoutForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Contoh: Tryout TKA Matematika 1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total Soal *
                      </label>
                      <input
                        type="number"
                        value={tryoutForm.total_questions}
                        onChange={(e) => setTryoutForm({ ...tryoutForm, total_questions: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Durasi (menit) *
                      </label>
                      <input
                        type="number"
                        value={tryoutForm.duration_minutes}
                        onChange={(e) => setTryoutForm({ ...tryoutForm, duration_minutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        value={tryoutForm.explanation_price}
                        onChange={(e) => setTryoutForm({ ...tryoutForm, explanation_price: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        min="0"
                        placeholder="0 untuk gratis"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waktu Mulai (Opsional)
                      </label>
                      <input
                        type="datetime-local"
                        value={tryoutForm.start_time}
                        onChange={(e) => setTryoutForm({ ...tryoutForm, start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waktu Berakhir (Opsional)
                      </label>
                      <input
                        type="datetime-local"
                        value={tryoutForm.end_time}
                        onChange={(e) => setTryoutForm({ ...tryoutForm, end_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <input
                      type="checkbox"
                      id="is_shared"
                      checked={tryoutForm.is_shared}
                      onChange={(e) => setTryoutForm({ ...tryoutForm, is_shared: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="is_shared" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      🌐 Bagikan tryout ini ke semua sekolah
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Jika dicentang, tryout dapat diakses oleh siswa dari semua sekolah
                      </span>
                    </label>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>🏫 Sekolah:</strong> {userSchool}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Tryout ini akan otomatis terkait dengan sekolah Anda
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                    >
                      {editingTryout ? '💾 Update Tryout' : '✅ Simpan Tryout'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelTryoutForm}
                      className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      ❌ Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tryout List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📚 Daftar Tryout ({tryouts.length})
              </h2>

              {tryouts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Belum Ada Tryout
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Klik tombol "Buat Tryout Baru" untuk memulai
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tryouts.map((tryout) => (
                    <div
                      key={tryout.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {tryout.title}
                            </h3>
                            {tryout.is_shared && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                🌐 Dibagikan
                              </span>
                            )}
                            {tryout.school && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                🏫 {tryout.school}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>📝 {tryout.total_questions} soal</span>
                            <span>⏱️ {tryout.duration_minutes} menit</span>
                            <span>💰 {tryout.explanation_price === 0 ? 'Gratis' : `Rp ${tryout.explanation_price.toLocaleString('id-ID')}`}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-wrap">
                          <button
                            onClick={() => window.open(`/admin/tryout/${tryout.id}/preview`, '_blank')}
                            className="px-3 py-1.5 bg-purple-500 dark:bg-purple-600 text-white rounded-lg hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                            title="Preview tryout di tab baru"
                          >
                            👁️ Preview
                          </button>
                          <button
                            onClick={() => handleEditTryout(tryout)}
                            className="px-3 py-1.5 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                            title="Edit tryout"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTryout(tryout.id)}
                            className="px-3 py-1.5 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                            title="Hapus tryout"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Question Form */}
        {activeTab === 'add' && (
          <div>
            {tryouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Belum Ada Tryout
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Silakan buat tryout terlebih dahulu untuk menambahkan soal
                </p>
                <button
                  onClick={() => setActiveTab('tryout')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Buat Tryout
                </button>
              </div>
            ) : (
              <QuestionForm
                tryouts={tryouts}
                editingQuestion={editingQuestion}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelEdit}
              />
            )}
          </div>
        )}

        {/* View Questions */}
        {activeTab === 'view' && (
          <div>
            {tryouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Belum Ada Tryout
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Silakan buat tryout terlebih dahulu untuk melihat soal
                </p>
                <button
                  onClick={() => setActiveTab('tryout')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Buat Tryout
                </button>
              </div>
            ) : (
              <QuestionList
                tryouts={tryouts}
                questions={questions}
                selectedTryout={selectedTryoutForView}
                onTryoutChange={(tryoutId: string) => {
                  setSelectedTryoutForView(tryoutId);
                  if (tryoutId) loadQuestions(tryoutId);
                }}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}