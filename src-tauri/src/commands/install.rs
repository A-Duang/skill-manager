use crate::commands::config::load_config_from_disk;
use crate::platform_registry::get_merged_registry;
use crate::types::{CopySkillResult, SyncResult};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;
use walkdir::WalkDir;

#[command]
pub async fn copy_skill(
    source_dir: String,
    target_platforms: Vec<String>,
) -> Result<CopySkillResult, String> {
    let source = PathBuf::from(&source_dir);
    if !source.is_dir() {
        return Err(format!("源路径不是目录: {}", source_dir));
    }

    let skill_md = source.join("SKILL.md");
    if !skill_md.exists() {
        return Err(format!(
            "在 {} 中未找到 SKILL.md，有效的 Skill 必须包含 SKILL.md 文件",
            source_dir
        ));
    }

    let skill_name = source
        .file_name()
        .ok_or("无法从路径确定 Skill 名称")?
        .to_string_lossy()
        .to_string();

    let home = dirs::home_dir().ok_or("无法找到用户主目录")?;
    let app_config = load_config_from_disk();
    let registry = get_merged_registry(&app_config);

    let mut errors: Vec<String> = Vec::new();
    let mut total_files = 0usize;
    let mut platforms_completed: Vec<String> = Vec::new();
    let mut platforms_skipped: Vec<String> = Vec::new();

    for platform_id in &target_platforms {
        let cfg = match registry.get(platform_id) {
            Some(c) => c,
            None => {
                errors.push(format!("未知平台: {}", platform_id));
                continue;
            }
        };

        let dest = if cfg.skill_path.starts_with('/') || cfg.skill_path.contains(':') {
            PathBuf::from(&cfg.skill_path).join(&skill_name)
        } else if cfg.skill_path.is_empty() {
            errors.push(format!("{} 的 skill_path 为空，跳过", platform_id));
            continue;
        } else {
            home.join(&cfg.skill_path).join(&skill_name)
        };

        // Safety: skip if dest resolves to a root or drive directory
        if dest.parent().is_none() || dest.parent() == Some(dest.as_path()) {
            errors.push(format!("{} 的路径无效: {}", platform_id, dest.display()));
            continue;
        }

        // Incremental: skip if already exists
        if dest.exists() {
            platforms_skipped.push(platform_id.clone());
            continue;
        }

        if let Err(e) = fs::create_dir_all(&dest) {
            errors.push(format!("为 {} 创建目录失败: {}", platform_id, e));
            continue;
        }

        match copy_dir_recursive(&source, &dest) {
            Ok(count) => {
                total_files += count;
                platforms_completed.push(platform_id.clone());
            }
            Err(e) => {
                errors.push(format!("复制到 {} 失败: {}", platform_id, e));
            }
        }
    }

    Ok(CopySkillResult {
        success: errors.is_empty(),
        skill_name,
        files_copied: total_files,
        platforms_completed,
        errors,
    })
}

