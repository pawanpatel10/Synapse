import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export default function NoteEditor({
  value,
  onChange,
  noteId,
  userName = 'Guest'
}) {
  const [typingUser, setTypingUser] = useState('')
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)

      if (socketRef.current && noteId) {
        socketRef.current.emit('edit-note', { noteId, content: html })
        
        socketRef.current.emit('typing', { noteId, userName, isTyping: true })
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current.emit('typing', { noteId, userName, isTyping: false })
        }, 1500)
      }
    },
  })

  useEffect(() => {
    if (!noteId) return undefined

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socket = io(socketUrl)
    socketRef.current = socket

    socket.emit('join-note', { noteId, userName })

    socket.on('note-updated', ({ content }) => {
      if (editor && editor.getHTML() !== content) {
        editor.commands.setContent(content, false)
      }
    })

    socket.on('user-typing', ({ userName: typingName, isTyping }) => {
      setTypingUser(isTyping ? typingName : '')
    })

    return () => {
      socket.disconnect()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [noteId, editor, userName])

  useEffect(() => {
    if (!editor) return

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div className="editor-wrapper">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Ordered List"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Code Block"
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Blockquote"
        >
          ” Quote
        </button>
        <div className="toolbar-separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          ↷
        </button>
      </div>

      <EditorContent editor={editor} />

      <div className="editor-footer">
        {typingUser ? (
          <span className="typing-indicator">{typingUser} is typing...</span>
        ) : (
          <span className="typing-indicator-placeholder" />
        )}
      </div>
    </div>
  )
}