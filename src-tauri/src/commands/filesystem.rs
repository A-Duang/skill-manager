use crate::commands::config::load_config_from_disk;
use crate::parser;
use crate::platform_registry::get_merged_registry;
use crate::types::{AppStats, DetectedPlatform, InstalledSkill, SkillDetail};
use std::collections::HashMap;
use std::fs;
use tauri::command;

#[command]
pub async fn scan_platforms() -> Result<Vec<DetectedPlatform>, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let config = load_config_from_disk();
    let registry = get_merged_registry(&config);
    let mut platforms = Vec::new();

    for (_, cfg) in registry {
        let skill_dir_path = if cfg.skill_path.starts_with('/') || cfg.skill_path.contains(':') {
            // Absolute path
            std::path::PathBuf::from(&cfg.skill_path)
        } else {
            // Relative to home
            home.join(&cfg.skill_path)
        };

        let exists = skill_dir_path.exists();
        let skill_count = if exists {
            count_skills_in_dir(&skill_dir_path).unwrap_or(0)
        } else {
            0
        };

        platforms.push(DetectedPlatform {
            id: cfg.id,
            name: cfg.name,
            icon: cfg.icon,
            detected: exists,
            skill_dir: skill_dir_path.to_string_lossy().to_string(),
            skill_count,
        });
    }

    platforms.sort_by(|a, b| b.detected.cmp(&a.detected).then(a.name.cmp(&b.name)));
    Ok(platforms)
}

#[command]
pub async fn list_installed_skills() -> Result<Vec<InstalledSkill>, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let config = load_config_from_disk();
    let registry = get_merged_registry(&config);
    let mut skills: HashMap<String, InstalledSkill> = HashMap::new();

    for (platform_id, cfg) in registry {
        let skill_dir_path = if cfg.skill_path.starts_with('/') || cfg.skill_path.contains(':') {
            std::path::PathBuf::from(&cfg.skill_path)
        } else {
            home.join(&cfg.skill_path)
        };

        if !skill_dir_path.exists() {
            continue;
        }

        let entries = fs::read_dir(&skill_dir_path)
            .map_err(|e| format!("Failed to read {}: {}", skill_dir_path.display(), e))?;

        for entry in entries.flatten() {
            let skill_name = entry.file_name().to_string_lossy().to_string();
            if skill_name.starts_with('.') {
                continue;
            }
            if !fs::metadata(entry.path())
                .map(|m| m.is_dir())
                .unwrap_or(false)
            {
                continue;
            }
            let skill_md = entry.path().join("SKILL.md");

            let (name, description) = if skill_md.exists() {
                parser::parse_skill_md(&skill_md)
                    .unwrap_or_else(|_| (skill_name.clone(), String::new()))
            } else {
                (skill_name.clone(), String::new())
            };

            let display_name = if name.is_empty() {
                skill_name.clone()
            } else {
                name
            };

            let skill = skills
                .entry(display_name.clone())
                .or_insert_with(|| InstalledSkill {
                    name: display_name,
                    description,
                    agents: Vec::new(),
                    paths: HashMap::new(),
                });

            if !skill.agents.contains(&platform_id) {
                skill.agents.push(platform_id.clone());
            }
            skill
                .paths
                .insert(platform_id.clone(), entry.path().to_string_lossy().to_string());
        }
    }

    // Apply user description overrides (does not modify original SKILL.md files)
    for skill in skills.values_mut() {
        if let Some(override_desc) = config.skill_description_overrides.get(&skill.name) {
            if !override_desc.is_empty() {
                skill.description = override_desc.clone();
            }
        }
    }

    let mut result: Vec<InstalledSkill> = skills.into_values().collect();
    result.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(result)
}

#[command]
pub async fn set_skill_description_override(skill_name: String, description: String) -> Result<(), String> {
    let mut config = load_config_from_disk();
    if description.is_empty() {
        config.skill_description_overrides.remove(&skill_name);
    } else {
        config.skill_description_overrides.insert(skill_name, description);
    }
    crate::commands::config::save_config_to_disk(&config)
}

#[command]
pub async fn delete_skill_description_override(skill_name: String) -> Result<(), String> {
    let mut config = load_config_from_disk();
    config.skill_description_overrides.remove(&skill_name);
    crate::commands::config::save_config_to_disk(&config)
}

#[command]
pub async fn get_skill_detail(
    platform: String,
    skill_name: String,
) -> Result<SkillDetail, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let config = load_config_from_disk();
    let registry = get_merged_registry(&config);

    let cfg = registry
        .get(&platform)
        .ok_or_else(|| format!("Unknown platform: {}", platform))?;

    let skill_dir_path = if cfg.skill_path.starts_with('/') || cfg.skill_path.contains(':') {
        std::path::PathBuf::from(&cfg.skill_path).join(&skill_name)
    } else {
        home.join(&cfg.skill_path).join(&skill_name)
    };

    let skill_md = skill_dir_path.join("SKILL.md");

    if !skill_md.exists() {
        return Err(format!("SKILL.md not found at {}", skill_md.display()));
    }

    let content =
        fs::read_to_string(&skill_md).map_err(|e| format!("Failed to read SKILL.md: {}", e))?;

    let (name, description) = parser::parse_frontmatter(&content)
        .unwrap_or_else(|_| (skill_name.clone(), String::new()));

    // Check which platforms have this skill
    let mut agents = Vec::new();
    let mut paths = HashMap::new();

    for (pid, pcfg) in &registry {
        let p = if pcfg.skill_path.starts_with('/') || pcfg.skill_path.contains(':') {
            std::path::PathBuf::from(&pcfg.skill_path).join(&skill_name)
        } else {
            home.join(&pcfg.skill_path).join(&skill_name)
        };
        if p.exists() {
            agents.push(pid.clone());
            paths.insert(pid.clone(), p.to_string_lossy().to_string());
        }
    }

    Ok(SkillDetail {
        name: if name.is_empty() { skill_name } else { name },
        description,
        agents,
        paths,
        content: Some(content),
    })
}

#[command]
pub async fn get_stats() -> Result<AppStats, String> {
    let platforms = scan_platforms().await?;
    let skills = list_installed_skills().await?;

    let detected = platforms.iter().filter(|p| p.detected).count();

    Ok(AppStats {
        total_platforms: platforms.len(),
        detected_platforms: detected,
        total_skills: skills.len(),
    })
}

fn count_skills_in_dir(dir: &std::path::Path) -> Result<usize, String> {
    let mut count = 0;
    let entries =
        fs::read_dir(dir).map_err(|e| format!("Failed to read {}: {}", dir.display(), e))?;

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let is_dir = fs::metadata(entry.path())
            .map(|m| m.is_dir())
            .unwrap_or(false);
        if is_dir {
            count += 1;
        }
    }

    Ok(count)
}
