# Fiction CMS

一个现代化的、基于 Git 的静态站点内容管理系统，集成 GitHub Pages 自动化部署。

[English Version](./README.md) | [文档中心](./docs/README_zh.md)

## 概述

Fiction CMS 是一个专为管理托管在 GitHub 上的多个静态站点项目而设计的综合内容管理解决方案。它为非技术用户提供友好的界面来编辑 Git 仓库中的 Markdown、JSON 和 SQLite 文件，同时保持完整的版本控制和自动化部署能力。

### 核心特性

- **Git 原生工作流**: 直接集成 GitHub 仓库
- **多站点管理**: 从一个控制面板管理多个静态站点
- **丰富的内容编辑**: Markdown 编辑器带实时预览，JSON 编辑器带验证，SQLite 数据库管理
- **用户管理**: 基于角色的访问控制和身份认证
- **自动化部署**: GitHub Pages 集成与构建自动化
- **文件管理**: 资源处理和文件组织工具
- **实时协作**: 基于 Git 的版本控制和冲突解决

## 架构

Fiction CMS 遵循现代全栈架构：

- **前端**: React + TypeScript + Vite，集成 Monaco Editor
- **后端**: Hono.js API 服务器，使用 TypeScript
- **数据库**: SQLite 配合 Drizzle ORM 进行用户管理
- **身份认证**: PASETO v4 令牌，基于角色的权限控制
- **内容存储**: Git 仓库作为数据源头
- **部署**: GitHub Pages 自动化构建

## 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm
- Git
- GitHub 个人访问令牌（用于仓库管理）

### 安装

1. **克隆仓库**

```bash
git clone https://github.com/billstark001/fiction-cms.git
cd fiction-cms
```

2. **安装依赖**

```bash
pnpm install
# 或 npm install
```

3. **配置环境变量**

```bash
# 后端配置（在 packages/backend/ 目录下创建 .env 文件）
DATABASE_PATH=./fiction-cms.db
PASETO_SECRET_KEY=your-32-character-secret-key-here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 添加 GitHub PAT 用于仓库访问
GITHUB_PAT=your_github_personal_access_token
```

4. **启动开发服务器**

```bash
pnpm dev
```

这将同时启动后端 API 服务器（<http://localhost:3001）和前端开发服务器（http://localhost:3000）。>

### 默认访问

- **管理员用户名**: `admin`
- **管理员密码**: `admin123`

> ⚠️ **安全提示**: 在生产环境中首次登录后请立即更改默认凭据。

## 项目结构

```
fiction-cms/
├── packages/
│   ├── backend/           # Hono.js API 服务器
│   │   ├── src/
│   │   │   ├── routes/    # API 端点
│   │   │   ├── engine/    # CMS 核心引擎
│   │   │   ├── auth/      # 认证系统
│   │   │   └── db/        # 数据库模型
│   │   └── README.md      # 后端文档
│   └── frontend/          # React 前端
│       ├── src/
│       │   ├── components/ # UI 组件
│       │   ├── pages/     # 应用页面
│       │   ├── hooks/     # 自定义 React 钩子
│       │   └── utils/     # 工具函数
│       └── README.md      # 前端文档
├── docs/                  # 综合文档
└── README.md             # 本文件
```

## 文档

在 [docs](./docs/) 目录中提供了完整的文档：

### 用户文档

- **[用户指南](./docs/user-guide_zh.md)** - 内容管理员完整指南
- **[站点管理](./docs/site-management_zh.md)** - 多站点管理
- **[内容编辑](./docs/content-editing_zh.md)** - 处理不同文件类型

### 维护者和开发者文档

- **[架构概览](./docs/architecture_zh.md)** - 系统架构和设计决策
- **[API 文档](./docs/api_zh.md)** - 完整的 API 参考
- **[开发环境设置](./docs/development_zh.md)** - 设置开发环境
- **[部署指南](./docs/deployment_zh.md)** - 生产环境部署说明

### 技术参考

- **[引擎文档](./packages/backend/src/engine/README.md)** - CMS 引擎集成指南
- **[配置指南](./docs/configuration_zh.md)** - 环境和站点配置
- **[安全指南](./docs/security_zh.md)** - 安全注意事项和最佳实践

## 开发

### 开发工作流

1. **开发服务器**

```bash
pnpm dev              # 启动前端和后端
pnpm --filter backend dev   # 仅后端
pnpm --filter frontend dev  # 仅前端
```

2. **生产构建**

```bash
pnpm build            # 构建所有包
pnpm --filter backend build # 仅后端
pnpm --filter frontend build # 仅前端
```

3. **代码质量**

```bash
pnpm lint             # 检查所有包
pnpm type-check       # TypeScript 类型检查
```

### 贡献

我们欢迎贡献！请查看我们的[贡献指南](./docs/CONTRIBUTING_zh.md)了解以下详情：

- 开发工作流
- 代码标准
- 测试要求
- Pull Request 流程

## 部署

Fiction CMS 可以部署到各种平台：

- **Docker**: 提供 Dockerfile 的容器化部署
- **传统 VPS**: 使用 PM2 或 systemd 直接部署
- **云平台**: Heroku、Railway、DigitalOcean App Platform

详细说明请参见[部署指南](./docs/deployment_zh.md)。

## 使用场景

Fiction CMS 适用于：

- **文档站点**: 管理多个项目的技术文档
- **博客网络**: 运行多个博客，共享用户管理
- **作品集网站**: 管理设计师/开发者作品集，带数据库驱动内容
- **小型企业网站**: 代理机构的多站点管理
- **教育内容**: 课程材料和教育资源

## 技术栈

### 前端

- **React 18** - 现代 React 与钩子
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速构建工具和开发服务器
- **Vanilla Extract** - 类型安全的 CSS-in-JS
- **Monaco Editor** - VS Code 风格的编辑体验

### 后端

- **Hono.js** - 快速、轻量级的 Web 框架
- **TypeScript** - 端到端类型安全
- **Drizzle ORM** - 类型安全的数据库操作
- **SQLite** - 用于用户管理的嵌入式数据库
- **PASETO** - 安全的基于令牌的身份验证

### DevOps 和工具

- **pnpm** - 快速、节省磁盘空间的包管理器
- **ESLint** - 代码检查和格式化
- **Prettier** - 代码格式化
- **GitHub Actions** - CI/CD 工作流

## 许可证

本项目采用 MIT 许可证 - 详情请参见 [LICENSE](./LICENSE) 文件。

## 支持和社区

- **问题报告**: [GitHub Issues](https://github.com/billstark001/fiction-cms/issues)
- **讨论**: [GitHub Discussions](https://github.com/billstark001/fiction-cms/discussions)
- **文档**: [项目文档](./docs/)

## 路线图

即将推出的功能和改进：

- [ ] **增强数据库管理**: 可视化 SQLite 表格编辑器
- [ ] **文件上传系统**: 拖拽式资源管理
- [ ] **模板系统**: 站点模板和内容脚手架
- [ ] **插件架构**: 可扩展插件系统
- [ ] **实时协作**: 多用户编辑与冲突解决
- [ ] **高级搜索**: 跨所有管理站点的全文搜索
- [ ] **部署监控**: 构建状态和部署跟踪
- [ ] **备份和恢复**: 自动化备份解决方案

---

*由 [Bill Toshiaki Stark](https://github.com/billstark001) 用 ❤️ 构建*
