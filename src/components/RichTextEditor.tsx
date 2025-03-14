import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Paragraph from '@tiptap/extension-paragraph';
import { FloatingToolbar } from './FloatingToolbar';
import { AiTextActions } from './AiTextActions';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false, // Disable default paragraph to use our custom config
        heading: false, // Disable default heading to use our custom config
      }),
      Paragraph.configure({
        HTMLAttributes: {
          class: 'mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap'
        }
      }),
      Heading.configure({
        levels: [1, 2],
        HTMLAttributes: {
          class: 'font-bold mb-4',
        },
        level: {
          1: {
            HTMLAttributes: {
              class: 'text-3xl mt-8 mb-4'
            }
          },
          2: {
            HTMLAttributes: {
              class: 'text-2xl mt-6 mb-3'
            }
          }
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-purple hover:underline'
        }
      })
    ],
    content: content || '', // Ensure content is always a string
    onUpdate: ({ editor }) => {
      // Get the HTML content with preserved whitespace
      const htmlContent = editor.getHTML();
      
      // Ensure line breaks are properly preserved
      const preservedContent = htmlContent
        .replace(/<p><br><\/p>/g, '<p>&nbsp;</p>') // Preserve empty paragraphs
        .replace(/\n/g, '<br />'); // Convert newlines to <br> tags
      
      onChange(preservedContent);
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px] whitespace-pre-wrap'
      }
    }
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      const newContent = content || ''; // Ensure content is a string
      
      // Only update if content has actually changed
      if (currentContent !== newContent) {
        // Parse the content to handle preserved whitespace
        const parsedContent = String(newContent)
          .replace(/&nbsp;/g, ' ') // Convert &nbsp; back to spaces
          .replace(/<br\s*\/?>/g, '\n'); // Convert <br> tags back to newlines
        
        editor.commands.setContent(parsedContent, false);
      }
    }
  }, [content, editor]);

  return (
    <div className="prose max-w-none relative">
      <FloatingToolbar editor={editor} />
      <AiTextActions editor={editor} />
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] focus-within:outline-none whitespace-pre-wrap"
      />
    </div>
  );
}