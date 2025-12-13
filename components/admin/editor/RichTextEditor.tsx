// components/admin/editor/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
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
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: content,
    editorProps: getEditorProps(minHeight),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

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
    </div>
  );
}