// components/admin/editor/editorConfig.ts
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Mathematics from '@tiptap/extension-mathematics';

export const getEditorExtensions = () => [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
  BulletList.configure({
    HTMLAttributes: {
      class: 'list-disc ml-6 my-2',
    },
  }),
  OrderedList.configure({
    HTMLAttributes: {
      class: 'list-decimal ml-6 my-2',
    },
  }),
  ListItem.configure({
    HTMLAttributes: {
      class: 'my-1',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
    defaultAlignment: 'left',
  }),
  Superscript,
  Subscript,
  // Mathematics will be configured with click handlers from RichTextEditor
  Mathematics.configure({
    katexOptions: {
      throwOnError: false,
      displayMode: false,
    },
  }),
];

export const getEditorProps = (minHeight: string = '150px') => ({
  attributes: {
    class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[${minHeight}] p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white`,
  },
});