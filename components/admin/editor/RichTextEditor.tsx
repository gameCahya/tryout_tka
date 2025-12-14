// components/admin/editor/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState, useCallback } from 'react';
import EditorToolbar from './EditorToolbar';
import { getEditorExtensions, getEditorProps } from './editorConfig';

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  showAdvancedFormatting?: boolean;
  helperText?: string;
};

export default function RichTextEditor({
  content,
  onChange,
  label,
  placeholder,
  minHeight = '150px',
  showAdvancedFormatting = true,
  helperText,
}: RichTextEditorProps) {
  const [showMathEditModal, setShowMathEditModal] = useState(false);
  const [editingMath, setEditingMath] = useState<{
    latex: string;
    pos: number;
    type: 'inline' | 'block';
  } | null>(null);

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: content,
    editorProps: getEditorProps(minHeight),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor HTML output:', html); // Debug
      onChange(html);
    },
  });

  // Handle double-click on math nodes
  useEffect(() => {
    if (!editor) return;

    const handleDoubleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const mathNode = target.closest('.tiptap-mathematics-render');
      
      if (mathNode) {
        event.preventDefault();
        event.stopPropagation();

        // Get the position in the editor
        const pos = editor.view.posAtDOM(mathNode, 0);
        const node = editor.state.doc.nodeAt(pos);

        if (node) {
          const latex = node.attrs.latex || '';
          const type = mathNode.getAttribute('data-type') === 'block-math' ? 'block' : 'inline';
          
          setEditingMath({ latex, pos, type });
          setShowMathEditModal(true);
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('dblclick', handleDoubleClick);

    return () => {
      editorElement.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [editor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleUpdateMath = useCallback(() => {
    if (!editor || !editingMath) return;

    const { latex, pos, type } = editingMath;

    if (!latex.trim()) {
      // Delete if empty
      editor.chain().setNodeSelection(pos).deleteSelection().run();
    } else {
      // Update the math node
      if (type === 'inline') {
        editor.chain().setNodeSelection(pos).updateInlineMath({ latex }).focus().run();
      } else {
        editor.chain().setNodeSelection(pos).updateBlockMath({ latex }).focus().run();
      }
    }

    setShowMathEditModal(false);
    setEditingMath(null);
  }, [editor, editingMath]);

  const handleDeleteMath = useCallback(() => {
    if (!editor || !editingMath) return;

    editor.chain().setNodeSelection(editingMath.pos).deleteSelection().focus().run();
    
    setShowMathEditModal(false);
    setEditingMath(null);
  }, [editor, editingMath]);

  if (!editor) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-32 bg-gray-100 dark:bg-gray-800"></div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <EditorToolbar editor={editor} showAdvancedFormatting={showAdvancedFormatting} />
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helperText}
        </p>
      )}

      {/* Math Edit Modal */}
      {showMathEditModal && editingMath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Math Formula
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type: <span className="font-bold">{editingMath.type === 'inline' ? 'Inline' : 'Block'}</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LaTeX Formula
              </label>
              <textarea
                value={editingMath.latex}
                onChange={(e) => setEditingMath({ ...editingMath, latex: e.target.value })}
                placeholder="e.g., \frac{a}{b}, x^2 + y^2 = z^2"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={3}
                autoFocus
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
                onClick={handleUpdateMath}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
              <button
                onClick={handleDeleteMath}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                title="Delete formula"
              >
                🗑️
              </button>
              <button
                onClick={() => {
                  setShowMathEditModal(false);
                  setEditingMath(null);
                }}
                className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}