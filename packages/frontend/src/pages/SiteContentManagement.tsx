import { useState, useEffect } from 'react';
import { useRouter, useParams } from '@tanstack/react-router';
import Layout from '../components/layout/Layout';
import FileEditor from '../components/editor/FileEditor';
import { apiClient } from '../api/client';
import { ArrowLeftIcon } from '../components/icons';
import * as contentStyles from './SiteContentManagement.css';
import * as pageStyles from '../styles/pages.css';
import * as formStyles from '../styles/forms.css';
import * as commonStyles from '../styles/common.css';

interface FileItem {
  path: string;
  type: 'markdown' | 'json' | 'sqlite' | 'asset';
  size: number;
  lastModified: string;
}

interface SiteContentState {
  siteId: string;
  files: FileItem[];
  loading: boolean;
  error: string | null;
  selectedFile: string | null;
  fileContent: string | null;
  loadingContent: boolean;
  searchQuery: string;
  filterType: string;
}

export default function SiteContentManagement() {
  const router = useRouter();
  const { siteId } = useParams({ from: '/sites/$siteId/manage' });
  const [state, setState] = useState<SiteContentState>({
    siteId: siteId || '',
    files: [],
    loading: true,
    error: null,
    selectedFile: null,
    fileContent: null,
    loadingContent: false,
    searchQuery: '',
    filterType: 'all'
  });

  useEffect(() => {
    if (!siteId) {
      router.navigate({ to: '/sites' });
      return;
    }
    loadFiles();
  }, [siteId, router]);

  const loadFiles = async () => {
    if (!siteId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiClient.getEditableFiles(siteId);
      setState(prev => ({
        ...prev,
        files: response.files,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load files',
        loading: false
      }));
    }
  };

  const loadFileContent = async (filePath: string) => {
    if (!siteId) return;

    try {
      setState(prev => ({ ...prev, loadingContent: true }));
      const response = await apiClient.getFileContent(siteId, filePath);
      setState(prev => ({
        ...prev,
        fileContent: response.content,
        selectedFile: filePath,
        loadingContent: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load file content',
        loadingContent: false
      }));
    }
  };

  const handleSaveFile = async (content: string, commitMessage?: string) => {
    if (!siteId || !state.selectedFile) return;

    try {
      await apiClient.updateFileContent(siteId, state.selectedFile, content, commitMessage);
      setState(prev => ({ ...prev, fileContent: content }));
      // Show success message (you could add a toast notification here)
      console.log('File saved successfully');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save file'
      }));
    }
  };

  const filteredFiles = state.files.filter(file => {
    const matchesSearch = file.path.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesFilter = state.filterType === 'all' || file.type === state.filterType;
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return '📝';
      case 'json':
        return '📋';
      case 'sqlite':
        return '🗄️';
      case 'asset':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (state.loading) {
    return (
      <Layout>
        <div className={commonStyles.loadingContainer}>
          Loading site content...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={pageStyles.header}>
        <div>
          <button
            onClick={() => router.navigate({ to: '/sites' })}
            className={contentStyles.backButton}
          >
            <ArrowLeftIcon />
            Back to Sites
          </button>
          <h1 className={pageStyles.pageTitle}>Site Content Management</h1>
          <p className={pageStyles.pageDescription}>
            Manage files and content for site: {siteId}
          </p>
        </div>
      </div>

      {state.error && (
        <div className={formStyles.errorMessage}>
          {state.error}
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className={contentStyles.errorDismissButton}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className={contentStyles.contentLayout}>
        {/* File Browser */}
        <div className={`${pageStyles.card} ${contentStyles.fileBrowserCard}`}>
          <div className={pageStyles.cardHeader}>
            <h2 className={pageStyles.cardTitle}>Files</h2>
            <p className={pageStyles.cardDescription}>
              Browse and select files to edit
            </p>
          </div>

          {/* Search and Filter */}
          <div className={contentStyles.searchFilterContainer}>
            <input
              type="text"
              placeholder="Search files..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className={formStyles.input}
            />
            <select
              value={state.filterType}
              onChange={(e) => setState(prev => ({ ...prev, filterType: e.target.value }))}
              className={formStyles.select}
            >
              <option value="all">All Types</option>
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="sqlite">SQLite</option>
              <option value="asset">Assets</option>
            </select>
          </div>

          {/* File List */}
          <div className={contentStyles.fileList}>
            {filteredFiles.length === 0 ? (
              <div className={contentStyles.fileListEmpty}>
                <p>No files found</p>
                {state.searchQuery && (
                  <button
                    onClick={() => setState(prev => ({ ...prev, searchQuery: '', filterType: 'all' }))}
                    className={formStyles.secondaryButton}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className={contentStyles.fileList}>
                {filteredFiles.map(file => (
                  <div
                    key={file.path}
                    onClick={() => loadFileContent(file.path)}
                    className={`${contentStyles.fileItem} ${state.selectedFile === file.path ? contentStyles.fileItemSelected : ''
                      }`}
                  >
                    <span className={contentStyles.fileIcon}>
                      {getFileIcon(file.type)}
                    </span>
                    <div className={contentStyles.fileDetails}>
                      <div className={contentStyles.fileName}>
                        {file.path}
                      </div>
                      <div className={contentStyles.fileMetadata}>
                        <span>{file.type}</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File Editor */}
        <div className={`${pageStyles.card} ${contentStyles.editorCard}`}>
          {state.selectedFile ? (
            <>
              <div className={pageStyles.cardHeader}>
                <h2 className={pageStyles.cardTitle}>{state.selectedFile}</h2>
                <p className={pageStyles.cardDescription}>
                  {state.files.find(f => f.path === state.selectedFile)?.type} file
                </p>
              </div>

              {state.loadingContent ? (
                <div className={contentStyles.editorPlaceholder}>
                  Loading file content...
                </div>
              ) : (
                <FileEditor
                  filePath={state.selectedFile}
                  fileType={state.files.find(f => f.path === state.selectedFile)?.type || 'asset'}
                  content={state.fileContent || ''}
                  onSave={handleSaveFile}
                />
              )}
            </>
          ) : (
            <div className={contentStyles.editorPlaceholder}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={contentStyles.editorPlaceholderIcon}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <h3 className={contentStyles.editorPlaceholderTitle}>No file selected</h3>
              <p className={contentStyles.editorPlaceholderText}>Select a file from the left panel to start editing</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}