import { useEffect } from 'react';
import MarkdownEditor from './MarkdownEditor';
import JsonEditor from './JsonEditor';
import GenericEditor from './GenericEditor';
import AssetViewer from './AssetViewer';
import EditorControls from './EditorControls';
import * as styles from './styles.css';
import { createEditorStore } from '../../store/editorStore';

interface FileEditorProps {
  filePath: string;
  fileType: 'markdown' | 'json' | 'sqlite' | 'asset';
  content: string;
  onSave: (content: string, commitMessage?: string) => Promise<void>;
}

export default function FileEditor({ filePath, fileType, content, onSave }: FileEditorProps) {
  const useStore = createEditorStore(filePath, fileType, content);
  const store = useStore();

  // Reset store when content changes
  useEffect(() => {
    store.reset(content);
  }, [content, store]);

  const handleSave = async () => {
    if (store.saving) return;

    // Validate JSON before saving if in text mode
    if (fileType === 'json' && store.jsonMode === 'text') {
      if (!store.validateJson(store.content)) {
        return;
      }
    }

    try {
      store.setSaving(true);
      await onSave(store.content, store.commitMessage || undefined);
      store.reset(store.content);
    } catch (error) {
      store.setSaving(false);
    }
  };

  const renderEditor = () => {
    switch (fileType) {
      case 'markdown':
        return (
          <MarkdownEditor
            content={store.content}
            previewMode={store.previewMode}
            onContentChange={store.setContent}
            onPreviewModeChange={store.setPreviewMode}
          />
        );
      case 'json':
        return (
          <JsonEditor
            content={store.content}
            jsonMode={store.jsonMode}
            jsonValidation={store.jsonValidation}
            validationError={store.validationError}
            onContentChange={store.setContent}
            onJsonModeChange={store.setJsonMode}
            onJsonValidationChange={store.setJsonValidation}
          />
        );
      case 'sqlite':
      case 'asset':
        return <AssetViewer filePath={filePath} fileType={fileType} />;
      default:
        return (
          <GenericEditor
            filePath={filePath}
            content={store.content}
            onContentChange={store.setContent}
          />
        );
    }
  };

  if (fileType === 'asset' || fileType === 'sqlite') {
    return (
      <div className={styles.container}>
        {renderEditor()}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Editor */}
      <div className={styles.editorContainer}>
        {renderEditor()}
      </div>

      {/* Controls */}
      <EditorControls
        filePath={filePath}
        commitMessage={store.commitMessage}
        isDirty={store.isDirty}
        saving={store.saving}
        validationError={store.validationError}
        characterCount={store.content.length}
        onCommitMessageChange={store.setCommitMessage}
        onSave={handleSave}
      />
    </div>
  );
}