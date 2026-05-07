mod commands;
mod parser;
mod platform_registry;
mod types;

use commands::config::*;
use commands::filesystem::*;
use commands::github::*;
use commands::install::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Filesystem read commands
            scan_platforms,
            list_installed_skills,
            get_skill_detail,
            get_stats,
            // Copy-based install commands
            copy_skill,
            sync_platform_skills,
            // Config commands
            load_config,
            save_config,
            // GitHub API commands
            fetch_github_skills,
            install_github_skill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
