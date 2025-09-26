import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { SiteConfig, GitOperationResult } from './types.js';

/**
 * Git交互管理器
 * 负责处理所有与Git仓库的交互操作
 */
export class GitManager {
  private gitInstances: Map<string, SimpleGit> = new Map();

  /**
   * 获取指定站点的Git实例
   */
  private getGitInstance(siteConfig: SiteConfig): SimpleGit {
    const { id, localPath } = siteConfig;
    
    if (!this.gitInstances.has(id)) {
      const git = simpleGit(localPath);
      this.gitInstances.set(id, git);
    }
    
    return this.gitInstances.get(id)!;
  }

  /**
   * 初始化仓库：如果本地不存在则克隆，存在则拉取最新代码
   */
  async initializeRepository(siteConfig: SiteConfig): Promise<GitOperationResult> {
    const { githubRepositoryUrl, localPath, githubPat } = siteConfig;
    
    try {
      // 检查本地路径是否存在
      const exists = await this.checkLocalRepoExists(localPath);
      
      if (!exists) {
        // 克隆仓库
        await this.cloneRepository(siteConfig);
      } else {
        // 确保仓库是干净的，然后拉取最新代码
        await this.ensureCleanAndPull(siteConfig);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 克隆仓库
   */
  async cloneRepository(siteConfig: SiteConfig): Promise<GitOperationResult> {
    const { githubRepositoryUrl, localPath, githubPat } = siteConfig;
    
    try {
      // 确保父目录存在
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // 构建带认证的URL
      const authenticatedUrl = this.buildAuthenticatedUrl(githubRepositoryUrl, githubPat);
      
      // 克隆仓库
      const git = simpleGit();
      await git.clone(authenticatedUrl, localPath, ['--branch', 'main']);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '克隆仓库失败'
      };
    }
  }

  /**
   * 确保仓库状态干净并拉取最新代码
   */
  async ensureCleanAndPull(siteConfig: SiteConfig): Promise<GitOperationResult> {
    const git = this.getGitInstance(siteConfig);
    
    try {
      // 检查仓库状态
      const status = await git.status();
      
      // 如果有未提交的更改，暂存它们
      if (!status.isClean()) {
        await git.add('.');
        await git.stash(['push', '-m', `Auto-stash before pull at ${new Date().toISOString()}`]);
      }
      
      // 拉取最新代码
      const pullResult = await git.pull('origin', 'main');
      
      return {
        success: true,
        message: `成功拉取最新代码: ${pullResult.summary.changes} 个文件更改`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '拉取代码失败'
      };
    }
  }

  /**
   * 提交并推送更改
   */
  async commitAndPush(
    siteConfig: SiteConfig, 
    filePaths: string[], 
    commitMessage: string,
    author?: { name: string; email: string }
  ): Promise<GitOperationResult> {
    const git = this.getGitInstance(siteConfig);
    
    try {
      // 设置作者信息（如果提供）
      if (author) {
        await git.addConfig('user.name', author.name);
        await git.addConfig('user.email', author.email);
      }
      
      // 添加指定文件到暂存区
      for (const filePath of filePaths) {
        await git.add(filePath);
      }
      
      // 提交更改
      const commitResult = await git.commit(commitMessage);
      
      // 推送到远程仓库
      const authenticatedUrl = this.buildAuthenticatedUrl(
        siteConfig.githubRepositoryUrl, 
        siteConfig.githubPat
      );
      
      await git.addRemote('auth-origin', authenticatedUrl).catch(() => {
        // 如果远程仓库已存在，忽略错误
      });
      
      await git.push('auth-origin', 'main');
      
      return {
        success: true,
        hash: commitResult.commit,
        message: `成功提交并推送: ${commitResult.summary.changes} 个文件更改`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交推送失败'
      };
    }
  }

  /**
   * 获取仓库状态
   */
  async getRepositoryStatus(siteConfig: SiteConfig) {
    const git = this.getGitInstance(siteConfig);
    
    try {
      const status = await git.status();
      const log = await git.log(['--oneline', '-10']); // 最近10个提交
      
      return {
        success: true,
        data: {
          isClean: status.isClean(),
          ahead: status.ahead,
          behind: status.behind,
          modified: status.modified,
          created: status.created,
          deleted: status.deleted,
          recentCommits: log.all.map(commit => ({
            hash: commit.hash,
            message: commit.message,
            date: commit.date,
            author: commit.author_name
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取仓库状态失败'
      };
    }
  }

  /**
   * 检查本地仓库是否存在
   */
  private async checkLocalRepoExists(localPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(localPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 构建带认证信息的Git URL
   */
  private buildAuthenticatedUrl(repoUrl: string, pat: string): string {
    // 处理不同格式的GitHub URL
    let cleanUrl = repoUrl;
    
    // 移除现有的协议
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    cleanUrl = cleanUrl.replace(/^git@github\.com:/, '');
    
    // 确保以.git结尾
    if (!cleanUrl.endsWith('.git')) {
      cleanUrl += '.git';
    }
    
    // 构建带PAT的HTTPS URL
    return `https://${pat}@github.com/${cleanUrl}`;
  }

  /**
   * 清理Git实例缓存
   */
  clearInstance(siteId: string): void {
    this.gitInstances.delete(siteId);
  }

  /**
   * 清理所有Git实例缓存
   */
  clearAllInstances(): void {
    this.gitInstances.clear();
  }
}

// 导出单例实例
export const gitManager = new GitManager();