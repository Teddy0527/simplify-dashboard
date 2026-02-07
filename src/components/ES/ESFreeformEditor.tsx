import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useCallback } from 'react';

interface ESFreeformEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function ESFreeformEditor({ content, onChange }: ESFreeformEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleUpdate = useCallback(({ editor }: { editor: ReturnType<typeof useEditor> extends infer E ? NonNullable<E> : never }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(editor.getHTML());
    }, 500);
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: '自由に記述してください...',
      }),
    ],
    content,
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!editor) return null;

  const charCount = editor.getText().length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('bold')
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="太字"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="見出し1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="見出し2"
        >
          H2
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-sm transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="箇条書き"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-sm transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="番号付きリスト"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h8" />
          </svg>
        </button>

        <span className="ml-auto text-xs text-gray-400">{charCount}字</span>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus-within:ring-0 [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
