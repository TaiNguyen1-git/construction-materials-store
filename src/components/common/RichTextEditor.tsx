'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { 
    Bold, Italic, List, ListOrdered, Quote, 
    Heading1, Heading2, Link as LinkIcon, Image as ImageIcon,
    Undo, Redo, Hash, Code
} from 'lucide-react'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null

    const addImage = () => {
        const url = window.prompt('Nhập URL hình ảnh:')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('Nhập URL liên kết:', previousUrl)
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const Button = ({ onClick, isActive, children, title }: any) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-lg transition-all ${
                isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
            title={title}
        >
            {children}
        </button>
    )

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-white border-b border-neutral-100">
            <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bôi đậm">
                <Bold className="w-4 h-4" />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="In nghiêng">
                <Italic className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-neutral-100 mx-1" />
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Tiêu đề 1">
                <Heading1 className="w-4 h-4" />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Tiêu đề 2">
                <Heading2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-neutral-100 mx-1" />
            <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Danh sách">
                <List className="w-4 h-4" />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Danh sách số">
                <ListOrdered className="w-4 h-4" />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Trích dẫn">
                <Quote className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-neutral-100 mx-1" />
            <Button onClick={setLink} isActive={editor.isActive('link')} title="Chèn liên kết">
                <LinkIcon className="w-4 h-4" />
            </Button>
            <Button onClick={addImage} title="Chèn ảnh">
                <ImageIcon className="w-4 h-4" />
            </Button>
            <div className="ml-auto flex gap-1">
                <Button onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác">
                    <Undo className="w-4 h-4" />
                </Button>
                <Button onClick={() => editor.chain().focus().redo().run()} title="Làm lại">
                    <Redo className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary-600 underline'
                }
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-2xl shadow-lg max-w-full my-8'
                }
            }),
            Placeholder.configure({
                placeholder: 'Bắt đầu viết những điều tuyệt vời chuẩn SEO của bạn ở đây...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-neutral prose-lg max-w-none focus:outline-none min-h-[500px] p-12 text-neutral-700 leading-relaxed'
            }
        }
    })

    return (
        <div className="flex flex-col w-full h-full bg-white rounded-[40px] shadow-sm border border-neutral-100 overflow-hidden focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-300 transition-all">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <EditorContent editor={editor} />
            </div>
            <style jsx global>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
            `}</style>
        </div>
    )
}
