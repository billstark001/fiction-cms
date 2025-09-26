import { spawn } from 'child_process';
import * as ghPages from 'gh-pages';
import path from 'path';
import fs from 'fs/promises';
import { 
  SiteConfig, 
  DeploymentTask, 
  DeploymentLog, 
  DeploymentStatus,
  BuildResult,
  DeployResult 
} from './types.js';
import { gitManager } from './git-manager.js';

/**
 * 部署引擎
 * 负责处理构建和部署流程
 */
export class DeploymentEngine {
  private activeTasks: Map<string, DeploymentTask> = new Map();

  /**
   * 创建并启动部署任务
   */
  async createDeploymentTask(siteConfig: SiteConfig, triggeredBy?: string): Promise<string> {
    const taskId = this.generateTaskId();
    
    const task: DeploymentTask = {
      id: taskId,
      siteId: siteConfig.id,
      status: 'pending',
      createdAt: new Date(),
      logs: []
    };

    this.activeTasks.set(taskId, task);

    // 添加初始日志
    this.addLog(taskId, 'info', `部署任务已创建${triggeredBy ? ` (触发者: ${triggeredBy})` : ''}`, 'deploy');

    // 异步执行部署流程
    this.executeDeployment(taskId, siteConfig).catch(error => {
      this.updateTaskStatus(taskId, 'failed');
      this.addLog(taskId, 'error', `部署流程执行失败: ${error.message}`, 'deploy');
    });

    return taskId;
  }

