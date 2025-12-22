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
  allowImageUpload?: boolean;
  helperText?: string;
};

export default function RichTextEditor({
  content,
  onChange,
  label,
  placeholder,
  minHeight = '150px',
  showAdvancedFormatting = true,
  allowImageUpload = true,
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
    immediatelyRender: false, // PENTING: Required untuk Next.js SSR
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
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

  // Update content saat prop berubah (untuk edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Gunakan queueMicrotask untuk menghindari race condition
      queueMicrotask(() => {
        editor.commands.setContent(content, { emitUpdate: false });
      });
    }
  }, [content, editor]);

  const handleUpdateMath = useCallback(() => {
    if (!editor || !editingMath) return;

    const { latex, pos, type } = editingMath;

    if (!latex.trim()) {
      editor.chain().setNodeSelection(pos).deleteSelection().run();
    } else {
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
      
      <div className="tiptap-wrapper border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <EditorToolbar 
          editor={editor} 
          showAdvancedFormatting={showAdvancedFormatting}
          allowImageUpload={allowImageUpload}
        />
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helperText}
        </p>
      )}

      {/* Global CSS untuk preserve empty paragraphs dan proper heading styling */}
      <style jsx global>{`
        /* Preserve empty paragraphs */
        .tiptap-wrapper .ProseMirror p.tiptap-paragraph {
          min-height: 1.5em;
          margin: 0.5em 0;
        }

        /* Preserve hard breaks */
        .tiptap-wrapper .ProseMirror br.tiptap-hardbreak {
          display: block;
          content: "";
          margin: 0.25em 0;
        }

        /* Heading styles - PENTING untuk H2 dan H3 */
        .tiptap-wrapper .ProseMirror h1.tiptap-heading {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          line-height: 1.2;
        }

        .tiptap-wrapper .ProseMirror h2.tiptap-heading {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          line-height: 1.3;
        }

        .tiptap-wrapper .ProseMirror h3.tiptap-heading {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          line-height: 1.4;
        }

        .tiptap-wrapper .ProseMirror h4.tiptap-heading {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0;
        }

        .tiptap-wrapper .ProseMirror h5.tiptap-heading {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
        }

        .tiptap-wrapper .ProseMirror h6.tiptap-heading {
          font-size: 0.67em;
          font-weight: bold;
          margin: 2em 0;
        }

        /* Empty editor placeholder */
        .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* Focus outline */
        .tiptap-wrapper .ProseMirror:focus {
          outline: none;
        }

        /* Dark mode text color */
        .dark .tiptap-wrapper .ProseMirror {
          color: #e5e7eb;
        }

        .dark .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
        }
      `}</style>

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
                💡 Double-click math formula untuk edit
              </p>
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