// editor de rich text wrapper do tiptap
// suporta bold, italic, headings, listas — design escuro consistente com o sistema
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarBtnProps
{
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}

const ToolbarBtn = ({ active, onClick, children, title }: ToolbarBtnProps) =>
{
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-violet-500/20 text-violet-300'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50',
      ].join(' ')}
    >
      {children}
    </button>
  );
};

export function RichTextEditor ({ content, onChange, placeholder = 'Comece a escrever...' }: RichTextEditorProps)
{
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) =>
    {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3',
      },
    },
  });

  if ( !editor ) return null;

  return (
    <div className="border border-white/10 rounded-xl bg-zinc-900/60 overflow-hidden">
      {/* toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/8 bg-zinc-900/80">
        <ToolbarBtn
          title="Negrito (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          title="Itálico (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-700/50 mx-1" />

        <ToolbarBtn
          title="Título 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          title="Título 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-700/50 mx-1" />

        <ToolbarBtn
          title="Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          title="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-700/50 mx-1" />

        <ToolbarBtn
          title="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          title="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* area de edição */}
      <EditorContent editor={editor} />
    </div>
  );
}