#[command]
pub async fn sync_platform_skills(
    source_platform: String,
    target_platforms: Vec<String>,
) -> Result<SyncResult, String> {
    let home = dirs::home_dir().ok_or("无法找到用户主目录")?;
    let app_config = load_config_from_disk();
    let registry = get_merged_registry(&app_config);

    // Resolve source platform skill directory
    let source_cfg = registry
        .get(&source_platform)
        .ok_or(format!("未知源平台: {}", source_platform))?;

    let source_dir = if source_cfg.skill_path.starts_with('/')
        || source_cfg.skill_path.contains(':')
    {
        PathBuf::from(&source_cfg.skill_path)
    } else {
        home.join(&source_cfg.skill_path)
    };

    if !source_dir.exists() {
        return Err(format!(
            "源平台目录不存在: {}",
            source_dir.display()
        ));
    }

    // Scan all skills in source directory
    let entries = fs::read_dir(&source_dir)
        .map_err(|e| format!("读取源目录失败: {}", e))?;

    let mut skill_dirs: Vec<(String, PathBuf)> = Vec::new();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip hidden/system directories
        if name.starts_with('.') {
            continue;
        }
        let path = entry.path();
        if !fs::metadata(&path).map(|m| m.is_dir()).unwrap_or(false) {
            continue;
        }
        if path.join("SKILL.md").exists() {
            skill_dirs.push((name, path));
        }
    }

    if skill_dirs.is_empty() {
        return Err("源平台中没有找到包含 SKILL.md 的 Skill".to_string());
    }

    let mut errors: Vec<String> = Vec::new();
    let mut total_files = 0usize;
    let mut skills_synced: Vec<String> = Vec::new();
    let mut skills_skipped: Vec<String> = Vec::new();
    let mut platforms_completed: Vec<String> = Vec::new();

    for platform_id in &target_platforms {
        let cfg = match registry.get(platform_id) {
            Some(c) => c,
            None => {
                errors.push(format!("未知目标平台: {}", platform_id));
                continue;
            }
        };

        let dest_base = if cfg.skill_path.starts_with('/') || cfg.skill_path.contains(':') {
            PathBuf::from(&cfg.skill_path)
        } else if cfg.skill_path.is_empty() {
            errors.push(format!("{} 的 skill_path 为空，跳过", platform_id));
            continue;
        } else {
            home.join(&cfg.skill_path)
        };

        // Safety: skip if dest resolves to a root or drive directory
        if dest_base.parent().is_none() || dest_base.parent() == Some(dest_base.as_path()) {
            errors.push(format!("{} 的路径无效: {}", platform_id, dest_base.display()));
            continue;
        }

        if let Err(e) = fs::create_dir_all(&dest_base) {
            errors.push(format!("为 {} 创建目录失败: {}", platform_id, e));
            continue;
        }

        let mut platform_ok = true;
        for (skill_name, skill_src) in &skill_dirs {
            let dest = dest_base.join(skill_name);

            // Incremental: skip if already exists on target
            if dest.exists() {
                if !skills_skipped.contains(skill_name) {
                    skills_skipped.push(skill_name.clone());
                }
                continue;
            }

            match copy_dir_recursive(skill_src, &dest) {
                Ok(count) => {
                    total_files += count;
                    if !skills_synced.contains(skill_name) {
                        skills_synced.push(skill_name.clone());
                    }
                }
                Err(e) => {
                    errors.push(format!(
                        "复制 {} 到 {} 失败: {}",
                        skill_name, platform_id, e
                    ));
                    platform_ok = false;
                }
            }
        }

        if platform_ok {
            platforms_completed.push(platform_id.clone());
        }
    }

    Ok(SyncResult {
        success: errors.is_empty(),
        total_skills: skill_dirs.len(),
        files_copied: total_files,
        skills_synced,
        skills_skipped,
        platforms_completed,
        errors,
    })
}

pub fn copy_dir_recursive(src: &Path, dest: &Path) -> Result<usize, String> {
    let mut count = 0usize;

    for entry in WalkDir::new(src) {
        let entry = entry.map_err(|e| format!("遍历错误: {}", e))?;
        let relative = entry
            .path()
            .strip_prefix(src)
            .map_err(|e| format!("路径前缀错误: {}", e))?;

        if relative.as_os_str().is_empty() {
            continue;
        }

        let target = dest.join(relative);

        if entry.file_type().is_dir() {
            fs::create_dir_all(&target)
                .map_err(|e| format!("创建目录失败 {}: {}", target.display(), e))?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("创建目录失败 {}: {}", parent.display(), e))?;
            }
            fs::copy(entry.path(), &target).map_err(|e| {
                format!(
                    "复制失败 {} -> {}: {}",
                    entry.path().display(),
                    target.display(),
                    e
                )
            })?;
            count += 1;
        }
    }

    Ok(count)
}
