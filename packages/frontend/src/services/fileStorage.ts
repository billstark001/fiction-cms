import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface FileContentDB extends DBSchema {
  fileContent: {
    key: string; // siteId:filePath
    value: {
      id: string;
      siteId: string;
      filePath: string;
      content: string;
      lastModified: string;
      localModified: string;
      isDirty: boolean;
      remoteLastModified?: string;
    };
    indexes: { 'by-siteId': string; 'by-filePath': string };
  };
  editHistory: {
    key: string; // siteId:filePath:timestamp
    value: {
      id: string;
      siteId: string;
      filePath: string;
      content: string;
      timestamp: string;
      action: 'save' | 'restore';
    };
    indexes: { 'by-siteId-filePath': [string, string] };
  };
  siteState: {
    key: string; // siteId
    value: {
      siteId: string;
      openedFiles: string[];
      selectedFile: string | null;
      lastAccessed: string;
      gitPullTimestamp?: string;
      remoteState: Record<string, string>; // filePath -> lastModified
    };
  };
}

class FileStorageService {
  private db: IDBPDatabase<FileContentDB> | null = null;
  private dbName = 'fiction-cms-file-storage';
  private dbVersion = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<FileContentDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // File content store
        const fileStore = db.createObjectStore('fileContent', {
          keyPath: 'id'
        });
        fileStore.createIndex('by-siteId', 'siteId');
        fileStore.createIndex('by-filePath', 'filePath');

        // Edit history store
        const historyStore = db.createObjectStore('editHistory', {
          keyPath: 'id'
        });
        historyStore.createIndex('by-siteId-filePath', ['siteId', 'filePath']);

