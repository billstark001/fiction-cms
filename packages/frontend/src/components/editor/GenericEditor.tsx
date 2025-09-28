import { Editor } from '@monaco-editor/react';
import { getLanguageFromPath } from './utils';

interface GenericEditorProps {
  filePath: string;
  content: string;
  onContentChange: (content: string) => void;
}

export default function GenericEditor({ filePath, content, onContentChange }: GenericEditorProps) {
  return (
    <Editor
      height="100%"
      language={getLanguageFromPath(filePath)}
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
  );
}