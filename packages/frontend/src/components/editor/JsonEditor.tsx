import { Editor } from '@monaco-editor/react';
import * as styles from './styles.css';
import { SchemaField, type EvaluationIssue, type FieldHint, type JsonSchema, type SchemaAssetOption } from '../schema';

interface JsonEditorProps {
  content: string;
  jsonMode: 'visual' | 'text';
  jsonValidation: 'json' | 'json5';
  validationError: string | null;
  schema?: JsonSchema;
  hints?: Record<string, FieldHint>;
  assets?: SchemaAssetOption[];
  issues?: Record<string, EvaluationIssue[]>;
  onContentChange: (content: string) => void;
  onJsonModeChange: (mode: 'visual' | 'text') => void;
  onJsonValidationChange: (validation: 'json' | 'json5') => void;
}

export default function JsonEditor({
  content,
  jsonMode,
  jsonValidation,
  assets,
  hints,
  issues,
  schema,
  validationError,
  onContentChange,
  onJsonModeChange,
  onJsonValidationChange
}: JsonEditorProps) {
  const parsedContent = (() => {
    if (!schema) return { ok: false as const, value: null };
    try {
      return { ok: true as const, value: JSON.parse(content || 'null') };
    } catch {
      return { ok: false as const, value: null };
    }
  })();

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
            {schema && parsedContent.ok ? (
              <SchemaField
                assets={assets}
                hints={hints}
                issues={issues}
                onChange={(nextValue) => onContentChange(JSON.stringify(nextValue, null, 2))}
                schema={schema}
                value={parsedContent.value}
              />
            ) : (
              <div className={styles.visualJsonPlaceholder}>
                <p className={styles.placeholderText}>
                  Visual JSON editing is available when a JSON Schema is attached to this file.
                </p>
              </div>
            )}
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
