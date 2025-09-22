# 🎉 我的第一个 Git 项目

> 一个学习 Git 和 GitHub 的实践项目，包含完整的开发工作流程和最佳实践。

[![GitHub](https://img.shields.io/badge/GitHub-Cauchemar--Z-blue?style=flat-square&logo=github)](https://github.com/Cauchemar-Z)
[![Git](https://img.shields.io/badge/Git-2.48.1+-orange?style=flat-square&logo=git)](https://git-scm.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## 📋 目录

- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [学习目标](#-学习目标)
- [开发工作流程](#-开发工作流程)
- [贡献指南](#-贡献指南)
- [联系方式](#-联系方式)

## 🚀 快速开始

### 前置要求

- Git 2.48.1+
- 文本编辑器 (推荐 VS Code 或 Cursor)
- GitHub 账户

### 安装

```bash
# 克隆仓库
git clone https://github.com/Cauchemar-Z/my-first-git-project.git

# 进入项目目录
cd my-first-git-project

# 运行设置脚本
./scripts/setup.sh
```

## 📁 项目结构

```
my-first-git-project/
├── docs/                    # 📚 项目文档
│   ├── README.md           # 文档首页
│   ├── CHANGELOG.md        # 变更日志
│   └── CONTRIBUTING.md     # 贡献指南
├── scripts/                # 🔧 脚本文件
│   └── setup.sh           # 环境设置脚本
├── templates/              # 📝 模板文件
│   └── README_TEMPLATE.md  # README模板
├── config/                 # ⚙️ 配置文件
├── .editorconfig          # 编辑器配置
├── .gitattributes         # Git属性配置
├── .gitignore             # Git忽略文件
├── README.md              # 项目说明
└── .zshrc                 # Shell配置
```

## 📚 学习目标

- [x] 掌握 Git 基本命令
- [x] 理解分支概念和工作流
- [x] 学会使用 GitHub 协作功能
- [x] 建立标准化开发工作流程
- [x] 学习项目结构最佳实践
- [ ] 掌握 Pull Request 流程
- [ ] 学习代码审查流程
- [ ] 实践持续集成/部署

## 🔄 开发工作流程

### 分支策略

- `main`: 主分支，保持稳定
- `feature/*`: 功能开发分支
- `bugfix/*`: 问题修复分支
- `hotfix/*`: 紧急修复分支

### 提交规范

使用语义化提交信息：

```
类型(范围): 简短描述

详细描述（可选）

关闭的Issue（可选）
```

类型包括：`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 工作流程

1. **创建分支**: `git checkout -b feature/new-feature`
2. **开发功能**: 编写代码和测试
3. **提交更改**: `git commit -m "feat: add new feature"`
4. **推送分支**: `git push origin feature/new-feature`
5. **创建PR**: 在GitHub上创建Pull Request
6. **代码审查**: 团队成员审查代码
7. **合并分支**: 审查通过后合并到main
8. **删除分支**: 清理已合并的分支

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [贡献指南](docs/CONTRIBUTING.md) 了解详细信息。

### 贡献方式

- 🐛 报告问题
- 💡 提出功能建议
- 🔧 提交代码
- 📚 改进文档

## 📊 项目统计

- **创建时间**: 2025-09-21
- **最后更新**: $(date +%Y-%m-%d)
- **主要语言**: Markdown, Shell, Git
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

*这个项目是学习 Git 的实践项目，欢迎提出建议和贡献代码！*

</div>
