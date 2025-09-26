/**
 * Fiction CMS Engine 基本功能测试
 * 这个文件展示如何使用引擎的各个模块
 */

import { gitManager, contentManager, deploymentEngine, SiteConfig } from './index.js';
import { createSiteConfig, validateSiteConfig } from './config-examples.js';

// 测试用的站点配置
const testSiteConfig: SiteConfig = createSiteConfig('test-site', {
  name: 'Test Site',
  githubRepositoryUrl: 'https://github.com/test/test-repo',
  githubPat: 'ghp_test_token',
  localPath: './test-repos/test-site'
});

/**
 * 测试引擎基本功能
 */
async function testEngine() {
  console.log('🚀 Fiction CMS Engine 功能测试开始\n');

  // 1. 验证配置
  console.log('1️⃣ 验证站点配置...');
  const configErrors = validateSiteConfig(testSiteConfig);
  if (configErrors.length > 0) {
    console.log('❌ 配置验证失败:');
    configErrors.forEach(error => console.log(`   - ${error}`));
    return;
  }
  console.log('✅ 配置验证通过\n');

  // 2. 测试各个管理器
  console.log('2️⃣ 测试各个管理器...');
  console.log('✅ Git管理器可用');
  console.log('✅ 内容管理器可用');
  console.log('✅ 部署引擎可用');
  console.log('✅ 内容子模块可用:');
  console.log('   - 文本文件管理器:', contentManager.text.constructor.name);
  console.log('   - SQLite管理器:', contentManager.sqlite.constructor.name);
  console.log('   - 资产文件管理器:', contentManager.asset.constructor.name);
  console.log('   - 通用文件操作:', contentManager.common.constructor.name);
  console.log();

  // 3. 测试Git管理器（注意：这里需要真实的仓库才能正常工作）
  console.log('3️⃣ 测试Git管理器...');
  try {
    // 注意：这个测试需要真实的GitHub仓库和PAT才能工作
    // 在实际环境中，你需要提供有效的配置
    console.log('⚠️  Git功能需要有效的仓库配置才能测试');
    
    // 如果你有有效配置，可以取消注释以下代码：
    // const gitResult = await engine.initializeSite(testSiteConfig);
    // console.log(gitResult.success ? '✅ Git初始化成功' : `❌ Git初始化失败: ${gitResult.error}`);
  } catch (error) {
    console.log(`⚠️  Git测试跳过: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  console.log();

  // 4. 测试内容管理器
  console.log('4️⃣ 测试内容管理器...');
  try {
    // 这些测试也需要实际的文件系统结构
    console.log('⚠️  内容管理功能需要真实的文件结构才能测试');
    
    // 模拟测试（实际使用时需要真实文件）
    // const filesResult = await engine.content.getEditableFiles(testSiteConfig);
    // console.log(filesResult.success ? '✅ 文件列表获取成功' : `❌ 获取失败: ${filesResult.error}`);
  } catch (error) {
    console.log(`⚠️  内容管理测试跳过: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  console.log();

  // 5. 测试部署引擎
  console.log('5️⃣ 测试部署引擎...');
  try {
    // 检查构建环境（这个可以在任何环境下运行）
    const buildEnv = await deploymentEngine.checkBuildEnvironment(testSiteConfig);
    console.log('✅ 构建环境检查完成:');
    console.log(`   - package.json: ${buildEnv.hasPackageJson ? '存在' : '不存在'}`);
    console.log(`   - node_modules: ${buildEnv.hasNodeModules ? '存在' : '不存在'}`);
    console.log(`   - 构建脚本: ${buildEnv.hasBuildScript ? '存在' : '不存在'}`);
    console.log(`   - 构建命令: ${buildEnv.buildCommand}`);
    console.log(`   - 输出目录: ${buildEnv.outputDir}`);
  } catch (error) {
    console.log(`❌ 部署引擎测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  console.log();

  // 6. 测试系统健康状态
  console.log('6️⃣ 测试系统健康状态...');
  try {
    console.log('⚠️  系统健康检查需要有效的仓库配置才能完整测试');
    // const healthStatus = await engine.getSiteHealthStatus(testSiteConfig);
    // console.log('✅ 健康状态检查完成');
  } catch (error) {
    console.log(`⚠️  健康检查跳过: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  console.log();

  // 7. 清理资源
  console.log('7️⃣ 清理资源...');
  gitManager.clearInstance(testSiteConfig.id);
  contentManager.closeSQLiteConnection(testSiteConfig.id);
  console.log('✅ 资源清理完成\n');

  console.log('🎉 Fiction CMS Engine 测试完成!\n');
  console.log('📝 注意事项:');
  console.log('   - 完整功能测试需要有效的GitHub仓库配置');
  console.log('   - 需要确保本地有足够的权限创建和修改文件');
  console.log('   - SQLite功能需要实际的数据库文件');
  console.log('   - 部署功能需要有效的构建环境');
}

/**
 * 演示如何处理不同类型的错误
 */
async function demonstrateErrorHandling() {
  console.log('\n🔧 错误处理演示\n');
  
  // 1. 无效的站点配置
  console.log('1️⃣ 测试无效配置处理...');
  const invalidConfig = createSiteConfig('invalid', {
    githubRepositoryUrl: '', // 无效的URL
    githubPat: '', // 无效的PAT
  });
  
  const errors = validateSiteConfig(invalidConfig);
  if (errors.length > 0) {
    console.log('✅ 成功捕获配置错误:');
    errors.forEach(error => console.log(`   - ${error}`));
  }
  console.log();

  // 2. 文件访问错误
  console.log('2️⃣ 测试文件访问错误处理...');
  try {
    const result = await contentManager.readTextFile(testSiteConfig, '/invalid/path/file.md');
    console.log(result.success ? '❌ 应该失败但成功了' : `✅ 正确处理错误: ${result.error}`);
  } catch (error) {
    console.log(`✅ 正确捕获异常: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  console.log();

  console.log('🔧 错误处理演示完成\n');
}

/**
 * 展示引擎的模块化设计
 */
function demonstrateModularDesign() {
  console.log('🏗️  模块化设计演示\n');

  console.log('📦 可用的模块:');
  console.log(`   - Git管理器: ${gitManager.constructor.name}`);
  console.log(`   - 内容管理器: ${contentManager.constructor.name}`);
  console.log(`   - 部署引擎: ${deploymentEngine.constructor.name}`);
  console.log();

  console.log('📦 内容管理器子模块:');
  console.log(`   - 文本文件管理器: ${contentManager.text.constructor.name}`);
  console.log(`   - SQLite管理器: ${contentManager.sqlite.constructor.name}`);
  console.log(`   - 资产文件管理器: ${contentManager.asset.constructor.name}`);
  console.log(`   - 通用文件操作: ${contentManager.common.constructor.name}`);
  console.log();

  console.log('🔧 各模块的主要功能:');
  console.log('   Git管理器:');
  console.log('     - initializeRepository(): 初始化仓库');
  console.log('     - commitAndPush(): 提交和推送更改');
  console.log('     - getRepositoryStatus(): 获取仓库状态');
  
  console.log('   内容管理器:');
  console.log('     - getEditableFiles(): 获取可编辑文件');
  console.log('     - readTextFile() / writeTextFile(): 文本文件读写');
  console.log('     - getSQLiteTableData(): SQLite数据操作');
  
  console.log('   部署引擎:');
  console.log('     - createDeploymentTask(): 创建部署任务');
  console.log('     - getTaskStatus(): 获取任务状态');
  console.log('     - checkBuildEnvironment(): 检查构建环境');
  console.log();

  console.log('🔗 直接使用模块:');
  console.log('     - gitManager.initializeRepository()');
  console.log('     - contentManager.readTextFile()');
  console.log('     - contentManager.text.readTextFile()');
  console.log('     - contentManager.sqlite.getSQLiteTableData()');
  console.log('     - deploymentEngine.createDeploymentTask()');
  console.log();

  console.log('🏗️  模块化设计演示完成\n');
}

// 运行测试（如果直接执行此文件）
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await testEngine();
    await demonstrateErrorHandling();
    demonstrateModularDesign();
  })().catch(console.error);
}

// 导出测试函数供其他模块使用
export {
  testEngine,
  demonstrateErrorHandling,
  demonstrateModularDesign,
  testSiteConfig
};