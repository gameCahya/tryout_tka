'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from '@tiptap/extension-mathematics';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import {TextStyle} from '@tiptap/extension-text-style';
import Heading from '@tiptap/extension-heading';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import 'katex/dist/katex.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
}

// ===== TOOLBAR BUTTON =====
function Btn({
  onClick,
  active,
  title,
  children,
  className = '',
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors select-none ${
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5 shrink-0" />;
}

// ===== MATH SHORTCUTS =====
const MATH_SHORTCUTS = [
  { label: 'a/b',  latex: '\\frac{a}{b}',               title: 'Pecahan' },
  { label: '√x',   latex: '\\sqrt{x}',                   title: 'Akar kuadrat' },
  { label: 'ⁿ√x',  latex: '\\sqrt[n]{x}',                title: 'Akar ke-n' },
  { label: 'x²',   latex: 'x^{2}',                       title: 'Pangkat 2' },
  { label: 'xⁿ',   latex: 'x^{n}',                       title: 'Pangkat n' },
  { label: 'xₙ',   latex: 'x_{n}',                       title: 'Subscript' },
  { label: '∑',    latex: '\\sum_{i=1}^{n} x_i',         title: 'Sigma' },
  { label: '∫',    latex: '\\int_{a}^{b} f(x)\\,dx',     title: 'Integral' },
  { label: 'lim',  latex: '\\lim_{x \\to \\infty} f(x)', title: 'Limit' },
  { label: 'log',  latex: '\\log_{b}(x)',                 title: 'Logaritma' },
  { label: 'sin',  latex: '\\sin(x)',                     title: 'Sinus' },
  { label: 'cos',  latex: '\\cos(x)',                     title: 'Cosinus' },
  { label: 'tan',  latex: '\\tan(x)',                     title: 'Tangen' },
  { label: 'π',    latex: '\\pi',                         title: 'Pi' },
  { label: '±',    latex: '\\pm',                         title: 'Plus minus' },
  { label: '×',    latex: '\\times',                      title: 'Kali' },
  { label: '÷',    latex: '\\div',                        title: 'Bagi' },
  { label: '≤',    latex: '\\leq',                        title: 'Kurang dari sama dengan' },
  { label: '≥',    latex: '\\geq',                        title: 'Lebih dari sama dengan' },
  { label: '≠',    latex: '\\neq',                        title: 'Tidak sama dengan' },
  { label: '∞',    latex: '\\infty',                      title: 'Tak hingga' },
  { label: 'α',    latex: '\\alpha',                      title: 'Alpha' },
  { label: 'β',    latex: '\\beta',                       title: 'Beta' },
  { label: 'θ',    latex: '\\theta',                      title: 'Theta' },
  { label: 'λ',    latex: '\\lambda',                     title: 'Lambda' },
  { label: '⃗v',   latex: '\\vec{v}',                     title: 'Vektor' },
  { label: '|x|',  latex: '|x|',                          title: 'Nilai mutlak' },
];

// ===== MAIN COMPONENT =====
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tuliskan teks di sini...',
  minHeight = 120,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // pakai Heading extension terpisah
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Mathematics,
      Subscript,
      Superscript,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3',
        style: `min-height: ${minHeight}px`,
        'data-placeholder': placeholder,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const insertMath = (block = false) => {
    const example = block ? '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' : 'x^2 + y^2 = z^2';
    const formula = window.prompt(
      `Masukkan rumus LaTeX (${block ? 'block' : 'inline'}):`,
      example
    );
    if (!formula) return;
    editor.chain().focus().insertContent(block ? `$$${formula}$$` : `$${formula}$`).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">

      {/* ===== TOOLBAR ===== */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 px-2 py-1.5 space-y-1">

        {/* Row 1: Text formatting */}
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Heading */}
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</Btn>

          <Divider />

          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><strong>B</strong></Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><em>I</em></Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">{'<>'}</Btn>
          <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript (X₂)">X₂</Btn>
          <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript (X²)">X²</Btn>

          <Divider />

          {/* Align */}
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Rata Kiri">⬅</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Rata Tengah">↔</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rata Kanan">➡</Btn>

          <Divider />

          {/* Lists */}
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">• List</Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">1. List</Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">&quot; &quot;</Btn>

          <Divider />

          {/* Table */}
          <Btn onClick={insertTable} title="Insert Tabel">⊞ Tabel</Btn>
          {editor.isActive('table') && (
            <>
              <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="+Kolom">+K</Btn>
              <Btn onClick={() => editor.chain().focus().deleteColumn().run()} title="-Kolom" className="text-red-500">-K</Btn>
              <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="+Baris">+B</Btn>
              <Btn onClick={() => editor.chain().focus().deleteRow().run()} title="-Baris" className="text-red-500">-B</Btn>
              <Btn onClick={() => editor.chain().focus().deleteTable().run()} title="Hapus Tabel" className="text-red-500">✕Tbl</Btn>
            </>
          )}

          <Divider />

          {/* Math insert */}
          <Btn onClick={() => insertMath(false)} title="Sisipkan rumus inline $...$">
            <span className="font-mono">∑ inline</span>
          </Btn>
          <Btn onClick={() => insertMath(true)} title="Sisipkan rumus block $$...$$">
            <span className="font-mono">∑ block</span>
          </Btn>

          <Divider />

          {/* Undo/Redo */}
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">↩</Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">↪</Btn>
        </div>

        {/* Row 2: Math shortcuts */}
        <div className="flex flex-wrap items-center gap-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Rumus:</span>
          {MATH_SHORTCUTS.map(s => (
            <button
              key={s.label}
              type="button"
              title={`${s.title}: $${s.latex}$`}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().insertContent(`$${s.latex}$`).run();
              }}
              className="px-1.5 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-mono border border-indigo-100 dark:border-indigo-800"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== EDITOR AREA ===== */}
      <div className="bg-white dark:bg-gray-700">
        <EditorContent editor={editor} />
      </div>

      {/* ===== HINT ===== */}
      <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ketik <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">$rumus$</code> inline &nbsp;·&nbsp;
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">$$rumus$$</code> block &nbsp;·&nbsp;
          Klik shortcut untuk insert cepat
        </p>
      </div>
    </div>
  );
}