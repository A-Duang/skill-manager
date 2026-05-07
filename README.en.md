# SkillManager

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange.svg)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.77+-orange.svg)](https://rustup.rs/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

[中文文档](README.zh.md)

> One-stop cross-platform manager for AI Agent Skills across 23+ platforms.

SkillManager is a lightweight desktop app built with [Tauri 2.x](https://tauri.app/) that unifies the management of Agent Skills scattered across different AI platforms. It automatically scans your local filesystem, detects installed AI platforms (Claude Code, Cursor, Codex, Trae, etc.), and lets you manage all Skills through an intuitive matrix view and one-click operations.

## Why SkillManager?

As the AI Agent ecosystem explodes, developers often juggle multiple AI platforms, each with its own Skill directory and management workflow. Manually syncing, installing, and updating Skills across platforms is tedious. SkillManager solves this:

- **Auto-Discovery** — Scans local filesystem to detect installed AI platforms
- **Unified Management** — View Skill installation status across all platforms in one place
- **One-Click Install** — Browse GitHub repos and install Skills to target platforms
- **Matrix View** — Skill x Platform cross-reference matrix at a glance
- **Cross-Platform Sync** — Batch-sync Skills from one platform to all others

## Features

### Core

- **Dashboard** — Overview of all platforms and Skill statistics
- **Platform Manager** — Auto-detects 23+ built-in platforms, supports custom platforms and path overrides
- **Skill Browser** — Browse installed Skills per platform with detailed info
- **Matrix View** — Cross-reference matrix of Skills vs. platforms
- **Online Marketplace** — Enter a GitHub repo URL, browse its Skills, and install with one click
- **Cross-Platform Sync** — Select a source platform and sync all its Skills to other platforms

### Technical Highlights

- **Pure Filesystem Operations** — Direct local filesystem read/write, no external CLI dependency
- **GitHub API Integration** — Browse repos, download Skill files via GitHub API, and copy directly to target directories
- **Windows Compatible** — Handles Windows Junction Points (`mklink /J`) correctly, uses `fs::metadata` instead of `entry.file_type`
- **Bilingual** — Built-in i18n support, switch between Chinese and English
- **Cross-Platform** — Supports Windows, macOS, and Linux

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2.x |
| Frontend | React 19 + TypeScript + Vite |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Backend | Rust (tokio + serde + reqwest) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.77.2
- [Tauri 2.x prerequisites](https://v2.tauri.app/start/prerequisites/) (C++ build tools, etc.)

### Install & Run

```bash
git clone https://github.com/A-Duang/skill-manager.git
cd skill-manager
npm install
npx tauri dev
```

### Build Release

```bash
npx tauri build
```

Build artifacts are located in `src-tauri/target/release/bundle/`.

## Project Structure

```
skill-manager/
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite config
├── index.html                 # Entry HTML
├── src/                       # React frontend
│   ├── components/            # UI components
│   │   ├── Dashboard/         # Dashboard
│   │   ├── SkillBrowser/      # Skill browser
│   │   ├── SkillDetail/       # Skill detail view
│   │   ├── MatrixView/        # Matrix view
│   │   ├── Market/            # Online marketplace (GitHub repo browser)
│   │   ├── PlatformManager/   # Platform manager
│   │   ├── InstallDialog/     # Install dialog
│   │   ├── Settings/          # Settings
│   │   └── Layout/            # Layout (sidebar)
│   ├── stores/appStore.ts     # Zustand state management
│   ├── types/index.ts         # TypeScript type definitions
│   ├── i18n/                  # Internationalization (zh/en)
│   └── App.tsx                # Root component
└── src-tauri/                 # Rust backend
    ├── Cargo.toml             # Rust dependencies
    ├── tauri.conf.json        # Tauri config
    └── src/
        ├── lib.rs             # Tauri command registration
        ├── parser.rs          # SKILL.md parser
        ├── platform_registry.rs  # Platform registry
        ├── types.rs           # Data structures
        └── commands/
            ├── filesystem.rs  # Filesystem scanning
            ├── install.rs     # File copy install / cross-platform sync
            ├── github.rs      # GitHub API integration
            └── config.rs      # Config management
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              SkillManager GUI                    │
│              (React + TypeScript)                │
├─────────────────────────────────────────────────┤
│                Tauri invoke()                    │
├──────────────────┬──────────────────────────────┤
│   Read (Rust)    │      Install (Rust)          │
│   std::fs direct │   GitHub API + File Copy     │
│   ┌───────────┐  │   ┌───────────────────────┐  │
│   │ Scan      │  │   │ Browse GitHub repos    │  │
│   │ List      │  │   │ Download Skill files   │  │
│   │ Detail    │  │   │ Copy to target dirs    │  │
│   │ Stats     │  │   │ Cross-platform sync    │  │
│   └───────────┘  │   └───────────────────────┘  │
├──────────────────┴──────────────────────────────┤
│              Local Filesystem                    │
│  ~/.claude/skills/  ~/.cursor/skills/  ...      │
└─────────────────────────────────────────────────┘
```

## Configuration

SkillManager stores its config at `~/.skillmanager/config.json`, supporting:

- Custom platform definitions
- Platform path overrides
- Custom Skill directories
- GitHub Token (for private repo access)

## Supported Platforms

Built-in support for 23+ AI platforms, including:

Claude Code · Cursor · Codex · Trae CN · Windsurf · OpenClaw · Gemini CLI · Roo Code · Cline · Aider · Continue · Amazon Q · GitHub Copilot · OpenCode · Void · Sweep · gptme · Avante · CodeCompanion · AgentOps · Trae Solo · WorkBuddy · Qclaw

> Full list in [platform_registry.rs](src-tauri/src/platform_registry.rs)

Custom platforms can be added via the in-app Settings page.

## Skill Format

Each Skill is a directory containing a `SKILL.md` file with YAML frontmatter metadata:

```markdown
---
name: my-skill
description: "A useful skill for AI agents"
---

# Skill content...
```

## Development

```bash
# Frontend dev server (HMR, port 5173)
npm run dev

# Full dev mode (frontend + Rust backend)
npx tauri dev

# Lint
npm run lint

# Rust tests
cd src-tauri && cargo test
```

## Roadmap

- [x] P0 — Platform detection, Skill browsing, matrix view, online marketplace
- [ ] P1 — Skill editor, operation history/undo, team config, notifications
- [ ] P2 — Visual Skill editor, multi-device sync, plugin system

## Contributing

Contributions are welcome!

1. Fork this repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Tauri](https://tauri.app/) — Cross-platform desktop app framework
- [React](https://react.dev/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/)
