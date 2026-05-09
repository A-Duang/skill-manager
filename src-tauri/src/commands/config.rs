use crate::types::AppConfig;
use std::fs;
use tauri::command;

/// 新版配置目录: ~/.skillmanager/
fn config_dir() -> Result<std::path::PathBuf, String> {
    let home = dirs::home_dir().ok_or("无法找到用户主目录")?;
    let dir = home.join(".skillmanager");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    Ok(dir)
}

fn config_path() -> Result<std::path::PathBuf, String> {
    Ok(config_dir()?.join("config.json"))
}

/// 从旧目录 ~/.skillhub/ 迁移配置到新目录 ~/.skillmanager/
fn migrate_from_old_dir() {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return,
    };
    let old_path = home.join(".skillhub").join("config.json");
    let new_path = match config_path() {
        Ok(p) => p,
        Err(_) => return,
    };
    // 仅在旧配置存在且新配置不存在时迁移
    if old_path.exists() && !new_path.exists() {
        let _ = fs::copy(&old_path, &new_path);
    }
}

/// Synchronous config loader for internal use by other modules
pub fn load_config_from_disk() -> AppConfig {
    migrate_from_old_dir();
    let path = match config_path() {
        Ok(p) => p,
        Err(_) => return AppConfig::default(),
    };
    if !path.exists() {
        return AppConfig::default();
    }
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return AppConfig::default(),
    };
    serde_json::from_str(&content).unwrap_or_default()
}

#[command]
pub async fn load_config() -> Result<AppConfig, String> {
    migrate_from_old_dir();
    let path = config_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("读取配置失败: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("解析配置失败: {}", e))
}

/// Synchronous config writer for internal use by other modules
pub fn save_config_to_disk(config: &AppConfig) -> Result<(), String> {
    let path = config_path()?;
    let content =
        serde_json::to_string_pretty(config).map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("写入配置失败: {}", e))?;
    Ok(())
}

#[command]
pub async fn save_config(config: AppConfig) -> Result<(), String> {
    save_config_to_disk(&config)
}
