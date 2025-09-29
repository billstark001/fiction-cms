import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from './Dialog';
import * as styles from './ConflictResolutionDialog.css';

interface FileConflict {
  filePath: string;
  localModified: string;
  remoteModified: string;
  localContent: string;
  remoteContent?: string;
}

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: FileConflict[];
  onResolve: (filePath: string, resolution: 'local' | 'remote' | 'manual', manualContent?: string) => Promise<void>;
  onResolveAll: (resolutions: Array<{ filePath: string; resolution: 'local' | 'remote' | 'manual'; manualContent?: string }>) => Promise<void>;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  onResolveAll
}: ConflictResolutionDialogProps) {
  const [selectedConflict, setSelectedConflict] = useState<FileConflict | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, { 
    type: 'local' | 'remote' | 'manual'; 
    content?: string 
  }>>({});
  const [manualContent, setManualContent] = useState<string>('');

  React.useEffect(() => {
    if (conflicts.length > 0 && !selectedConflict) {
      setSelectedConflict(conflicts[0]);
      setManualContent(conflicts[0].localContent);
    }
  }, [conflicts, selectedConflict]);

  const handleSelectConflict = (conflict: FileConflict) => {
    setSelectedConflict(conflict);
    const resolution = resolutions[conflict.filePath];
    if (resolution?.type === 'manual' && resolution.content) {
      setManualContent(resolution.content);
    } else {
      setManualContent(conflict.localContent);
    }
  };

  const handleResolutionChange = (type: 'local' | 'remote' | 'manual') => {
    if (!selectedConflict) return;

    setResolutions(prev => ({
      ...prev,
      [selectedConflict.filePath]: {
        type,
        content: type === 'manual' ? manualContent : undefined
      }
    }));
  };

  const handleManualContentChange = (content: string) => {
    setManualContent(content);
    if (!selectedConflict) return;

    setResolutions(prev => ({
      ...prev,
      [selectedConflict.filePath]: {
        type: 'manual',
        content
      }
    }));
  };

  const handleResolveSelected = async () => {
    if (!selectedConflict) return;

    const resolution = resolutions[selectedConflict.filePath];
    if (!resolution) return;

    await onResolve(
      selectedConflict.filePath, 
      resolution.type,
      resolution.content
    );

    // Move to next conflict or close if this was the last one
    const currentIndex = conflicts.findIndex(c => c.filePath === selectedConflict.filePath);
    const nextConflict = conflicts[currentIndex + 1];
    
    if (nextConflict) {
      setSelectedConflict(nextConflict);
      setManualContent(nextConflict.localContent);
    } else {
      onOpenChange(false);
    }
  };

  const handleResolveAll = async () => {
    const allResolutions = conflicts.map(conflict => {
      const resolution = resolutions[conflict.filePath] || { type: 'local' as const };
      return {
        filePath: conflict.filePath,
        resolution: resolution.type,
        manualContent: resolution.content
      };
    });

    await onResolveAll(allResolutions);
    onOpenChange(false);
  };

  const currentResolution = selectedConflict ? resolutions[selectedConflict.filePath] : null;
  const allResolved = conflicts.every(c => resolutions[c.filePath]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Resolve File Conflicts</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className={styles.container}>
            {/* Conflict List - Left Sidebar */}
            <div className={styles.conflictList}>
              <h3 className={styles.sectionTitle}>
                Conflicts ({conflicts.length})
              </h3>
              {conflicts.map(conflict => {
                const resolution = resolutions[conflict.filePath];
                const isSelected = selectedConflict?.filePath === conflict.filePath;
                
                return (
                  <div
                    key={conflict.filePath}
                    onClick={() => handleSelectConflict(conflict)}
                    className={`${styles.conflictItem} ${isSelected ? styles.conflictItemSelected : ''}`}
                  >
                    <div className={styles.conflictPath}>
                      {conflict.filePath}
                    </div>
                    <div className={styles.conflictStatus}>
                      {resolution ? (
                        <span className={styles.statusResolved}>
                          ✓ {resolution.type}
                        </span>
                      ) : (
                        <span className={styles.statusPending}>
                          ⚠ Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Content Area */}
            {selectedConflict && (
              <div className={styles.mainContent}>
                <div className={styles.conflictHeader}>
                  <h3 className={styles.conflictTitle}>
                    {selectedConflict.filePath}
                  </h3>
                  <div className={styles.conflictMeta}>
                    <span>Local: {new Date(selectedConflict.localModified).toLocaleString()}</span>
                    <span>Remote: {new Date(selectedConflict.remoteModified).toLocaleString()}</span>
                  </div>
                </div>

                {/* Resolution Options */}
                <div className={styles.resolutionOptions}>
                  <label className={styles.resolutionOption}>
                    <input
                      type="radio"
                      name="resolution"
                      value="local"
                      checked={currentResolution?.type === 'local'}
                      onChange={() => handleResolutionChange('local')}
                    />
                    <span>Keep Local Version</span>
                  </label>
                  <label className={styles.resolutionOption}>
                    <input
                      type="radio"
                      name="resolution"
                      value="remote"
                      checked={currentResolution?.type === 'remote'}
                      onChange={() => handleResolutionChange('remote')}
                    />
                    <span>Use Remote Version</span>
                  </label>
                  <label className={styles.resolutionOption}>
                    <input
                      type="radio"
                      name="resolution"
                      value="manual"
                      checked={currentResolution?.type === 'manual'}
                      onChange={() => handleResolutionChange('manual')}
                    />
                    <span>Manual Merge</span>
                  </label>
                </div>

                {/* Content Editor */}
                <div className={styles.contentEditor}>
                  <div className={styles.editorHeader}>
                    <span>Content Preview</span>
                    {currentResolution?.type === 'manual' && (
                      <span className={styles.editableLabel}>✏️ Editable</span>
                    )}
                  </div>
                  <textarea
                    className={styles.contentTextarea}
                    value={manualContent}
                    onChange={(e) => handleManualContentChange(e.target.value)}
                    readOnly={currentResolution?.type !== 'manual'}
                    placeholder="Select a resolution option to see content"
                  />
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <div className={styles.dialogActions}>
            <button
              onClick={() => onOpenChange(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            
            {selectedConflict && (
              <button
                onClick={handleResolveSelected}
                disabled={!currentResolution}
                className={styles.resolveButton}
              >
                Resolve This File
              </button>
            )}
            
            <button
              onClick={handleResolveAll}
              disabled={!allResolved}
              className={styles.resolveAllButton}
            >
              Resolve All ({Object.keys(resolutions).length}/{conflicts.length})
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}