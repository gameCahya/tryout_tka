// components/admin/editor/editorConfig.ts
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Mathematics from '@tiptap/extension-mathematics';
import Image from '@tiptap/extension-image';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

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
  Mathematics.configure({
    katexOptions: {
      throwOnError: false,
      displayMode: false,
    },
  }),
  Image.configure({
    inline: true,
    allowBase64: false,
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg my-4',
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full my-4 border border-gray-300 dark:border-gray-600',
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 dark:border-gray-600',
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 font-semibold text-left',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 dark:border-gray-600 p-2',
    },
  }),
];

export const getEditorProps = (minHeight: string = '150px') => ({
  attributes: {
    class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[${minHeight}] p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white`,
  },
});