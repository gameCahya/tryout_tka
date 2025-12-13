'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AnswerSelector from './AnswerSelector';
import TableBuilder from './TableBuilder';
import RichTextEditor from './editor/RichTextEditor';
import OptionsManager from './form/OptionsManager';

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
  const [form, setForm] = useState<FormData>({
    tryout_id: '',
    question_text: '',
    options: ['', ''],
    correct_answer_index: 0,
    correct_answers: [],
    explanation: '',
    has_table: false,
    question_type: 'single',
    reasoning_answers: {},
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['No Soal', 'Kompetensi', 'Sub Kompetensi', 'Bentuk Soal', 'Kunci'],
    ['', '', '', '', '']
  ]);

  useEffect(() => {
    if (editingQuestion) {
      setForm({
        tryout_id: editingQuestion.tryout_id,
        question_text: editingQuestion.question_text,
        options: editingQuestion.options,
        correct_answer_index: editingQuestion.correct_answer_index,
        correct_answers: editingQuestion.correct_answers || [],
        explanation: editingQuestion.explanation,
        has_table: false,
        question_type: editingQuestion.question_type,
        reasoning_answers: editingQuestion.reasoning_answers || {},
      });
    } else {
      resetForm();
    }
  }, [editingQuestion]);

  const resetForm = () => {
    setForm({
      tryout_id: '',
      question_text: '',
      options: ['', ''],
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
  };

  const handleOptionsChange = (newOptions: string[]) => {
    // Adjust correct answers when options change
    let newCorrectIndex = form.correct_answer_index;
    if (newCorrectIndex >= newOptions.length) {
      newCorrectIndex = Math.max(0, newOptions.length - 1);
    }

    const newCorrectAnswers = form.correct_answers.filter(ans => ans < newOptions.length);
    
    const newReasoningAnswers: { [key: number]: 'benar' | 'salah' } = {};
    Object.keys(form.reasoning_answers).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < newOptions.length) {
        newReasoningAnswers[keyNum] = form.reasoning_answers[keyNum];
      }
    });

    setForm({
      ...form,
      options: newOptions,
      correct_answer_index: newCorrectIndex,
      correct_answers: newCorrectAnswers,
      reasoning_answers: newReasoningAnswers,
    });
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

      const dataToSave: any = {
        tryout_id: form.tryout_id,
        question_text: questionText,
        options: form.options.filter(opt => opt.trim() !== ''),
        correct_answer_index: form.question_type === 'single' ? form.correct_answer_index : -1,
        correct_answers: form.question_type === 'multiple' ? form.correct_answers : null,
        question_type: form.question_type,
        reasoning_answers: form.question_type === 'reasoning' ? form.reasoning_answers : null,
        explanation: form.explanation,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(dataToSave)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        alert('Soal berhasil diupdate!');
      } else {
        const { error } = await supabase.from('questions').insert(dataToSave);
        if (error) throw error;
        alert('Soal berhasil ditambahkan!');
      }

      resetForm();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan soal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!form.tryout_id) return false;
    
    const filledOptions = form.options.filter(o => o.trim() !== '');
    if (filledOptions.length === 0) return false;
    
    if (form.question_type === 'multiple' && form.correct_answers.length === 0) return false;
    if (form.question_type === 'reasoning') {
      const answeredReasonings = Object.keys(form.reasoning_answers || {}).length;
      if (answeredReasonings < filledOptions.length) return false;
    }
    return true;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
      {/* Edit Mode Banner */}
      {editingQuestion && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded flex items-center justify-between">
          <span className="text-yellow-800 dark:text-yellow-300 font-medium">✏️ Mode Edit Soal</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Batal Edit
          </button>
        </div>
      )}

      {/* Tryout Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tryout</label>
        <select
          value={form.tryout_id}
          onChange={(e) => setForm({ ...form, tryout_id: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
          disabled={!!editingQuestion}
        >
          <option value="">Pilih tryout</option>
          {tryouts.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      {/* Question Text Editor */}
      <div className="mb-4">
        <RichTextEditor
          content={form.question_text}
          onChange={(content) => setForm({ ...form, question_text: content })}
          label="Teks Soal"
          minHeight="150px"
          showAdvancedFormatting={true}
          helperText="💡 Fitur: bold, italic, x² (pangkat), x₂ (subscript), alignment, lists"
        />
      </div>

      {/* Question Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipe Soal</label>
        <select
          value={form.question_type}
          onChange={(e) => setForm({ ...form, question_type: e.target.value as any })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="single">Single Answer (Radio)</option>
          <option value="multiple">Multiple Answer - PGK MCMA (Checkbox)</option>
          <option value="reasoning">PGK Kategori - Benar/Salah</option>
        </select>
      </div>

      {/* Table Option */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.has_table}
            onChange={(e) => setForm({ ...form, has_table: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tambahkan Tabel</span>
        </label>
      </div>

      {form.has_table && (
        <TableBuilder
          tableRows={tableRows}
          onChange={setTableRows}
        />
      )}

      {/* Image Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gambar Soal (Opsional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Options Manager */}
      <OptionsManager
        options={form.options}
        onChange={handleOptionsChange}
      />

      {/* Answer Selector */}
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

      {/* Explanation Editor */}
      <div className="mb-6">
        <RichTextEditor
          content={form.explanation}
          onChange={(content) => setForm({ ...form, explanation: content })}
          label="Pembahasan"
          minHeight="100px"
          showAdvancedFormatting={false}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Menyimpan...' : editingQuestion ? 'Update Soal' : 'Tambah Soal'}
        </button>
        
        {editingQuestion && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}