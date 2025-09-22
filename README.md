# 🚀 Node.js 前端项目

> 一个现代化的 Node.js/前端项目模板，包含完整的开发工具链和最佳实践。

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Cauchemar--Z-black?style=flat-square&logo=github)](https://github.com/Cauchemar-Z)

## 📋 目录

- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [开发指南](#-开发指南)
- [部署说明](#-部署说明)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## 🚀 快速开始

### 前置要求

- **Node.js** 18.0+ 
- **npm** 8.0+ 或 **yarn** 1.22+
- **Git** 2.30+

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/Cauchemar-Z/my-first-git-project.git
cd my-first-git-project

# 2. 安装依赖
npm install
# 或使用 yarn
yarn install

# 3. 启动开发服务器
npm run dev
# 或使用 yarn
yarn dev
```

### 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

## 📁 项目结构

```
my-first-git-project/
├── src/                    # 📁 源代码目录
│   ├── components/         # 🧩 组件
│   ├── pages/             # 📄 页面
│   ├── styles/            # 🎨 样式文件
│   ├── utils/              # 🔧 工具函数
│   └── types/              # 📝 TypeScript 类型定义
├── public/                 # 🌐 静态资源
├── docs/                   # 📚 文档
├── tests/                  # 🧪 测试文件
├── .github/                # 🤖 GitHub 工作流
├── .editorconfig           # ⚙️ 编辑器配置
├── .gitignore              # 🚫 Git 忽略文件
├── package.json            # 📦 项目配置
├── tsconfig.json           # 🔧 TypeScript 配置
└── README.md               # 📖 项目说明
```

## 🛠️ 开发指南

### 可用脚本

```bash
# 开发模式
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复代码问题
npm run type-check   # TypeScript 类型检查

# 测试
npm run test         # 运行测试
npm run test:watch   # 监听模式测试
npm run test:coverage # 测试覆盖率报告
```

### 代码规范

- 使用 **ESLint** 进行代码检查
- 使用 **Prettier** 进行代码格式化
- 使用 **TypeScript** 进行类型检查
- 遵循 **Conventional Commits** 提交规范

### 分支策略

- `main` - 主分支，保持稳定
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

## 🚀 部署说明

### 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 部署到生产环境

```bash
# 使用 Docker 部署
docker build -t my-app .
docker run -p 3000:3000 my-app

# 或使用 PM2 部署
pm2 start ecosystem.config.js
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. **Fork** 这个项目
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 **Pull Request**

### 贡献类型

- 🐛 **Bug 修复** - 修复已知问题
- ✨ **新功能** - 添加新功能
- 📚 **文档** - 改进文档
- 🎨 **样式** - 代码格式调整
- ♻️ **重构** - 代码重构
- ⚡ **性能** - 性能优化
- 🧪 **测试** - 添加或修复测试

## 📊 项目统计

- **创建时间**: 2025-09-22
- **主要语言**: TypeScript, JavaScript
- **框架**: Node.js
- **开源协议**: MIT

## 📞 联系方式

- **GitHub**: [@Cauchemar-Z](https://github.com/Cauchemar-Z)
- **项目链接**: [my-first-git-project](https://github.com/Cauchemar-Z/my-first-git-project)
- **问题反馈**: [Issues](https://github.com/Cauchemar-Z/my-first-git-project/issues)

## 📜 许可证

本项目基于 [MIT许可证](LICENSE) 开源。

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**

*这个项目是学习现代前端开发的实践项目，欢迎提出建议和贡献代码！*

</div>
