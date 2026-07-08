import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Undo2, Redo2,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: React.ElementType;
  label: string;
}

function ToolbarButton({ onClick, active, icon: Icon, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-brand-primary/15 text-brand-primary'
          : 'text-text-secondary hover:bg-bg-section hover:text-text-primary'
      )}
    >
      <Icon size={16} />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border-default mx-0.5" />;
}

export function RichTextEditor({ content, onChange, minHeight = 300 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[200px]',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-border-default rounded-xl overflow-hidden bg-bg-input">
      <div className="flex items-center gap-0.5 p-1.5 border-b border-border-default bg-bg-section/50 flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} label="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} label="Italic" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={Underline} label="Underline" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={Strikethrough} label="Strikethrough" />

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} label="Heading 1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading2} label="Heading 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} icon={Heading3} label="Heading 3" />

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} label="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} label="Ordered List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={Quote} label="Blockquote" />

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} label="Align Left" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} label="Center" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} label="Align Right" />

        <ToolbarDivider />

        <ToolbarButton onClick={addLink} active={editor.isActive('link')} icon={LinkIcon} label="Add Link" />

        <div className="ml-auto" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo2} label="Undo" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo2} label="Redo" />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
