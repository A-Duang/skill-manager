# SkillManager

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange.svg)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.77+-orange.svg)](https://rustup.rs/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

[English](README.en.md)

> AI Agent Skill 跨平台管理器 —— 一站式管理 23+ 平台的 Skill

**[📥 下载最新版本](https://github.com/A-Duang/skill-manager/releases/latest)**

SkillManager 是一个基于 [Tauri 2.x](https://tauri.app/) 的轻量级桌面应用，帮你统一管理分布在各个 AI 平台上的 Agent Skill。它能自动扫描本地文件系统，识别已安装的 AI 平台（Claude Code、Cursor、Codex、Trae 等），通过直观的矩阵视图和一键操作来管理所有平台的 Skill。
<img width="1800" height="1200" alt="image" src="https://github.com/user-attachments/assets/1c45c094-ca0d-4e1e-b4ff-656bb13d479a" />

## 为什么需要 SkillManager？

随着 AI Agent 生态的爆发，开发者往往同时使用多个 AI 平台，每个平台都有自己的 Skill 目录和管理方式。手动在不同平台间同步、安装、更新 Skill 非常繁琐。SkillManager 解决了这个问题：

- **自动发现** — 扫描本地文件系统，自动识别已安装的 AI 平台
- **统一管理** — 在一个界面中查看所有平台的 Skill 安装状态
- **一键操作** — 从 GitHub 仓库浏览并一键安装 Skill 到指定平台
- **矩阵视图** — Skill × Platform 的交叉矩阵，一目了然
- **跨平台同步** — 将一个平台的 Skill 批量同步到其他平台

## 功能特性

### 核心功能

- **仪表盘** — 总览所有平台和 Skill 的统计数据
- **平台管理** — 自动检测 23+ 内置平台，支持自定义平台和路径覆盖
- **Skill 浏览** — 查看每个平台已安装的 Skill 列表及详情
- **矩阵视图** — Skill 与平台的交叉安装状态矩阵
- **在线市场** — 输入 GitHub 仓库地址，浏览仓库中的 Skill，一键安装到指定平台
- **跨平台同步** — 选择源平台，将所有 Skill 同步到其他平台
- <img width="1800" height="1200" alt="image" src="https://github.com/user-attachments/assets/f46848d8-d005-44c7-b553-bb15f77d62bf" />
  平台同步
<img width="1800" height="1200" alt="image" src="https://github.com/user-attachments/assets/3b78027e-99f0-4205-bad1-c10c9d2e8b30" />
git下载
<img width="1800" height="1200" alt="image" src="https://github.com/user-attachments/assets/0b80a74f-4766-4c6b-8bc3-9f1374f15a51" />


### 技术亮点

- **纯文件系统操作** — 读写均直接操作本地文件系统，无外部 CLI 依赖
- **GitHub API 集成** — 通过 GitHub API 浏览仓库、下载 Skill 文件并直接复制到目标平台目录
- **Windows 兼容** — 正确处理 Windows Junction Point（`mklink /J`），使用 `fs::metadata` 替代 `entry.file_type`
- **中英双语** — 内置 i18n 支持，中文/英文界面一键切换
- **跨平台** — 支持 Windows、macOS、Linux

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Tauri 2.x |
| 前端 | React 19 + TypeScript + Vite |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 后端 | Rust (tokio + serde + reqwest) |

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.77.2
- [Tauri 2.x 环境](https://v2.tauri.app/start/prerequisites/)（按官方文档配置 C++ 编译工具链等）

### 安装与运行

```bash
git clone https://github.com/A-Duang/skill-manager.git
cd skill-manager
npm install
npx tauri dev
```

### 构建发布版本

```bash
npx tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 项目结构

```
skill-manager/
├── package.json               # 前端依赖与脚本
├── vite.config.ts             # Vite 配置
├── index.html                 # 入口 HTML
├── src/                       # React 前端
│   ├── components/            # UI 组件
│   │   ├── Dashboard/         # 仪表盘
│   │   ├── SkillBrowser/      # Skill 浏览器
│   │   ├── SkillDetail/       # Skill 详情
│   │   ├── MatrixView/        # 矩阵视图
│   │   ├── Market/            # 在线市场（GitHub 仓库浏览）
│   │   ├── PlatformManager/   # 平台管理
│   │   ├── InstallDialog/     # 安装对话框
│   │   ├── Settings/          # 设置
│   │   └── Layout/            # 布局（侧边栏）
│   ├── stores/appStore.ts     # Zustand 状态管理
│   ├── types/index.ts         # TypeScript 类型定义
│   ├── i18n/                  # 国际化（中/英）
│   └── App.tsx                # 根组件
└── src-tauri/                 # Rust 后端
    ├── Cargo.toml             # Rust 依赖
    ├── tauri.conf.json        # Tauri 配置
    └── src/
        ├── lib.rs             # Tauri 命令注册
        ├── parser.rs          # SKILL.md 解析器
        ├── platform_registry.rs  # 平台注册表
        ├── types.rs           # 数据结构
        └── commands/
            ├── filesystem.rs  # 文件系统扫描
            ├── install.rs     # 文件复制安装 / 跨平台同步
            ├── github.rs      # GitHub API 集成
            └── config.rs      # 配置管理
```

## 工作原理

```
┌─────────────────────────────────────────────────┐
│              SkillManager GUI                    │
│              (React + TypeScript)                │
├─────────────────────────────────────────────────┤
│                Tauri invoke()                    │
├──────────────────┬──────────────────────────────┤
│   读操作 (Rust)   │      安装操作 (Rust)          │
│   std::fs 直读    │   GitHub API + 文件复制       │
│   ┌───────────┐   │   ┌───────────────────────┐  │
│   │ 扫描平台   │   │   │ 浏览 GitHub 仓库       │  │
│   │ 列出 Skill │   │   │ 下载 Skill 文件        │  │
│   │ 读取详情   │   │   │ 复制到目标平台目录      │  │
│   │ 统计数据   │   │   │ 跨平台同步 Skill       │  │
│   └───────────┘   │   └───────────────────────┘  │
├──────────────────┴──────────────────────────────┤
│              本地文件系统                         │
│  ~/.claude/skills/  ~/.cursor/skills/  ...      │
└─────────────────────────────────────────────────┘
```

## 配置

SkillManager 的配置文件位于 `~/.skillmanager/config.json`，支持：

- 自定义平台定义
- 平台路径覆盖
- 自定义 Skill 目录
- GitHub Token（用于访问私有仓库）

## 支持的平台

内置支持 23+ AI 平台，包括但不限于：

Claude Code · Cursor · Codex · Trae CN · Windsurf · OpenClaw · Gemini CLI · Roo Code · Cline · Aider · Continue · Amazon Q · GitHub Copilot · OpenCode · Void · Sweep · gptme · Avante · CodeCompanion · AgentOps · Trae Solo · WorkBuddy · Qclaw

> 完整列表见 [platform_registry.rs](src-tauri/src/platform_registry.rs)

支持添加自定义平台，详见应用内「设置」页面。

## Skill 格式

每个 Skill 是一个包含 `SKILL.md` 文件的目录，使用 YAML frontmatter 定义元数据：

```markdown
---
name: my-skill
description: "A useful skill for AI agents"
---

# Skill 内容...
```

## 开发

```bash
# 前端开发服务器（热重载，端口 5173）
npm run dev

# 完整开发模式（前端 + Rust 后端）
npx tauri dev

# 代码检查
npm run lint

# Rust 测试
cd src-tauri && cargo test
```

## 路线图

- [x] P0 — 平台检测、Skill 浏览、矩阵视图、在线市场
- [ ] P1 — Skill 编辑器、操作历史/撤销、团队配置、通知
- [ ] P2 — 可视化 Skill 编辑器、多设备同步、插件系统

## 贡献

欢迎贡献！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 致谢

- [Tauri](https://tauri.app/) — 跨平台桌面应用框架
- [React](https://react.dev/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/)
