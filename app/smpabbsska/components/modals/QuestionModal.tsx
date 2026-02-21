import React from 'react';
import { QuestionForm } from '../../types';
import ImageUploader from '../ui/ImageUploader';
import OptionEditor from '../ui/OptionEditor';

interface QuestionModalProps {
  isEditing: boolean;
  form: QuestionForm;
  saving: boolean;
  uploadingImage: boolean;
  imagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFormChange: (form: QuestionForm) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onClose: () => void;
}

const QUESTION_TYPES = [
  { key: 'single', label: 'Pilihan Ganda', desc: 'Satu jawaban benar', icon: '◉' },
  { key: 'multiple', label: 'Multi Jawaban', desc: 'Beberapa jawaban benar', icon: '☑' },
  { key: 'essay', label: 'Esai', desc: 'Jawaban uraian bebas', icon: '✍️' },
] as const;

const POINT_PRESETS = [1, 2, 3, 5];

export default function QuestionModal({
  isEditing,
  form,
  saving,
  uploadingImage,
  imagePreview,
  fileInputRef,
  onFormChange,
  onImageChange,
  onRemoveImage,
  onSave,
  onClose,
}: QuestionModalProps) {
  const updateOption = (i: number, value: string) => {
    const opts = [...form.options];
    opts[i] = value;
    onFormChange({ ...form, options: opts });
  };

  const addOption = () => {
    if (form.options.length < 6)
      onFormChange({ ...form, options: [...form.options, ''] });
  };

  const removeOption = (i: number) => {
    if (form.options.length <= 2) return;
    const opts = form.options.filter((_, idx) => idx !== i);
    onFormChange({
      ...form,
      options: opts,
      correct_answer_index: Math.min(form.correct_answer_index, opts.length - 1),
      correct_answers: form.correct_answers.filter(idx => idx < opts.length),
    });
  };

  const toggleMultiCorrect = (i: number) => {
    onFormChange({
      ...form,
      correct_answers: form.correct_answers.includes(i)
        ? form.correct_answers.filter(x => x !== i)
        : [...form.correct_answers, i],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-2xl">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            {isEditing ? '✏️ Edit Soal' : '➕ Tambah Soal Baru'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Tipe Soal
            </label>
            <div className="grid grid-cols-3 gap-3">
              {QUESTION_TYPES.map(type => (
                <button
                  key={type.key}
                  onClick={() => onFormChange({
                    ...form,
                    question_type: type.key,
                    correct_answers: [],
                    correct_answer_index: 0,
                    essay_answer: '',
                    options: form.options.length > 0 ? form.options : ['', '', '', ''],
                  })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.question_type === type.key
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
              value={form.question_text}
              onChange={e => onFormChange({ ...form, question_text: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Tuliskan pertanyaan di sini..."
              autoFocus={!isEditing}
            />
          </div>

          {/* Image Uploader */}
          <ImageUploader
            imagePreview={imagePreview}
            uploadingImage={uploadingImage}
            fileInputRef={fileInputRef}
            onFileChange={onImageChange}
            onRemove={onRemoveImage}
          />

          {/* Essay Answer / Option Editor — conditional by type */}
          {form.question_type === 'essay' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Kunci Jawaban / Rubrik Penilaian <span className="text-red-500">*</span>
              </label>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  💡 Isi dengan jawaban ideal atau rubrik penilaian. Ini hanya terlihat oleh admin, tidak ditampilkan ke siswa saat mengerjakan.
                </p>
              </div>
              <textarea
                value={form.essay_answer}
                onChange={e => onFormChange({ ...form, essay_answer: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                placeholder="Contoh: Jawaban ideal adalah... / Rubrik: (1) menyebutkan... (2) menjelaskan..."
              />
            </div>
          ) : (
            <OptionEditor
              options={form.options}
              questionType={form.question_type}
              correctAnswerIndex={form.correct_answer_index}
              correctAnswers={form.correct_answers}
              onOptionChange={updateOption}
              onCorrectSingleChange={i => onFormChange({ ...form, correct_answer_index: i })}
              onCorrectMultiToggle={toggleMultiCorrect}
              onAddOption={addOption}
              onRemoveOption={removeOption}
            />
          )}

          {/* Points */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Poin per Soal
            </label>
            <div className="flex items-center gap-2">
              {POINT_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => onFormChange({ ...form, question_points: p })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.question_points === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={100}
                value={form.question_points}
                onChange={e => onFormChange({ ...form, question_points: parseInt(e.target.value) || 1 })}
                className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving || uploadingImage}
            className="flex-1 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Menyimpan...' : uploadingImage ? 'Upload gambar...' : isEditing ? 'Simpan Perubahan' : 'Tambah Soal'}
          </button>
        </div>
      </div>
    </div>
  );
}