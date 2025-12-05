'use client';

import { useState, useEffect } from 'react';

type Question = {
  id?: string;
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

type SimpleQuestionFormProps = {
  question?: Question;
  onSave: (questionData: Omit<Question, 'id'> | Partial<Question>) => void;
  onCancel: () => void;
};

export default function SimpleQuestionForm({ question, onSave, onCancel }: SimpleQuestionFormProps) {
  const [form, setForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answer: 'A',
    explanation: '',
  });

  useEffect(() => {
    if (question) {
      setForm({
        question_text: question.question_text || '',
        option_a: question.option_a || '',
        option_b: question.option_b || '',
        option_c: question.option_c || '',
        option_d: question.option_d || '',
        option_e: question.option_e || '',
        correct_answer: question.correct_answer || 'A',
        explanation: question.explanation || '',
      });
    } else {
      setForm({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        option_e: '',
        correct_answer: 'A',
        explanation: '',
      });
    }
  }, [question]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      question_text: form.question_text,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      option_d: form.option_d,
      option_e: form.option_e,
      correct_answer: form.correct_answer,
      explanation: form.explanation,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {question ? 'Edit Soal' : 'Tambah Soal Baru'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teks Soal
          </label>
          <textarea
            name="question_text"
            value={form.question_text}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={4}
            placeholder="Masukkan teks soal di sini..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opsi A
            </label>
            <input
              type="text"
              name="option_a"
              value={form.option_a}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Opsi A"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opsi B
            </label>
            <input
              type="text"
              name="option_b"
              value={form.option_b}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Opsi B"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opsi C
            </label>
            <input
              type="text"
              name="option_c"
              value={form.option_c}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Opsi C"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opsi D
            </label>
            <input
              type="text"
              name="option_d"
              value={form.option_d}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Opsi D"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opsi E
            </label>
            <input
              type="text"
              name="option_e"
              value={form.option_e}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Opsi E"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jawaban Benar
            </label>
            <select
              name="correct_answer"
              value={form.correct_answer}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Penjelasan (Opsional)
            </label>
            <input
              type="text"
              name="explanation"
              value={form.explanation || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Penjelasan jawaban"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Simpan Soal
          </button>
        </div>
      </form>
    </div>
  );
}