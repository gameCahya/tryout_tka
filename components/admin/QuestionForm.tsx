'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AnswerSelector from './AnswerSelector';
import TableBuilder from './TableBuilder';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';

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
  const [isMounted, setIsMounted] = useState(false);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['No Soal', 'Kompetensi', 'Sub Kompetensi', 'Bentuk Soal', 'Kunci'],
    ['', '', '', '', '']
  ]);

  // Tiptap Editor for Question Text with Text Align
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ],
    content: form.question_text,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setForm(prev => ({ ...prev, question_text: html }));
    },
  });

  // Tiptap Editor for Explanation with Text Align
  const explanationEditor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ],
    content: form.explanation,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setForm(prev => ({ ...prev, explanation: html }));
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      
      if (editor) editor.commands.setContent(editingQuestion.question_text);
      if (explanationEditor) explanationEditor.commands.setContent(editingQuestion.explanation);
    } else {
      setForm({
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
      
      if (editor) editor.commands.setContent('');
      if (explanationEditor) explanationEditor.commands.setContent('');
    }
  }, [editingQuestion, editor, explanationEditor]);

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

      let questionText = editor ? editor.getHTML() : form.question_text;
      
      if (form.has_table) {
        questionText += generateTableMarkdown();
      }

      if (imageUrl) {
        questionText += `\n\n![Soal](${imageUrl.trim()})`;
      }

      const dataToSave: any = {
        tryout_id: form.tryout_id,
        question_text: questionText,
        options: form.options,
        correct_answer_index: form.question_type === 'single' ? form.correct_answer_index : -1,
        correct_answers: form.question_type === 'multiple' ? form.correct_answers : null,
        question_type: form.question_type,
        reasoning_answers: form.question_type === 'reasoning' ? form.reasoning_answers : null,
        explanation: explanationEditor ? explanationEditor.getHTML() : form.explanation,
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

      setForm({
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
      
      if (editor) editor.commands.setContent('');
      if (explanationEditor) explanationEditor.commands.setContent('');
      
      setImageFile(null);
      setTableRows([
        ['No Soal', 'Kompetensi', 'Sub Kompetensi', 'Bentuk Soal', 'Kunci'],
        ['', '', '', '', '']
      ]);

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
    if (form.question_type === 'multiple' && form.correct_answers.length === 0) return false;
    if (form.question_type === 'reasoning') {
      const filledOptions = form.options.filter(o => o.trim() !== '').length;
      const answeredReasonings = Object.keys(form.reasoning_answers || {}).length;
      if (answeredReasonings < filledOptions) return false;
    }
    return true;
  };

  // Toolbar Button Component
  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    disabled, 
    children,
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1 rounded transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );

  if (!isMounted) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
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

      {/* Rich Text Editor for Question */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Teks Soal
        </label>
        
        {editor && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              {/* Format Text */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <strong>B</strong>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <em>I</em>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
              >
                <s>S</s>
              </ToolbarButton>

              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Headings */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
              >
                H2
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
              >
                H3
              </ToolbarButton>

              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Text Alignment - NEW! */}
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
              >
                ⬅️
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
              >
                ↔️
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
              >
                ➡️
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Justify"
              >
                ⬌
              </ToolbarButton>

              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Lists */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
              >
                • List
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
              >
                1. List
              </ToolbarButton>

              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Undo/Redo */}
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
              >
                ↶
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
              >
                ↷
              </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Gunakan toolbar untuk format text: <strong>bold</strong>, <em>italic</em>, heading, alignment, list, dll.
        </p>
      </div>

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

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gambar Soal (Opsional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pilihan Jawaban</label>
        {form.options.map((option, idx) => (
          <div key={idx} className="flex items-center mb-2">
            <span className="w-6 mr-2 text-gray-700 dark:text-gray-300">{String.fromCharCode(65 + idx)}.</span>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

      {/* Rich Text Editor for Explanation */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Pembahasan
        </label>
        
        {explanationEditor && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().toggleBold().run()}
                isActive={explanationEditor.isActive('bold')}
                title="Bold"
              >
                <strong>B</strong>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().toggleItalic().run()}
                isActive={explanationEditor.isActive('italic')}
                title="Italic"
              >
                <em>I</em>
              </ToolbarButton>

              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Text Alignment - NEW! */}
              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().setTextAlign('left').run()}
                isActive={explanationEditor.isActive({ textAlign: 'left' })}
                title="Align Left"
              >
                ⬅️
              </ToolbarButton>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().setTextAlign('center').run()}
                isActive={explanationEditor.isActive({ textAlign: 'center' })}
                title="Align Center"
              >
                ↔️
              </ToolbarButton>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().setTextAlign('right').run()}
                isActive={explanationEditor.isActive({ textAlign: 'right' })}
                title="Align Right"
              >
                ➡️
              </ToolbarButton>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().setTextAlign('justify').run()}
                isActive={explanationEditor.isActive({ textAlign: 'justify' })}
                title="Justify"
              >
                ⬌
              </ToolbarButton>

              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().toggleBulletList().run()}
                isActive={explanationEditor.isActive('bulletList')}
                title="Bullet List"
              >
                • List
              </ToolbarButton>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().undo().run()}
                disabled={!explanationEditor.can().undo()}
                title="Undo"
              >
                ↶
              </ToolbarButton>

              <ToolbarButton
                onClick={() => explanationEditor.chain().focus().redo().run()}
                disabled={!explanationEditor.can().redo()}
                title="Redo"
              >
                ↷
              </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={explanationEditor} />
          </div>
        )}
      </div>

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