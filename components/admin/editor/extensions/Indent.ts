// components/admin/editor/extensions/Indent.ts
import { Extension } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      setFirstLineIndent: () => ReturnType;
      removeFirstLineIndent: () => ReturnType;
      toggleFirstLineIndent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph'],
      indentSize: '2em', // Ukuran indent untuk first-line
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          firstLineIndent: {
            default: false,
            parseHTML: (element: HTMLElement) => {
              return element.getAttribute('data-first-line-indent') === 'true';
            },
            renderHTML: (attributes: { firstLineIndent?: boolean }) => {
              if (!attributes.firstLineIndent) {
                return {};
              }
              return {
                'data-first-line-indent': 'true',
                style: `text-indent: ${this.options.indentSize};`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFirstLineIndent:
        () =>
        ({ tr, state, dispatch }: { tr: Transaction; state: any; dispatch: any }) => {
          const { selection } = state;
          const { $from, $to } = selection;

          state.doc.nodesBetween($from.pos, $to.pos, (node: ProseMirrorNode, pos: number) => {
            if (this.options.types.includes(node.type.name)) {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  firstLineIndent: true,
                });
              }
            }
          });

          return true;
        },

      removeFirstLineIndent:
        () =>
        ({ tr, state, dispatch }: { tr: Transaction; state: any; dispatch: any }) => {
          const { selection } = state;
          const { $from, $to } = selection;

          state.doc.nodesBetween($from.pos, $to.pos, (node: ProseMirrorNode, pos: number) => {
            if (this.options.types.includes(node.type.name)) {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  firstLineIndent: false,
                });
              }
            }
          });

          return true;
        },

      toggleFirstLineIndent:
        () =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state;
          const { $from } = selection;
          
          // Find the parent paragraph node
          let depth = $from.depth;
          let node = null;
          
          while (depth >= 0) {
            node = $from.node(depth);
            if (this.options.types.includes(node.type.name)) {
              break;
            }
            depth--;
          }

          if (!node) {
            return false;
          }

          const currentIndent = node.attrs.firstLineIndent || false;

          // Use commands instead of direct transaction manipulation
          if (currentIndent) {
            return commands.removeFirstLineIndent();
          } else {
            return commands.setFirstLineIndent();
          }
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.toggleFirstLineIndent(),
    };
  },
});