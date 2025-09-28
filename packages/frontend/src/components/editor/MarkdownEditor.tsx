import { Editor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import * as styles from './styles.css';

interface MarkdownEditorProps {
  content: string;
  previewMode: boolean;
  onContentChange: (content: string) => void;
  onPreviewModeChange: (preview: boolean) => void;
}

const markdownStyles = {
  h1: { color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' },
  h2: { color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' },
  h3: { color: '#4b5563' },
  codeInline: {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    padding: '0.125rem 0.25rem',
    borderRadius: '0.375rem',
    fontSize: '0.875em',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace'
  },
  codeBlock: {
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    padding: '1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875em',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    display: 'block',
    whiteSpace: 'pre' as const,
    overflow: 'auto'
  },
  blockquote: {
    borderLeft: '4px solid #e5e7eb',
    paddingLeft: '1rem',
    marginLeft: 0,
    fontStyle: 'italic',
    color: '#6b7280'
  },
  table: {
    borderCollapse: 'collapse' as const,
    width: '100%',
    marginTop: '1rem',
    marginBottom: '1rem'
  },
  th: {
    border: '1px solid #d1d5db',
    padding: '0.5rem',
    backgroundColor: '#f9fafb',
    textAlign: 'left' as const
  },
  td: {
    border: '1px solid #d1d5db',
    padding: '0.5rem'
  }
};

export default function MarkdownEditor({
  content,
  previewMode,
  onContentChange,
  onPreviewModeChange
}: MarkdownEditorProps) {
  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbarRounded}>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => onPreviewModeChange(false)}
            className={previewMode ? styles.buttonVariants.inactive : styles.buttonVariants.active}
          >
            Edit
          </button>
          <button
            onClick={() => onPreviewModeChange(true)}
            className={previewMode ? styles.buttonVariants.active : styles.buttonVariants.inactive}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {!previewMode ? (
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language="markdown"
              value={content}
              onChange={(value) => onContentChange(value || '')}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: true,
                fontSize: 14,
                tabSize: 2,
                insertSpaces: true,
                automaticLayout: true
              }}
              theme="vs-light"
            />
          </div>
        ) : (
          <div className={styles.previewContainer}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
                h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
                h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return (
                    <code style={isInline ? markdownStyles.codeInline : markdownStyles.codeBlock}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote style={markdownStyles.blockquote}>
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <table style={markdownStyles.table}>
                    {children}
                  </table>
                ),
                th: ({ children }) => (
                  <th style={markdownStyles.th}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={markdownStyles.td}>
                    {children}
                  </td>
                )
              }}
            >
              {content || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}