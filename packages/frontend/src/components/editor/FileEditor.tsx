import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import JSON5 from 'json5';

interface FileEditorProps {
  filePath: string;
  fileType: 'markdown' | 'json' | 'sqlite' | 'asset';
  content: string;
  onSave: (content: string, commitMessage?: string) => Promise<void>;
}

interface EditorState {
  content: string;
  originalContent: string;
  isDirty: boolean;
  commitMessage: string;
  saving: boolean;
  previewMode: boolean; // For markdown
  jsonMode: 'visual' | 'text'; // For JSON
  jsonValidation: 'json' | 'json5'; // For JSON text mode
  validationError: string | null;
}

export default function FileEditor({ filePath, fileType, content, onSave }: FileEditorProps) {
  const [state, setState] = useState<EditorState>({
    content,
    originalContent: content,
    isDirty: false,
    commitMessage: '',
    saving: false,
    previewMode: false,
    jsonMode: 'visual',
    jsonValidation: 'json',
    validationError: null
  });

  useEffect(() => {
    setState(prev => ({
      ...prev,
      content,
      originalContent: content,
      isDirty: false,
      validationError: null
    }));
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setState(prev => ({
      ...prev,
      content: newContent,
      isDirty: newContent !== prev.originalContent,
      validationError: null
    }));

    // Validate JSON in real-time if in text mode
    if (fileType === 'json' && state.jsonMode === 'text') {
      validateJson(newContent);
    }
  };

  const validateJson = (jsonContent: string) => {
    try {
      if (state.jsonValidation === 'json5') {
        JSON5.parse(jsonContent);
      } else {
        JSON.parse(jsonContent);
      }
      setState(prev => ({ ...prev, validationError: null }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      setState(prev => ({ ...prev, validationError: errorMessage }));
      return false;
    }
  };

  const handleSave = async () => {
    if (state.saving) return;

    // Validate JSON before saving if in text mode
    if (fileType === 'json' && state.jsonMode === 'text') {
      if (!validateJson(state.content)) {
        return; // Don't save if validation fails
      }
    }

    try {
      setState(prev => ({ ...prev, saving: true }));
      await onSave(state.content, state.commitMessage || undefined);
      setState(prev => ({
        ...prev,
        originalContent: prev.content,
        isDirty: false,
        commitMessage: '',
        saving: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, saving: false }));
      // Error handling is done in parent component
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'json':
        return 'json';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'sql':
        return 'sql';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'py':
        return 'python';
      default:
        return 'plaintext';
    }
  };

  const renderMarkdownEditor = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Markdown Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        borderRadius: '0.375rem 0.375rem 0 0'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setState(prev => ({ ...prev, previewMode: false }))}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              backgroundColor: !state.previewMode ? '#2563eb' : 'transparent',
              color: !state.previewMode ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, previewMode: true }))}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              backgroundColor: state.previewMode ? '#2563eb' : 'transparent',
              color: state.previewMode ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex' }}>
        {!state.previewMode ? (
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language="markdown"
              value={state.content}
              onChange={(value) => handleContentChange(value || '')}
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
          <div style={{
            flex: 1,
            padding: '1rem',
            overflow: 'auto',
            backgroundColor: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ color: '#4b5563' }}>{children}</h3>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return (
                    <code style={{
                      backgroundColor: isInline ? '#f3f4f6' : '#1f2937',
                      color: isInline ? '#1f2937' : '#e5e7eb',
                      padding: isInline ? '0.125rem 0.25rem' : '1rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875em',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      display: isInline ? 'inline' : 'block',
                      whiteSpace: isInline ? 'nowrap' : 'pre',
                      overflow: isInline ? 'hidden' : 'auto'
                    }}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: '4px solid #e5e7eb',
                    paddingLeft: '1rem',
                    marginLeft: 0,
                    fontStyle: 'italic',
                    color: '#6b7280'
                  }}>
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <table style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    marginTop: '1rem',
                    marginBottom: '1rem'
                  }}>
                    {children}
                  </table>
                ),
                th: ({ children }) => (
                  <th style={{
                    border: '1px solid #d1d5db',
                    padding: '0.5rem',
                    backgroundColor: '#f9fafb',
                    textAlign: 'left'
                  }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{
                    border: '1px solid #d1d5db',
                    padding: '0.5rem'
                  }}>
                    {children}
                  </td>
                )
              }}
            >
              {state.content || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );

  const renderJsonEditor = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* JSON Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setState(prev => ({ ...prev, jsonMode: 'visual' }))}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              backgroundColor: state.jsonMode === 'visual' ? '#2563eb' : 'transparent',
              color: state.jsonMode === 'visual' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Visual
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, jsonMode: 'text' }))}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              backgroundColor: state.jsonMode === 'text' ? '#2563eb' : 'transparent',
              color: state.jsonMode === 'text' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Text
          </button>
        </div>
        
        {state.jsonMode === 'text' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Format:</span>
            <select
              value={state.jsonValidation}
              onChange={(e) => setState(prev => ({ ...prev, jsonValidation: e.target.value as 'json' | 'json5' }))}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: 'white'
              }}
            >
              <option value="json">JSON</option>
              <option value="json5">JSON5</option>
            </select>
          </div>
        )}
      </div>

      {/* Validation Error */}
      {state.validationError && (
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          ⚠️ {state.validationError}
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1 }}>
        {state.jsonMode === 'visual' ? (
          <div style={{
            padding: '1rem',
            overflow: 'auto',
            height: '100%',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.875rem',
                textAlign: 'center',
                margin: '2rem 0'
              }}>
                Visual JSON editor coming soon. Please use text mode for now.
              </p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language="json"
            value={state.content}
            onChange={(value) => handleContentChange(value || '')}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              fontSize: 14,
              tabSize: 2,
              insertSpaces: true,
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true
            }}
            theme="vs-light"
          />
        )}
      </div>
    </div>
  );

  const renderGenericEditor = () => (
    <Editor
      height="100%"
      language={getLanguageFromPath(filePath)}
      value={state.content}
      onChange={(value) => handleContentChange(value || '')}
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
  );

  const renderEditor = () => {
    switch (fileType) {
      case 'markdown':
        return renderMarkdownEditor();
      case 'json':
        return renderJsonEditor();
      case 'sqlite':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>SQLite Editor</h3>
            <p>SQLite database editing features coming soon</p>
          </div>
        );
      case 'asset':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21,15 16,10 5,21"></polyline>
            </svg>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Asset File</h3>
            <p>Binary assets cannot be edited as text</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Path: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                {filePath}
              </code>
            </p>
          </div>
        );
      default:
        return renderGenericEditor();
    }
  };

  if (fileType === 'asset' || fileType === 'sqlite') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderEditor()}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
        {renderEditor()}
      </div>

      {/* Bottom Controls */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 'medium',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Commit Message (optional)
          </label>
          <input
            type="text"
            placeholder={`Update ${filePath}`}
            value={state.commitMessage}
            onChange={(e) => setState(prev => ({ ...prev, commitMessage: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
        
        <button
          onClick={handleSave}
          disabled={!state.isDirty || state.saving || !!state.validationError}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: (!state.isDirty || state.saving || state.validationError) ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 'medium',
            cursor: (!state.isDirty || state.saving || state.validationError) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease-in-out',
            minWidth: '80px'
          }}
        >
          {state.saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Status */}
      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {state.isDirty ? '● Unsaved changes' : '✓ Saved'}
          {state.validationError && ' - Fix validation errors before saving'}
        </span>
        <span>
          {state.content.length.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}