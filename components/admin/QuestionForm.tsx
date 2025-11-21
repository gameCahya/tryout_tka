'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AnswerSelector from './AnswerSelector';
import TableBuilder from './TableBuilder';

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

type QuestionFormProps = {
  tryouts: Tryout[];
  editingQuestion: Question | null;
  onSuccess: () => void;
  onCancel: () => void;
};

type FormData = {
  tryout_id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[];
  explanation: string;
  has_table: boolean;
  question_type: 'single' | 'multiple' | 'reasoning';
  reasoning_answers: { [key: number]: 'benar' | 'salah' };
};

export default function QuestionForm({ tryouts, editingQuestion, onSuccess, onCancel }: QuestionFormProps) {
  const [form, setForm] = useState<FormData>(() => {
    if (editingQuestion) {
      return {
        tryout_id: editingQuestion.tryout_id,
        question_text: editingQuestion.question_text,
        options: editingQuestion.options,
        correct_answer_index: editingQuestion.correct_answer_index,
        correct_answers: editingQuestion.correct_answers || [],
        explanation: editingQuestion.explanation,
        has_table: false,
        question_type: editingQuestion.question_type,
        reasoning_answers: editingQuestion.reasoning_answers || {},
      };
    }
    return {
      tryout_id: '',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer_index: 0,
      correct_answers: [],
      explanation: '',
      has_table: false,
      question_type: 'single',
      reasoning_answers: {},
    };
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['No Soal', 'Kompetensi', 'Sub Kompetensi', 'Bentuk Soal', 'Kunci'],
    ['', '', '', '', '']
  ]);

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

      let questionText = form.question_text;
      
      if (form.has_table) {
        questionText += generateTableMarkdown();
      }

      if (imageUrl) {
        questionText += `\n\n![Soal](${imageUrl.trim()})`;
      }

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

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(insertData)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        alert('Soal berhasil diupdate!');
      } else {
        const { error } = await supabase.from('questions').insert(insertData);
        if (error) throw error;
        alert('Soal berhasil ditambahkan!');
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan soal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
      {editingQuestion && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
          <span className="text-yellow-800 font-medium">✏️ Mode Edit Soal</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-red-600 hover:underline"
          >
            Batal Edit
          </button>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tryout</label>
        <select
          value={form.tryout_id}
          onChange={(e) => setForm({ ...form, tryout_id: e.target.value })}
          className="w-full p-2 border rounded"
          required
          disabled={!!editingQuestion}
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
          onChange={(e) => setForm({ ...form, question_type: e.target.value as any })}
          className="w-full p-2 border rounded"
        >
          <option value="single">Single Answer (Radio)</option>
          <option value="multiple">Multiple Answer - PGK MCMA (Checkbox)</option>
          <option value="reasoning">PGK Kategori - Benar/Salah</option>
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
        <TableBuilder
          tableRows={tableRows}
          onChange={setTableRows}
        />
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

      <AnswerSelector
        questionType={form.question_type}
        options={form.options}
        correctAnswerIndex={form.correct_answer_index}
        correctAnswers={form.correct_answers}
        reasoningAnswers={form.reasoning_answers}
        onCorrectAnswerChange={(index) => setForm({ ...form, correct_answer_index: index })}
        onCorrectAnswersChange={(answers) => setForm({ ...form, correct_answers: answers })}
        onReasoningAnswersChange={(answers) => setForm({ ...form, reasoning_answers: answers })}
      />

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Pembahasan</label>
        <textarea
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={
            loading || 
            !form.tryout_id || 
            (form.question_type === 'multiple' && form.correct_answers.length === 0) ||
            (form.question_type === 'reasoning' && Object.keys(form.reasoning_answers).length < form.options.filter(o => o).length)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : editingQuestion ? 'Update Soal' : 'Tambah Soal'}
        </button>
        
        {editingQuestion && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}