  /**
   * 获取部署任务状态
   */
  getTaskStatus(taskId: string): DeploymentTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): DeploymentTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 取消部署任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task) return false;

    if (['completed', 'failed'].includes(task.status)) {
      return false; // 已完成或失败的任务无法取消
    }

    this.updateTaskStatus(taskId, 'failed');
    this.addLog(taskId, 'warn', '部署任务已被取消', 'deploy');
    
    return true;
  }

  /**
   * 清理已完成的任务
   */
  cleanupCompletedTasks(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAge;
    let cleaned = 0;

    for (const [taskId, task] of this.activeTasks.entries()) {
      if (
        ['completed', 'failed'].includes(task.status) &&
        task.completedAt &&
        task.completedAt.getTime() < cutoffTime
      ) {
        this.activeTasks.delete(taskId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 执行完整的部署流程
   */
  private async executeDeployment(taskId: string, siteConfig: SiteConfig): Promise<void> {
    try {
      this.updateTaskStatus(taskId, 'pulling');
      this.addLog(taskId, 'info', '开始拉取最新代码...', 'git');

      // 1. 确保仓库是最新的
      const pullResult = await gitManager.ensureCleanAndPull(siteConfig);
      if (!pullResult.success) {
        throw new Error(`拉取代码失败: ${pullResult.error}`);
      }

      this.addLog(taskId, 'info', pullResult.message || '代码拉取成功', 'git');

      // 2. 执行构建
      this.updateTaskStatus(taskId, 'building');
      this.addLog(taskId, 'info', '开始构建项目...', 'build');

      const buildResult = await this.executeBuild(taskId, siteConfig);
      if (!buildResult.success) {
        throw new Error(`构建失败: ${buildResult.error}`);
      }

      this.addLog(taskId, 'info', `构建成功，耗时 ${buildResult.buildTime}ms`, 'build');

      // 3. 部署到 gh-pages
      this.updateTaskStatus(taskId, 'deploying');
      this.addLog(taskId, 'info', '开始部署到 GitHub Pages...', 'deploy');

      const deployResult = await this.deployToGitHubPages(taskId, siteConfig);
      if (!deployResult.success) {
        throw new Error(`部署失败: ${deployResult.error}`);
      }

      this.addLog(taskId, 'info', `部署成功，耗时 ${deployResult.deployTime}ms`, 'deploy');

      // 4. 完成
      this.updateTaskStatus(taskId, 'completed');
      this.addLog(taskId, 'info', '部署流程完成', 'deploy');

    } catch (error) {
      this.updateTaskStatus(taskId, 'failed');
      this.addLog(taskId, 'error', error instanceof Error ? error.message : '未知错误', 'deploy');
    }
  }

  /**
   * 执行项目构建
   */
  private async executeBuild(taskId: string, siteConfig: SiteConfig): Promise<BuildResult> {
    const { localPath, buildCommand = 'npm run build' } = siteConfig;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const logs: string[] = [];
      const [command, ...args] = buildCommand.split(' ');

      const buildProcess = spawn(command, args, {
        cwd: localPath,
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      // 捕获标准输出
      buildProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        logs.push(message);
        this.addLog(taskId, 'info', message.trim(), 'build');
      });

      // 捕获标准错误
      buildProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        logs.push(message);
        this.addLog(taskId, 'warn', message.trim(), 'build');
      });

      // 处理进程结束
      buildProcess.on('close', (code) => {
        const buildTime = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            success: true,
            buildTime,
            logs
          });
        } else {
          resolve({
            success: false,
            buildTime,
            logs,
            error: `构建进程退出，代码: ${code}`
          });
        }
      });

      // 处理进程错误
      buildProcess.on('error', (error) => {
        const buildTime = Date.now() - startTime;
        resolve({
          success: false,
          buildTime,
          logs,
          error: `启动构建进程失败: ${error.message}`
        });
      });
    });
  }

  /**
   * 部署到GitHub Pages
   */
  private async deployToGitHubPages(taskId: string, siteConfig: SiteConfig): Promise<DeployResult> {
    const { 
      localPath, 
      buildOutputDir = 'dist', 
      githubRepositoryUrl, 
      githubPat 
    } = siteConfig;
    
    const startTime = Date.now();
    const buildDirPath = path.join(localPath, buildOutputDir);

    try {
      // 检查构建输出目录是否存在
      try {
        await fs.access(buildDirPath);
      } catch {
        throw new Error(`构建输出目录不存在: ${buildOutputDir}`);
      }

      // 构建认证URL
      const authenticatedUrl = this.buildAuthenticatedUrl(githubRepositoryUrl, githubPat);

      // 使用gh-pages发布
      await ghPages.publish(buildDirPath, {
        branch: 'gh-pages',
        repo: authenticatedUrl,
        message: `Deploy at ${new Date().toISOString()}`,
        dotfiles: true,
        user: {
          name: 'Fiction CMS',
          email: 'fiction-cms@example.com'
        }
      });

      const deployTime = Date.now() - startTime;

      return {
        success: true,
        deployTime,
        logs: ['Successfully deployed to GitHub Pages']
      };

    } catch (error) {
      const deployTime = Date.now() - startTime;
      return {
        success: false,
        deployTime,
        logs: [],
        error: error instanceof Error ? error.message : '部署失败'
      };
    }
  }

  /**
   * 仅执行构建（不部署）
   */
  async buildOnly(siteConfig: SiteConfig): Promise<BuildResult> {
    const taskId = this.generateTaskId();
    
    // 创建临时任务用于日志记录
    const task: DeploymentTask = {
      id: taskId,
      siteId: siteConfig.id,
      status: 'building',
      createdAt: new Date(),
      logs: []
    };

    this.activeTasks.set(taskId, task);

    try {
      const result = await this.executeBuild(taskId, siteConfig);
      
      // 清理临时任务
      this.activeTasks.delete(taskId);
      
      return result;
    } catch (error) {
      this.activeTasks.delete(taskId);
      return {
        success: false,
        buildTime: 0,
        logs: [],
        error: error instanceof Error ? error.message : '构建失败'
      };
    }
  }

  /**
   * 检查构建环境
   */
  async checkBuildEnvironment(siteConfig: SiteConfig): Promise<{
    hasPackageJson: boolean;
    hasNodeModules: boolean;
    hasBuildScript: boolean;
    buildCommand: string;
    outputDir: string;
  }> {
    const { localPath, buildCommand = 'npm run build', buildOutputDir = 'dist' } = siteConfig;

    try {
      // 检查package.json
      const packageJsonPath = path.join(localPath, 'package.json');
      let hasPackageJson = false;
      let hasBuildScript = false;

      try {
        await fs.access(packageJsonPath);
        hasPackageJson = true;

        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        hasBuildScript = !!(packageJson.scripts && packageJson.scripts.build);
      } catch {
        // package.json不存在或格式错误
      }

      // 检查node_modules
      let hasNodeModules = false;
      try {
        await fs.access(path.join(localPath, 'node_modules'));
        hasNodeModules = true;
      } catch {
        // node_modules不存在
      }

      return {
        hasPackageJson,
        hasNodeModules,
        hasBuildScript,
        buildCommand,
        outputDir: buildOutputDir
      };
    } catch (error) {
      return {
        hasPackageJson: false,
        hasNodeModules: false,
        hasBuildScript: false,
        buildCommand,
        outputDir: buildOutputDir
      };
    }
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(taskId: string, status: DeploymentStatus): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = status;
      
      if (status === 'building' && !task.startedAt) {
        task.startedAt = new Date();
      }
      
      if (['completed', 'failed'].includes(status)) {
        task.completedAt = new Date();
      }
    }
  }

  /**
   * 添加日志
   */
  private addLog(
    taskId: string, 
    level: DeploymentLog['level'], 
    message: string, 
    source: DeploymentLog['source']
  ): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.logs.push({
        timestamp: new Date(),
        level,
        message,
        source
      });

      // 限制日志数量，避免内存泄漏
      if (task.logs.length > 1000) {
        task.logs = task.logs.slice(-500); // 保留最新500条
      }
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 构建带认证的Git URL
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
}

// 导出单例实例
export const deploymentEngine = new DeploymentEngine();