        // Site state store
        db.createObjectStore('siteState', {
          keyPath: 'siteId'
        });
      }
    });
  }

  private ensureDb(): IDBPDatabase<FileContentDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  private createFileKey(siteId: string, filePath: string): string {
    return `${siteId}:${filePath}`;
  }

  // File content operations
  async saveFileContent(
    siteId: string,
    filePath: string,
    content: string,
    remoteLastModified?: string
  ): Promise<void> {
    const db = this.ensureDb();
    const id = this.createFileKey(siteId, filePath);
    const now = new Date().toISOString();

    const existing = await db.get('fileContent', id);
    
    await db.put('fileContent', {
      id,
      siteId,
      filePath,
      content,
      lastModified: existing?.lastModified || now,
      localModified: now,
      isDirty: true,
      remoteLastModified
    });

    // Save to edit history
    await this.saveEditHistory(siteId, filePath, content, 'save');
  }

  async getFileContent(siteId: string, filePath: string) {
    const db = this.ensureDb();
    const id = this.createFileKey(siteId, filePath);
    return await db.get('fileContent', id);
  }

  async getAllFilesForSite(siteId: string) {
    const db = this.ensureDb();
    return await db.getAllFromIndex('fileContent', 'by-siteId', siteId);
  }

  async markFileAsClean(siteId: string, filePath: string, remoteLastModified: string): Promise<void> {
    const db = this.ensureDb();
    const id = this.createFileKey(siteId, filePath);
    const existing = await db.get('fileContent', id);
    
    if (existing) {
      await db.put('fileContent', {
        ...existing,
        isDirty: false,
        remoteLastModified,
        lastModified: remoteLastModified
      });
    }
  }

  async deleteFileContent(siteId: string, filePath: string): Promise<void> {
    const db = this.ensureDb();
    const id = this.createFileKey(siteId, filePath);
    await db.delete('fileContent', id);
  }

  // Edit history operations
  private async saveEditHistory(
    siteId: string,
    filePath: string,
    content: string,
    action: 'save' | 'restore'
  ): Promise<void> {
    const db = this.ensureDb();
    const timestamp = new Date().toISOString();
    const id = `${siteId}:${filePath}:${timestamp}`;

    await db.put('editHistory', {
      id,
      siteId,
      filePath,
      content,
      timestamp,
      action
    });

    // Keep only last 50 history entries per file
    await this.cleanupHistory(siteId, filePath);
  }

  async getEditHistory(siteId: string, filePath: string, limit = 20) {
    const db = this.ensureDb();
    const allHistory = await db.getAllFromIndex('editHistory', 'by-siteId-filePath', [siteId, filePath]);
    
    // Sort by timestamp descending and limit
    return allHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private async cleanupHistory(siteId: string, filePath: string): Promise<void> {
    const db = this.ensureDb();
    const history = await this.getEditHistory(siteId, filePath, 50);
    
    if (history.length > 50) {
      const toDelete = history.slice(50);
      const tx = db.transaction('editHistory', 'readwrite');
      
      await Promise.all([
        ...toDelete.map(item => tx.store.delete(item.id)),
        tx.done
      ]);
    }
  }

  // Site state operations
  async saveSiteState(siteId: string, state: {
    openedFiles: string[];
    selectedFile: string | null;
    remoteState?: Record<string, string>;
  }): Promise<void> {
    const db = this.ensureDb();
    const existing = await db.get('siteState', siteId);

    await db.put('siteState', {
      siteId,
      openedFiles: state.openedFiles,
      selectedFile: state.selectedFile,
      lastAccessed: new Date().toISOString(),
      gitPullTimestamp: existing?.gitPullTimestamp,
      remoteState: state.remoteState || existing?.remoteState || {}
    });
  }

  async getSiteState(siteId: string) {
    const db = this.ensureDb();
    return await db.get('siteState', siteId);
  }

  async updateGitPullTimestamp(siteId: string): Promise<void> {
    const db = this.ensureDb();
    const existing = await db.get('siteState', siteId);
    
    if (existing) {
      await db.put('siteState', {
        ...existing,
        gitPullTimestamp: new Date().toISOString()
      });
    }
  }

  async getAllOpenedSites() {
    const db = this.ensureDb();
    const allSites = await db.getAll('siteState');
    
    return allSites
      .filter(site => site.openedFiles.length > 0)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
  }

  // File conflict detection
  async detectConflicts(siteId: string, remoteFiles: Record<string, string>): Promise<{
    conflicts: Array<{
      filePath: string;
      localModified: string;
      remoteModified: string;
      content: string;
    }>;
    deletedLocally: Array<{
      filePath: string;
      remoteModified: string;
    }>;
  }> {
    const localFiles = await this.getAllFilesForSite(siteId);
    const localFilePaths = new Set(localFiles.map(f => f.filePath));
    
    const conflicts: Array<{
      filePath: string;
      localModified: string;
      remoteModified: string;
      content: string;
    }> = [];

    const deletedLocally: Array<{
      filePath: string;
      remoteModified: string;
    }> = [];

    // Check for conflicts in existing local files
    for (const localFile of localFiles) {
      const remoteModified = remoteFiles[localFile.filePath];
      
      if (remoteModified && localFile.isDirty && 
          localFile.remoteLastModified && 
          remoteModified !== localFile.remoteLastModified) {
        conflicts.push({
          filePath: localFile.filePath,
          localModified: localFile.localModified,
          remoteModified,
          content: localFile.content
        });
      }
    }

    // Check for files that exist remotely but not locally (possible deletions)
    for (const [filePath, remoteModified] of Object.entries(remoteFiles)) {
      if (!localFilePaths.has(filePath)) {
        // Check if we had this file locally before
        const siteState = await this.getSiteState(siteId);
        if (siteState?.remoteState[filePath]) {
          deletedLocally.push({
            filePath,
            remoteModified
          });
        }
      }
    }

    return { conflicts, deletedLocally };
  }

  // Cleanup operations
  async clearSiteData(siteId: string): Promise<void> {
    const db = this.ensureDb();
    const tx = db.transaction(['fileContent', 'editHistory', 'siteState'], 'readwrite');

    const fileContentStore = tx.objectStore('fileContent');
    const historyStore = tx.objectStore('editHistory');
    const siteStateStore = tx.objectStore('siteState');

    // Delete all file content for the site
    const files = await fileContentStore.index('by-siteId').getAllKeys(siteId);
    await Promise.all(files.map(key => fileContentStore.delete(key)));

    // Delete all history for the site
    const history = await historyStore.index('by-siteId-filePath').getAll();
    const siteHistory = history.filter(h => h.siteId === siteId);
    await Promise.all(siteHistory.map(h => historyStore.delete(h.id)));

    // Delete site state
    await siteStateStore.delete(siteId);
    
    await tx.done;
  }
}

export const fileStorageService = new FileStorageService();