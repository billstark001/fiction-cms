import { Editor } from '@monaco-editor/react';
import * as styles from './styles.css';

interface JsonEditorProps {
  content: string;
  jsonMode: 'visual' | 'text';
  jsonValidation: 'json' | 'json5';
  validationError: string | null;
  onContentChange: (content: string) => void;
  onJsonModeChange: (mode: 'visual' | 'text') => void;
  onJsonValidationChange: (validation: 'json' | 'json5') => void;
}

export default function JsonEditor({
  content,
  jsonMode,
  jsonValidation,
  validationError,
  onContentChange,
  onJsonModeChange,
  onJsonValidationChange
}: JsonEditorProps) {
  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => onJsonModeChange('visual')}
            className={jsonMode === 'visual' ? styles.buttonVariants.active : styles.buttonVariants.inactive}
          >
            Visual
          </button>
          <button
            onClick={() => onJsonModeChange('text')}
            className={jsonMode === 'text' ? styles.buttonVariants.active : styles.buttonVariants.inactive}
          >
            Text
          </button>
        </div>

        {jsonMode === 'text' && (
          <div className={styles.buttonGroup}>
            <span className={styles.selectLabel}>Format:</span>
            <select
              value={jsonValidation}
              onChange={(e) => onJsonValidationChange(e.target.value as 'json' | 'json5')}
              className={styles.select}
            >
              <option value="json">JSON</option>
              <option value="json5">JSON5</option>
            </select>
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className={styles.errorBanner}>
          ⚠️ {validationError}
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1 }}>
        {jsonMode === 'visual' ? (
          <div className={styles.visualJsonContainer}>
            <div className={styles.visualJsonPlaceholder}>
              <p className={styles.placeholderText}>
                Visual JSON editor coming soon. Please use text mode for now.
              </p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language="json"
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
}