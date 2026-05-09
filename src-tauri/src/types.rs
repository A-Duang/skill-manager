use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformConfig {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub skill_path: String, // relative to home dir, e.g. ".claude/skills"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedPlatform {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub detected: bool,
    pub skill_dir: String,
    pub skill_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledSkill {
    pub name: String,
    pub description: String,
    pub agents: Vec<String>,
    pub paths: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillDetail {
    pub name: String,
    pub description: String,
    pub agents: Vec<String>,
    pub paths: HashMap<String, String>,
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppStats {
    pub total_platforms: usize,
    pub detected_platforms: usize,
    pub total_skills: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopySkillResult {
    pub success: bool,
    pub skill_name: String,
    pub files_copied: usize,
    pub platforms_completed: Vec<String>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub total_skills: usize,
    pub files_copied: usize,
    pub skills_synced: Vec<String>,
    pub skills_skipped: Vec<String>,
    pub platforms_completed: Vec<String>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_scope")]
    pub default_scope: String,
    #[serde(default)]
    pub custom_skill_dirs: Vec<CustomSkillDir>,
    #[serde(default)]
    pub enabled_platforms: Vec<String>,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_language")]
    pub language: String,
    /// Override skill_path for built-in platforms: platform_id -> custom path
    #[serde(default)]
    pub platform_overrides: HashMap<String, String>,
    /// User-added custom platforms
    #[serde(default)]
    pub custom_platforms: Vec<CustomPlatform>,
    /// GitHub Personal Access Token for API authentication (increases rate limit to 5000/hr)
    #[serde(default)]
    pub github_token: String,
    /// User-supplied description overrides: skill_name -> chinese description (does not modify original SKILL.md)
    #[serde(default)]
    pub skill_description_overrides: HashMap<String, String>,
}

fn default_scope() -> String {
    "global".to_string()
}

fn default_theme() -> String {
    "light".to_string()
}

fn default_language() -> String {
    "zh".to_string()
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            default_scope: "global".to_string(),
            custom_skill_dirs: Vec::new(),
            enabled_platforms: Vec::new(),
            theme: "light".to_string(),
            language: "zh".to_string(),
            platform_overrides: HashMap::new(),
            custom_platforms: Vec::new(),
            github_token: String::new(),
            skill_description_overrides: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomSkillDir {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomPlatform {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub skill_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubSkill {
    pub name: String,
    pub description: String,
    pub path: String,
    pub repo: String,
}
