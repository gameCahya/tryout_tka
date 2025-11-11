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
  correct_answers: number[];
  explanation: string;
  has_table: boolean;
  question_type: 'single' | 'multiple' | 'reasoning'; // Tambah reasoning
  reasoning_answers?: { [key: number]: 'benar' | 'salah' }; // Untuk PGK Kategori
};

export default function AdminPage() {
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [form, setForm] = useState<QuestionForm>({
    tryout_id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer_index: 0,
    correct_answers: [],
    explanation: '',
    has_table: false,
    question_type: 'single',
    reasoning_answers: {},
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // For table builder
  const [tableRows, setTableRows] = useState<string[][]>([
    ['No Soal', 'Kompetensi', 'Sub Kompetensi', 'Bentuk Soal', 'Kunci'],
    ['', '', '', '', '']
  ]);

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

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleMultipleAnswerToggle = (index: number) => {
    const newAnswers = [...form.correct_answers];
    const answerIndex = newAnswers.indexOf(index);
    
    if (answerIndex > -1) {
      newAnswers.splice(answerIndex, 1);
    } else {
      newAnswers.push(index);
    }
    
    setForm({ ...form, correct_answers: newAnswers.sort() });
  };

  const handleReasoningAnswerChange = (optionIndex: number, value: 'benar' | 'salah') => {
    const newReasoningAnswers = { ...form.reasoning_answers };
    newReasoningAnswers[optionIndex] = value;
    setForm({ ...form, reasoning_answers: newReasoningAnswers });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newTable = [...tableRows];
    newTable[rowIndex][colIndex] = value;
    setTableRows(newTable);
  };

  const addTableRow = () => {
    setTableRows([...tableRows, Array(tableRows[0].length).fill('')]);
  };

  const removeTableRow = (index: number) => {
    if (tableRows.length > 2) {
      setTableRows(tableRows.filter((_, i) => i !== index));
    }
  };

  const generateTableMarkdown = () => {
    let markdown = '\n\n';
    tableRows.forEach((row, idx) => {
      markdown += '| ' + row.join(' | ') + ' |\n';
      if (idx === 0) {
        markdown += '| ' + row.map(() => '---').join(' | ') + ' |\n';
      }
    });
    return markdown;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('questions')
          .upload(`images/${fileName}`, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('questions')
          .getPublicUrl(data.path);

        imageUrl = publicUrlData.publicUrl;
      }

      // Build question text with table if needed
      let questionText = form.question_text;
      
      if (form.has_table) {
        questionText += generateTableMarkdown();
      }

      if (imageUrl) {
        questionText += `\n\n![Soal](${imageUrl.trim()})`;
      }

      // Simpan soal ke database
      const insertData: any = {
        tryout_id: form.tryout_id,
        question_text: questionText,
        options: form.options,
        correct_answer_index: form.question_type === 'single' ? form.correct_answer_index : -1,
        correct_answers: form.question_type === 'multiple' ? form.correct_answers : null,
        question_type: form.question_type,
        reasoning_answers: form.question_type === 'reasoning' ? form.reasoning_answers : null,
        explanation: form.explanation,
      };

      const { error } = await supabase.from('questions').insert(insertData);

      if (error) throw error;

      // Reset form
      setForm({
        tryout_id: form.tryout_id,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer_index: 0,
        correct_answers: [],
        explanation: '',
        has_table: false,
        question_type: 'single',
        reasoning_answers: {},
      });
      setImageFile(null);
      setTableRows([
        ['No Soal', 'Kompetensi', 'Sub Kompetensi', 'Bentuk Soal', 'Kunci'],
        ['', '', '', '', '']
      ]);
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
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tipe Soal</label>
            <select
              value={form.question_type}
              onChange={(e) => setForm({ ...form, question_type: e.target.value as 'single' | 'multiple' | 'reasoning' })}
              className="w-full p-2 border rounded"
            >
              <option value="single">Single Answer (Radio)</option>
              <option value="multiple">Multiple Answer - PGK MCMA (Checkbox)</option>
              <option value="reasoning">PGK Kategori - Benar/Salah (Statement Reasoning)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.has_table}
                onChange={(e) => setForm({ ...form, has_table: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium">Tambahkan Tabel</span>
            </label>
          </div>

          {form.has_table && (
            <div className="mb-4 p-4 border rounded bg-gray-50">
              <label className="block text-sm font-medium mb-2">Tabel Data</label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <tbody>
                    {tableRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} className="border p-1">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleTableCellChange(rowIdx, colIdx, e.target.value)}
                              className="w-full p-1 text-sm"
                            />
                          </td>
                        ))}
                        {rowIdx > 0 && (
                          <td className="p-1">
                            <button
                              type="button"
                              onClick={() => removeTableRow(rowIdx)}
                              className="text-red-600 text-xs px-2"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addTableRow}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                + Tambah Baris
              </button>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Gambar Soal (Opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />
          </div>

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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Jawaban Benar {form.question_type === 'multiple' && '(Pilih lebih dari satu untuk MCMA)'}
              {form.question_type === 'reasoning' && '(Pilih Benar/Salah untuk setiap pernyataan)'}
            </label>
            
            {form.question_type === 'single' ? (
              <select
                value={form.correct_answer_index}
                onChange={(e) => setForm({ ...form, correct_answer_index: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
                required
              >
                {form.options.map((_, idx) => (
                  <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}</option>
                ))}
              </select>
            ) : form.question_type === 'multiple' ? (
              <div className="space-y-2 p-3 border rounded bg-gray-50">
                {form.options.map((option, idx) => (
                  <label key={idx} className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={form.correct_answers.includes(idx)}
                      onChange={() => handleMultipleAnswerToggle(idx)}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    <span className="text-sm">{option || '(Belum diisi)'}</span>
                  </label>
                ))}
                {form.correct_answers.length === 0 && (
                  <p className="text-red-500 text-sm mt-2">⚠️ Pilih minimal 1 jawaban benar</p>
                )}
                {form.correct_answers.length > 0 && (
                  <p className="text-green-600 text-sm mt-2 font-medium">
                    ✓ Terpilih: {form.correct_answers.map(i => String.fromCharCode(65 + i)).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              // Reasoning type - Benar/Salah for each option
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">#</th>
                      <th className="border p-2 text-left">Pernyataan</th>
                      <th className="border p-2 text-center w-24">Benar</th>
                      <th className="border p-2 text-center w-24">Salah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.options.map((option, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border p-2 font-medium">{String.fromCharCode(65 + idx)}.</td>
                        <td className="border p-2">{option || '(Belum diisi)'}</td>
                        <td className="border p-2 text-center">
                          <input
                            type="radio"
                            name={`reasoning_${idx}`}
                            checked={form.reasoning_answers?.[idx] === 'benar'}
                            onChange={() => handleReasoningAnswerChange(idx, 'benar')}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border p-2 text-center">
                          <input
                            type="radio"
                            name={`reasoning_${idx}`}
                            checked={form.reasoning_answers?.[idx] === 'salah'}
                            onChange={() => handleReasoningAnswerChange(idx, 'salah')}
                            className="w-4 h-4"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Object.keys(form.reasoning_answers || {}).length < form.options.filter(o => o).length && (
                  <p className="text-red-500 text-sm mt-2">⚠️ Tentukan Benar/Salah untuk semua pernyataan</p>
                )}
              </div>
            )}
          </div>

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
            disabled={
              loading || 
              !form.tryout_id || 
              (form.question_type === 'multiple' && form.correct_answers.length === 0) ||
              (form.question_type === 'reasoning' && Object.keys(form.reasoning_answers || {}).length < form.options.filter(o => o).length)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Tambah Soal'}
          </button>
        </form>
      </div>
    </div>
  );
}