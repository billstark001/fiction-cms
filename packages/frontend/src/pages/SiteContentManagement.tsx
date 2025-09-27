import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import FileEditor from '../components/editor/FileEditor';
import { apiClient } from '../api/client';
import * as styles from '../components/layout/Layout.css';

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
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
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
      navigate('/sites');
      return;
    }
    loadFiles();
  }, [siteId, navigate]);

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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          Loading site content...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <button
            onClick={() => navigate('/sites')}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
              marginBottom: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Sites
          </button>
          <h1 className={styles.pageTitle}>Site Content Management</h1>
          <p className={styles.pageDescription}>
            Manage files and content for site: {siteId}
          </p>
        </div>
      </div>

      {state.error && (
        <div className={styles.card} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ color: '#dc2626', padding: '1rem', textAlign: 'center' }}>
            {state.error}
            <button
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              style={{
                marginLeft: '1rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid #dc2626',
                borderRadius: '0.25rem',
                color: '#dc2626',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
        {/* File Browser */}
        <div className={styles.card} style={{ height: 'fit-content', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Files</h2>
            <p className={styles.cardDescription}>
              Browse and select files to edit
            </p>
          </div>

          {/* Search and Filter */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search files..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <select
              value={state.filterType}
              onChange={(e) => setState(prev => ({ ...prev, filterType: e.target.value }))}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                outline: 'none',
                minWidth: '100px'
              }}
            >
              <option value="all">All Types</option>
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="sqlite">SQLite</option>
              <option value="asset">Assets</option>
            </select>
          </div>

          {/* File List */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            maxHeight: 'calc(100vh - 400px)'
          }}>
            {filteredFiles.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#6b7280' 
              }}>
                <p>No files found</p>
                {state.searchQuery && (
                  <button
                    onClick={() => setState(prev => ({ ...prev, searchQuery: '', filterType: 'all' }))}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {filteredFiles.map(file => (
                  <div
                    key={file.path}
                    onClick={() => loadFileContent(file.path)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      backgroundColor: state.selectedFile === file.path ? '#eff6ff' : 'transparent',
                      borderLeft: state.selectedFile === file.path ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'all 0.15s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      if (state.selectedFile !== file.path) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (state.selectedFile !== file.path) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>
                      {getFileIcon(file.type)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: state.selectedFile === file.path ? '600' : '400',
                        color: state.selectedFile === file.path ? '#2563eb' : '#111827',
                        wordBreak: 'break-all',
                        marginBottom: '0.25rem'
                      }}>
                        {file.path}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
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
        <div className={styles.card} style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {state.selectedFile ? (
            <>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{state.selectedFile}</h2>
                <p className={styles.cardDescription}>
                  {state.files.find(f => f.path === state.selectedFile)?.type} file
                </p>
              </div>
              
              {state.loadingContent ? (
                <div style={{ 
                  flex: 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#6b7280'
                }}>
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
            <div style={{ 
              flex: 1,
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#6b7280',
              textAlign: 'center'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No file selected</h3>
              <p>Select a file from the left panel to start editing</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}