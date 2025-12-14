// components/admin/editor/EditorToolbar.tsx
'use client';

import { Editor } from '@tiptap/react';
import { useState } from 'react';

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
};

const ToolbarButton = ({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-3 py-1.5 rounded text-sm transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px bg-gray-300 dark:bg-gray-600"></div>;

type EditorToolbarProps = {
  editor: Editor;
  showAdvancedFormatting?: boolean;
};

export default function EditorToolbar({ editor, showAdvancedFormatting = true }: EditorToolbarProps) {
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathLatex, setMathLatex] = useState('');
  const [mathType, setMathType] = useState<'inline' | 'block'>('inline');

  const insertMath = () => {
    if (!mathLatex.trim()) return;

    if (mathType === 'inline') {
      editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
    } else {
      editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
    }

    setMathLatex('');
    setShowMathModal(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>

        {showAdvancedFormatting && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>
        )}

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive('superscript')}
          title="Superscript (Pangkat) - x²"
        >
          x<sup>2</sup>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive('subscript')}
          title="Subscript - H₂O"
        >
          x<sub>2</sub>
        </ToolbarButton>

        <Divider />

        {/* Math Button */}
        <ToolbarButton
          onClick={() => setShowMathModal(true)}
          title="Insert Math Formula (LaTeX)"
        >
          ∑ Math
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        {showAdvancedFormatting && (
          <>
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

            <Divider />
          </>
        )}

        {/* Text Alignment */}
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

        <Divider />

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

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </ToolbarButton>
      </div>

      {/* Math Modal */}
      {showMathModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Insert Math Formula
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="inline"
                    checked={mathType === 'inline'}
                    onChange={(e) => setMathType(e.target.value as 'inline')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Inline (dalam teks)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="block"
                    checked={mathType === 'block'}
                    onChange={(e) => setMathType(e.target.value as 'block')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Block (terpisah)</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LaTeX Formula
              </label>
              <textarea
                value={mathLatex}
                onChange={(e) => setMathLatex(e.target.value)}
                placeholder="e.g., \frac{a}{b}, x^2 + y^2 = z^2"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                💡 Contoh LaTeX:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li><code>\frac{'{a}'}{'{b}'}</code> → Pecahan a/b</li>
                <li><code>x^2</code> → x pangkat 2</li>
                <li><code>\sqrt{'{x}'}</code> → Akar kuadrat x</li>
                <li><code>\sum_{'{i=1}'}^{'{n}'}</code> → Sigma</li>
                <li><code>\int_{'{a}'}^{'{b}'}</code> → Integral</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={insertMath}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Insert
              </button>
              <button
                onClick={() => {
                  setShowMathModal(false);
                  setMathLatex('');
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}