import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from '@tanstack/react-router';
import Layout from '../components/layout/Layout';
import FileEditor from '../components/editor/FileEditor';
import { createSiteContentStore, useDefaultSiteContentState } from '../store/siteContentStore';
import { useSiteManagerStore } from '../store/siteManagerStore';
import { apiClient } from '../api/client';
import { ArrowLeftIcon } from '../components/icons';
import { ConfirmDialog } from '../components/ui/AlertDialog';
import { ConflictResolutionDialog } from '../components/ui/ConflictResolutionDialog';
import * as contentStyles from './SiteContentManagement.css';
import * as formStyles from '../styles/forms.css';
import * as commonStyles from '../styles/common.css';

export default function SiteContentManagement() {
  const router = useRouter();
  const { siteId } = useParams({ from: '/sites/$siteId/manage' });
  const { openSite, updateSiteState } = useSiteManagerStore();

  // UI state
  const [closingFile, setClosingFile] = useState<string | null>(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(true);
  const [conflicts, setConflicts] = useState<Array<{
    filePath: string;
    localModified: string;
    remoteModified: string;
    localContent: string;
    remoteContent?: string;
  }>>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

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
    openedFiles,
    selectedFile,
    fileContent,
    loadingContent,
    searchQuery,
    filterType,
    gitStatus,
    loadFiles,
    openFile,
    closeFile,
    switchToFile,
    saveFileLocally,
    saveFileToRemote,
    commitFiles,
    setSearchQuery,
    setFilterType,
    clearError,
    getFilteredFiles,
    pullFromRemote,
    resolveConflict
  } = useStore?.() ?? useDefaultSiteContentState();

  useEffect(() => {
    if (!siteId) {
      router.navigate({ to: '/sites' });
      return;
    }
    
    // Register this site as opened
    openSite(siteId);
    
    loadFiles();
    pullFromRemote(); // Git pull on entry
  }, [siteId, router, loadFiles, openSite, pullFromRemote]);

  // Update site manager state when files change
  useEffect(() => {
    if (siteId) {
      const hasDirtyFiles = files.some(f => f.isDirty);
      updateSiteState(siteId, { 
        openedFiles,
        selectedFile,
        isDirty: hasDirtyFiles 
      });
    }
  }, [siteId, openedFiles, selectedFile, files, updateSiteState]);

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

  const handleFileClick = async (filePath: string) => {
    await openFile(filePath);
  };

  const handleCloseFile = (filePath: string) => {
    const canClose = closeFile(filePath);
    if (!canClose) {
      setClosingFile(filePath);
    }
  };

  const confirmCloseFile = () => {
    if (closingFile) {
      // Force close by clearing local changes first
      closeFile(closingFile);
      setClosingFile(null);
    }
  };

  const handleSaveAndRemote = async () => {
    try {
      await saveFileToRemote();
    } catch (error) {
      console.error('Failed to save to remote:', error);
    }
  };

  const handleCommit = async () => {
    const dirtyFiles = files.filter(f => f.isDirty).map(f => f.path);
    if (dirtyFiles.length === 0) return;
    
    // For now, use a simple commit message. In a real implementation,
    // you'd show a dialog to get the commit message from the user
    const message = `Update ${dirtyFiles.length} file(s)`;
    await commitFiles(dirtyFiles, message);
  };

  const handleConflictResolve = async (
    filePath: string, 
    resolution: 'local' | 'remote' | 'manual', 
    manualContent?: string
  ) => {
    await resolveConflict(filePath, resolution, manualContent);
    
    // Remove resolved conflict from list
    setConflicts(prev => prev.filter(c => c.filePath !== filePath));
  };

  const handleConflictResolveAll = async (
    resolutions: Array<{ 
      filePath: string; 
      resolution: 'local' | 'remote' | 'manual'; 
      manualContent?: string 
    }>
  ) => {
    for (const resolution of resolutions) {
      await resolveConflict(
        resolution.filePath, 
        resolution.resolution, 
        resolution.manualContent
      );
    }
    
    setConflicts([]);
    setShowConflictDialog(false);
  };

  // Check for conflicts when files change
  useEffect(() => {
    const conflictedFiles = files.filter(f => f.hasConflict);
    if (conflictedFiles.length > 0) {
      const newConflicts = conflictedFiles.map(file => ({
        filePath: file.path,
        localModified: file.lastModified,
        remoteModified: new Date().toISOString(), // This would come from backend
        localContent: file.localContent || '',
        remoteContent: undefined // This would be fetched from backend
      }));
      
      setConflicts(newConflicts);
      setShowConflictDialog(true);
    }
  }, [files]);

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
      {/* Compact Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.navigate({ to: '/sites' })}
              className={contentStyles.backButton}
            >
              <ArrowLeftIcon />
              Sites
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              {siteId}
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {gitStatus.modifiedFiles > 0 && `${gitStatus.modifiedFiles} modified`}
            </span>
            <button
              onClick={handleValidation}
              disabled={validationState.loading}
              className={formStyles.secondaryButton}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              {validationState.loading ? 'Validating...' : 'Validate'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={formStyles.errorMessage} style={{ margin: '0.5rem 1rem' }}>
          {error}
          <button onClick={clearError} className={contentStyles.errorDismissButton}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content - Three Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: previewCollapsed ? '300px 1fr' : '300px 1fr 400px',
        height: 'calc(100vh - 150px)',
        transition: 'grid-template-columns 0.2s ease'
      }}>
        
        {/* File Browser - Left Panel */}
        <div style={{ 
          borderRight: '1px solid #e5e7eb', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
              Files
            </h3>
            
            {/* Compact Search and Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '0.25rem',
                  fontSize: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              >
                <option value="all">All</option>
                <option value="markdown">MD</option>
                <option value="json">JSON</option>
                <option value="sqlite">DB</option>
                <option value="asset">Assets</option>
              </select>
            </div>
          </div>

          {/* File List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {getFilteredFiles().map(file => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file.path)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '0.25rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: selectedFile === file.path ? '#eff6ff' : 'transparent',
                  border: selectedFile === file.path ? '1px solid #2563eb' : '1px solid transparent'
                }}
              >
                <span>{getFileIcon(file.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: selectedFile === file.path ? '500' : '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {file.path}
                  </div>
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span className={`file-status status-${file.status}`} style={{
                      color: file.status === 'local' ? '#dc2626' : 
                             file.status === 'remote' ? '#f59e0b' : '#10b981'
                    }}>
                      {file.status === 'local' && '●'}
                      {file.status === 'remote' && '◐'}
                      {file.status === 'committed' && '○'}
                    </span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor - Center Panel */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* File Tabs */}
          {openedFiles.length > 0 && (
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              overflow: 'auto'
            }}>
              {openedFiles.map(filePath => {
                const file = files.find(f => f.path === filePath);
                return (
                  <div
                    key={filePath}
                    onClick={() => switchToFile(filePath)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      borderRight: '1px solid #e5e7eb',
                      backgroundColor: selectedFile === filePath ? 'white' : 'transparent',
                      borderBottom: selectedFile === filePath ? '2px solid #2563eb' : '2px solid transparent',
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content'
                    }}
                  >
                    <span>{getFileIcon(file?.type || 'asset')}</span>
                    <span style={{ fontWeight: selectedFile === filePath ? '500' : '400' }}>
                      {filePath.split('/').pop()}
                    </span>
                    {file?.isDirty && (
                      <span style={{ color: '#dc2626', fontSize: '0.625rem' }}>●</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseFile(filePath);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        padding: '0.125rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor Content */}
          <div style={{ flex: 1, position: 'relative' }}>
            {selectedFile && !loadingContent ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#f9fafb', 
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {files.find(f => f.path === selectedFile)?.type} file
                  </span>
                  <button
                    onClick={() => setPreviewCollapsed(!previewCollapsed)}
                    style={{
                      background: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.625rem',
                      cursor: 'pointer'
                    }}
                  >
                    {previewCollapsed ? 'Show Preview' : 'Hide Preview'}
                  </button>
                </div>
                <FileEditor
                  filePath={selectedFile}
                  fileType={files.find(f => f.path === selectedFile)?.type || 'asset'}
                  content={fileContent || ''}
                  onSave={saveFileLocally}
                />
              </div>
            ) : loadingContent ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6b7280'
              }}>
                Loading...
              </div>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                <div>Select a file to start editing</div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel - Right (Collapsible) */}
        {!previewCollapsed && (
          <div style={{ 
            borderLeft: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ 
              padding: '0.5rem 1rem', 
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                Preview
              </h3>
            </div>
            <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
              {selectedFile ? (
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Preview for {selectedFile}
                  {/* Preview content would go here */}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  No file selected
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status/Commit Bar */}
      <div style={{ 
        borderTop: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.75rem' }}>
          <span style={{ color: '#6b7280' }}>
            {files.filter(f => f.isDirty).length} modified files
          </span>
          {gitStatus.lastPull && (
            <span style={{ color: '#6b7280' }}>
              Last pull: {new Date(gitStatus.lastPull).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleSaveAndRemote}
            disabled={files.filter(f => f.isDirty).length === 0}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Save to Remote
          </button>
          <button
            onClick={handleCommit}
            disabled={files.filter(f => f.status === 'remote').length === 0}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Commit Changes
          </button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!closingFile}
        onOpenChange={() => setClosingFile(null)}
        title="Unsaved Changes"
        description={`The file "${closingFile}" has unsaved changes. Are you sure you want to close it?`}
        confirmText="Close"
        cancelText="Keep Open"
        onConfirm={confirmCloseFile}
        variant="destructive"
      />

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflicts={conflicts}
        onResolve={handleConflictResolve}
        onResolveAll={handleConflictResolveAll}
      />
    </Layout>
  );
}