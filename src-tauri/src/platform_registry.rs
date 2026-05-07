use crate::types::{AppConfig, PlatformConfig};
use std::collections::HashMap;

pub fn get_platform_registry() -> HashMap<String, PlatformConfig> {
    let mut registry = HashMap::new();

    let platforms = vec![
        ("claude-code", "Claude Code", "claude", ".claude/skills"),
        ("codex", "Codex", "codex", ".codex/skills"),
        ("cursor", "Cursor", "cursor", ".cursor/skills"),
        ("trae-cn", "Trae CN", "trae", ".trae-cn/skills"),
        ("windsurf", "Windsurf", "windsurf", ".windsurf/skills"),
        ("openclaw", "OpenClaw", "openclaw", ".openclaw/skills"),
        ("gemini-cli", "Gemini CLI", "gemini", ".gemini/skills"),
        ("roo-code", "Roo Code", "roo", ".roo-code/skills"),
        ("cline", "Cline", "cline", ".cline/skills"),
        ("aider", "Aider", "aider", ".aider/skills"),
        ("continue", "Continue", "continue", ".continue/skills"),
        ("amazon-q", "Amazon Q", "amazon-q", ".amazon-q/skills"),
        ("copilot", "GitHub Copilot", "copilot", ".copilot/skills"),
        ("opencode", "OpenCode", "opencode", ".opencode/skills"),
        ("void", "Void", "void", ".void/skills"),
        ("sweep", "Sweep", "sweep", ".sweep/skills"),
        ("gptme", "gptme", "gptme", ".config/gptme/skills"),
        ("avante", "Avante", "avante", ".avante/skills"),
        ("codecompanion", "CodeCompanion", "codecompanion", ".codecompanion/skills"),
        ("agentops", "AgentOps", "agentops", ".agentops/skills"),
        ("trae-solo", "Trae Solo", "trae-solo", ".trae-solo/skills"),
        ("workbuddy", "WorkBuddy", "workbuddy", ".workbuddy/skills"),
        ("qclaw", "Qclaw", "qclaw", ".qclaw/skills"),
    ];

    for (id, name, icon, skill_path) in platforms {
        registry.insert(
            id.to_string(),
            PlatformConfig {
                id: id.to_string(),
                name: name.to_string(),
                icon: icon.to_string(),
                skill_path: skill_path.to_string(),
            },
        );
    }

    registry
}

/// Returns the merged registry: built-in platforms (with config overrides applied) + custom platforms
pub fn get_merged_registry(config: &AppConfig) -> HashMap<String, PlatformConfig> {
    let mut registry = get_platform_registry();

    // Apply path overrides for built-in platforms
    for (id, custom_path) in &config.platform_overrides {
        if let Some(platform) = registry.get_mut(id) {
            platform.skill_path = custom_path.clone();
        }
    }

    // Add custom platforms
    for cp in &config.custom_platforms {
        registry.insert(
            cp.id.clone(),
            PlatformConfig {
                id: cp.id.clone(),
                name: cp.name.clone(),
                icon: cp.icon.clone(),
                skill_path: cp.skill_path.clone(),
            },
        );
    }

    // Add custom skill directories as virtual platforms
    for dir in &config.custom_skill_dirs {
        let id = format!("custom-{}", dir.name.to_lowercase().replace(' ', "-"));
        registry.insert(
            id.clone(),
            PlatformConfig {
                id,
                name: dir.name.clone(),
                icon: "folder".to_string(),
                skill_path: dir.path.clone(),
            },
        );
    }

    registry
}
