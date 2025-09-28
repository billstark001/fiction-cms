import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from '@tanstack/react-router';
import Layout from '../components/layout/Layout';
import FileEditor from '../components/editor/FileEditor';
import { createSiteContentStore, useDefaultSiteContentState } from '../store/siteContentStore';
import { apiClient } from '../api/client';
import { ArrowLeftIcon } from '../components/icons';
import * as contentStyles from './SiteContentManagement.css';
import * as pageStyles from '../styles/pages.css';
import * as formStyles from '../styles/forms.css';
import * as commonStyles from '../styles/common.css';

export default function SiteContentManagement() {
  const router = useRouter();
  const { siteId } = useParams({ from: '/sites/$siteId/manage' });

  // Validation state
  const [validationState, setValidationState] = useState<{
    loading: boolean;
    result: any | null;
    error: string | null;
  }>({
    loading: false,
    result: null,
    error: null
  });

  // Create store instance for this specific siteId
  const useStore = useMemo(() => {
    if (!siteId) return null;
    return createSiteContentStore(siteId);
  }, [siteId]);

  // Use the store
  const {
    files,
    loading,
    error,
    selectedFile,
    fileContent,
    loadingContent,
    searchQuery,
    filterType,
    loadFiles,
    loadFileContent,
    saveFile,
    setSearchQuery,
    setFilterType,
    clearError,
    getFilteredFiles
  } = useStore?.() ?? useDefaultSiteContentState();

  useEffect(() => {
    if (!siteId) {
      router.navigate({ to: '/sites' });
      return;
    }
    loadFiles();
  }, [siteId, router, loadFiles]);

  const filteredFiles = getFilteredFiles();

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

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
  };

  const handleValidation = async () => {
    if (!siteId) return;
    
    setValidationState({ loading: true, result: null, error: null });
    
    try {
      const result = await apiClient.validateSite(siteId);
      setValidationState({ loading: false, result, error: null });
    } catch (error) {
      setValidationState({ 
        loading: false, 
        result: null, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      });
    }
  };

  if (!useStore || loading) {
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
        
        {/* Validation Controls */}
        <div className={contentStyles.headerActions}>
          <button
            onClick={handleValidation}
            disabled={validationState.loading}
            className={formStyles.secondaryButton}
          >
            {validationState.loading ? 'Validating...' : 'Validate Site'}
          </button>
        </div>
      </div>

      {error && (
        <div className={formStyles.errorMessage}>
          {error}
          <button
            onClick={clearError}
            className={contentStyles.errorDismissButton}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation Results */}
      {validationState.result && (
        <div className={`${pageStyles.card} ${
          validationState.result.status === 'success' ? formStyles.successMessage :
          validationState.result.status === 'warning' ? formStyles.infoMessage : 
          formStyles.errorMessage
        }`}>
          <h3>Validation Result: {validationState.result.status.toUpperCase()}</h3>
          <p>Return Code: {validationState.result.returnCode}</p>
          <p>Execution Time: {validationState.result.executionTime}ms</p>
          
          {validationState.result.stdout && (
            <div>
              <strong>Output:</strong>
              <pre className={contentStyles.validationOutput}>{validationState.result.stdout}</pre>
            </div>
          )}
          
          {validationState.result.stderr && (
            <div>
              <strong>Errors:</strong>
              <pre className={contentStyles.validationOutput}>{validationState.result.stderr}</pre>
            </div>
          )}
          
          {!validationState.result.hasValidateCommand && (
            <p className={formStyles.helpText}>
              No validation command configured for this site.
            </p>
          )}
          
          <button
            onClick={() => setValidationState({ loading: false, result: null, error: null })}
            className={contentStyles.dismissButton}
          >
            Dismiss
          </button>
        </div>
      )}

      {validationState.error && (
        <div className={formStyles.errorMessage}>
          Validation Error: {validationState.error}
          <button
            onClick={() => setValidationState({ loading: false, result: null, error: null })}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={formStyles.input}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
                {searchQuery && (
                  <button
                    onClick={handleClearFilters}
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
                    className={`${contentStyles.fileItem} ${selectedFile === file.path ? contentStyles.fileItemSelected : ''
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
          {selectedFile ? (
            <>
              <div className={pageStyles.cardHeader}>
                <h2 className={pageStyles.cardTitle}>{selectedFile}</h2>
                <p className={pageStyles.cardDescription}>
                  {files.find(f => f.path === selectedFile)?.type} file
                </p>
              </div>

              {loadingContent ? (
                <div className={contentStyles.editorPlaceholder}>
                  Loading file content...
                </div>
              ) : (
                <FileEditor
                  filePath={selectedFile}
                  fileType={files.find(f => f.path === selectedFile)?.type || 'asset'}
                  content={fileContent || ''}
                  onSave={saveFile}
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