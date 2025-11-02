'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tryout = { id: string; title: string };
type QuestionForm = {
  tryout_id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
};

export default function AdminPage() {
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [form, setForm] = useState<QuestionForm>({
    tryout_id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer_index: 0,
    explanation: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Cek apakah admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data : { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data : profile, error } = await supabase
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

      // Ambil daftar tryout
      const { data: tryoutList, error: tryoutError } = await supabase
        .from('tryouts')
        .select('id, title');

      if (!tryoutError) setTryouts(tryoutList || []);
    };

    checkAdmin();
  }, [router]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

     // Upload gambar jika ada
    if (imageFile) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const {  data, error: uploadError } = await supabase.storage
    .from('questions')
    .upload(`images/${fileName}`, imageFile);

    if (uploadError) throw uploadError;

    // Ambil URL publik
    const {  data: publicUrlData } = supabase.storage
    .from('questions')
    .getPublicUrl(data.path);

    imageUrl = publicUrlData.publicUrl; // ✅ ini string
    }

      // Simpan soal

     // Setelah upload gambar, gabungkan dengan teks soal
    const questionText = imageUrl
        ? `${form.question_text}\n\n![Soal](${imageUrl.trim()})` // ✅ pakai .trim()
        : form.question_text;

      const { error } = await supabase.from('questions').insert({
        tryout_id: form.tryout_id,
        question_text: questionText,
        options: form.options,
        correct_answer_index: form.correct_answer_index,
        explanation: form.explanation,
      });

      if (error) throw error;

      // Reset form
      setForm({
        tryout_id: form.tryout_id,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer_index: 0,
        explanation: '',
      });
      setImageFile(null);
      alert('Soal berhasil ditambahkan!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal menambahkan soal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-4">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin - Tambah Soal</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {/* Pilih Tryout */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tryout</label>
            <select
              value={form.tryout_id}
              onChange={(e) => setForm({ ...form, tryout_id: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Pilih tryout</option>
              {tryouts.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Teks Soal */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Teks Soal</label>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>

          {/* Upload Gambar */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Gambar Soal (Opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Pilihan Jawaban */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pilihan Jawaban</label>
            {form.options.map((option, idx) => (
              <div key={idx} className="flex items-center mb-2">
                <span className="w-6 mr-2">{String.fromCharCode(65 + idx)}.</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  required
                />
              </div>
            ))}
          </div>

          {/* Jawaban Benar */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Jawaban Benar</label>
            <select
              value={form.correct_answer_index}
              onChange={(e) => setForm({ ...form, correct_answer_index: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              required
            >
              {form.options.map((_, idx) => (
                <option key={idx} value={idx}>
                  {String.fromCharCode(65 + idx)}
                </option>
              ))}
            </select>
          </div>

          {/* Penjelasan */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Pembahasan</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.tryout_id}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Tambah Soal'}
          </button>
        </form>
      </div>
    </div>
  );
}