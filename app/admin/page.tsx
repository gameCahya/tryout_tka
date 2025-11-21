'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QuestionForm from '@/components/admin/QuestionForm';
import QuestionList from '@/components/admin/QuestionList';

type Tryout = { id: string; title: string };

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

export default function AdminPage() {
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTryoutForView, setSelectedTryoutForView] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || profile.role !== 'admin') {
        alert('Akses ditolak');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);

      const { data: tryoutList, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title');

      if (!tryoutError) setTryouts(tryoutList || []);
    };

    checkAdmin();
  }, [router]);

  const loadQuestions = async (tryoutId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('tryout_id', tryoutId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setQuestions(data);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;

    try {
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
      loadQuestions(selectedTryoutForView);
    }
    setActiveTab('view');
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  if (!isAdmin) {
    return <div className="p-4">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Panel - Kelola Soal</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {editingQuestion ? '✏️ Edit Soal' : '➕ Tambah Soal'}
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 Lihat Soal
          </button>
        </div>

        {/* Add/Edit Form */}
        {activeTab === 'add' && (
          <QuestionForm
            tryouts={tryouts}
            editingQuestion={editingQuestion}
            onSuccess={handleFormSuccess}
            onCancel={handleCancelEdit}
          />
        )}

        {/* View Questions */}
        {activeTab === 'view' && (
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
    </div>
  );
}