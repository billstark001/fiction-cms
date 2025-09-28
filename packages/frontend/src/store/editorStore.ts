import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import JSON5 from 'json5';

export interface EditorState {
  key: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  commitMessage: string;
  saving: boolean;
  previewMode: boolean;
  jsonMode: 'visual' | 'text';
  jsonValidation: 'json' | 'json5';
  validationError: string | null;
}

export interface EditorActions {
  setContent: (content: string) => void;
  setCommitMessage: (message: string) => void;
  setSaving: (saving: boolean) => void;
  setPreviewMode: (preview: boolean) => void;
  setJsonMode: (mode: 'visual' | 'text') => void;
  setJsonValidation: (validation: 'json' | 'json5') => void;
  setValidationError: (error: string | null) => void;
  reset: (content: string) => void;
  validateJson: (content: string) => boolean;
}

export type EditorStore = EditorState & EditorActions;

type StoreType = ReturnType<typeof createEditorStoreRaw>;

const stores = new Map<string, StoreType>();

export function createEditorStoreRaw(filePath: string, fileType: string, initialContent: string) {
  const storeKey = `${filePath}:${fileType}`;
  
  const store = create<EditorStore>()(
    subscribeWithSelector((set, get) => ({
      key: storeKey,
      // State
      content: initialContent,
      originalContent: initialContent,
      isDirty: false,
      commitMessage: '',
      saving: false,
      previewMode: false,
      jsonMode: 'visual',
      jsonValidation: 'json',
      validationError: null,

      // Actions
      setContent: (content: string) => {
        const state = get();
        set({
          content,
          isDirty: content !== state.originalContent,
          validationError: null
        });

        // Auto-validate JSON in text mode
        if (fileType === 'json' && state.jsonMode === 'text') {
          get().validateJson(content);
        }
      },

      setCommitMessage: (commitMessage: string) => set({ commitMessage }),

      setSaving: (saving: boolean) => set({ saving }),

      setPreviewMode: (previewMode: boolean) => set({ previewMode }),

      setJsonMode: (jsonMode: 'visual' | 'text') => set({ jsonMode }),

      setJsonValidation: (jsonValidation: 'json' | 'json5') => set({ jsonValidation }),

      setValidationError: (validationError: string | null) => set({ validationError }),

      reset: (content: string) => set({
        content,
        originalContent: content,
        isDirty: false,
        commitMessage: '',
        saving: false,
        validationError: null
      }),

      validateJson: (jsonContent: string) => {
        const state = get();
        try {
          if (state.jsonValidation === 'json5') {
            JSON5.parse(jsonContent);
          } else {
            JSON.parse(jsonContent);
          }
          set({ validationError: null });
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
          set({ validationError: errorMessage });
          return false;
        }
      }
    }))
  );

  return store;
}

export function createEditorStore(filePath: string, fileType: string, initialContent: string): StoreType {
  const storeKey = `${filePath}:${fileType}`;
  if (!stores.has(storeKey)) {
    const store = createEditorStoreRaw(filePath, fileType, initialContent);
    stores.set(storeKey, store);
  }
  return stores.get(storeKey)!;
}

export function getEditorStore(filePath: string, fileType: string): StoreType | undefined {
  const storeKey = `${filePath}:${fileType}`;
  return stores.get(storeKey);
}

export function clearEditorStore(filePath: string, fileType: string) {
  const storeKey = `${filePath}:${fileType}`;
  stores.delete(storeKey);
}