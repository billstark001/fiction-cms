import * as styles from './styles.css';

interface EditorControlsProps {
  filePath: string;
  commitMessage: string;
  isDirty: boolean;
  saving: boolean;
  validationError: string | null;
  characterCount: number;
  onCommitMessageChange: (message: string) => void;
  onSave: () => void;
}

export default function EditorControls({
  filePath,
  commitMessage,
  isDirty,
  saving,
  validationError,
  characterCount,
  onCommitMessageChange,
  onSave
}: EditorControlsProps) {
  const canSave = isDirty && !saving && !validationError;

  return (
    <>
      {/* Controls */}
      <div className={styles.controlsContainer}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Commit Message (optional)
          </label>
          <input
            type="text"
            placeholder={`Update ${filePath}`}
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          onClick={onSave}
          disabled={!canSave}
          className={canSave ? styles.saveButtonVariants.enabled : styles.saveButtonVariants.disabled}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Status */}
      <div className={styles.statusContainer}>
        <span>
          {isDirty ? '● Unsaved changes' : '✓ Saved'}
          {validationError && ' - Fix validation errors before saving'}
        </span>
        <span>
          {characterCount ?? 0} characters
        </span>
      </div>
    </>
  );
}