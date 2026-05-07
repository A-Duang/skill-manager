use crate::commands::config::load_config_from_disk;
use crate::parser;
use crate::platform_registry::get_merged_registry;
use crate::types::{CopySkillResult, GitHubSkill};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Deserialize)]
struct GitHubContent {
    name: String,
    #[serde(rename = "type")]
    content_type: String,
    path: String,
    download_url: Option<String>,
}

#[derive(Deserialize)]
struct GitHubTreeItem {
    path: String,
    #[serde(rename = "type")]
    item_type: String,
}

#[derive(Deserialize)]
struct GitHubTreeResponse {
    tree: Vec<GitHubTreeItem>,
}

/// Parses a GitHub URL into (owner, repo, branch, subpath).
/// Supports:
///   owner/repo
///   https://github.com/owner/repo
///   https://github.com/owner/repo/tree/branch/sub/path
///   owner/repo/sub/path
fn parse_repo_url(url: &str) -> Result<(String, String, String, String), String> {
    let url = url.trim();
    let path = if url.starts_with("http") {
        let url = url.trim_end_matches('/');
        url.split("github.com/").nth(1).ok_or("不是有效的 GitHub 仓库地址")?
    } else {
        url
    };
    let parts: Vec<&str> = path.trim_end_matches('/').split('/').collect();
    if parts.len() < 2 {
        return Err("请输入 owner/repo 格式的仓库地址，例如: vercel-labs/skills".to_string());
    }
    let owner = parts[0].to_string();
    let repo = parts[1].to_string();

    // Extract branch and subpath
    let (branch, subpath) = if parts.len() > 2 && parts[2] == "tree" {
        // URL like owner/repo/tree/branch/sub/path
        let branch = if parts.len() > 3 { parts[3].to_string() } else { String::new() };
        let subpath = if parts.len() > 4 { parts[4..].join("/") } else { String::new() };
        (branch, subpath)
    } else if parts.len() > 2 {
        // URL like owner/repo/sub/path — no branch specified
        (String::new(), parts[2..].join("/"))
    } else {
        (String::new(), String::new())
    };

    Ok((owner, repo, branch, subpath))
}

fn github_api_url(owner: &str, repo: &str, path: &str) -> String {
    if path.is_empty() {
        format!("https://api.github.com/repos/{}/{}/contents/", owner, repo)
    } else {
        format!(
            "https://api.github.com/repos/{}/{}/contents/{}",
            owner,
            repo,
            path.trim_start_matches('/')
        )
    }
}

fn raw_content_url(owner: &str, repo: &str, path: &str) -> String {
    format!(
        "https://raw.githubusercontent.com/{}/{}/main/{}",
        owner,
        repo,
        path.trim_start_matches('/')
    )
}

async fn fetch_json<T: serde::de::DeserializeOwned>(url: &str, token: &str) -> Result<T, String> {
    let client = reqwest::Client::new();
    let mut req = client
        .get(url)
        .header("User-Agent", "SkillManager/1.0")
        .header("Accept", "application/vnd.github.v3+json");
    if !token.is_empty() {
        req = req.header("Authorization", format!("token {}", token));
    }
    let resp = req.send().await.map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("GitHub API 错误 ({}): {}", status, body));
    }

    resp.json().await.map_err(|e| format!("解析响应失败: {}", e))
}

async fn fetch_text(url: &str, token: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut req = client
        .get(url)
        .header("User-Agent", "SkillManager/1.0");
    if !token.is_empty() {
        req = req.header("Authorization", format!("token {}", token));
    }
    let resp = req.send().await.map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("下载失败: {}", resp.status()));
    }

    resp.text().await.map_err(|e| format!("读取内容失败: {}", e))
}

#[command]
pub async fn fetch_github_skills(repo_url: String) -> Result<Vec<GitHubSkill>, String> {
    let (owner, repo, _branch, subpath) = parse_repo_url(&repo_url)?;
    let repo_slug = format!("{}/{}", owner, repo);
    let token = load_config_from_disk().github_token;

    // 获取目录内容（根目录或子路径）
    let url = github_api_url(&owner, &repo, &subpath);
    let contents: Vec<GitHubContent> = fetch_json(&url, &token).await?;

    let mut skills = Vec::new();

    // 过滤子目录（不以 . 开头）
    let dirs: Vec<&GitHubContent> = contents
        .iter()
        .filter(|c| c.content_type == "dir" && !c.name.starts_with('.'))
        .collect();

    for dir in dirs {
        // 检查子目录是否包含 SKILL.md
        let skill_md_url = format!(
            "https://raw.githubusercontent.com/{}/{}/{}/SKILL.md",
            owner, repo, dir.path
        );

        match fetch_text(&skill_md_url, &token).await {
            Ok(content) => {
                let (name, description) =
                    parser::parse_frontmatter(&content).unwrap_or_default();
                let display_name = if name.is_empty() {
                    dir.name.clone()
                } else {
                    name
                };
                let display_desc = if description.is_empty() {
                    format!("来自 {}", repo_slug)
                } else {
                    description
                };
                skills.push(GitHubSkill {
                    name: display_name,
                    description: display_desc,
                    path: dir.path.clone(),
                    repo: repo_slug.clone(),
                });
            }
            Err(_) => {
                // 不是 skill 目录（没有 SKILL.md），跳过
            }
        }
    }

    // 检查目录本身是否包含 SKILL.md
    // 处理 SKILL.md 在仓库根目录或指定子路径的情况
    if subpath.is_empty() || skills.is_empty() {
        let root_skill_md_url = if subpath.is_empty() {
            format!("https://raw.githubusercontent.com/{}/{}/main/SKILL.md", owner, repo)
        } else {
            format!("https://raw.githubusercontent.com/{}/{}/{}/SKILL.md", owner, repo, subpath)
        };
        if let Ok(content) = fetch_text(&root_skill_md_url, &token).await {
            if !skills.iter().any(|s| s.path == subpath) {
                let (name, description) = parser::parse_frontmatter(&content).unwrap_or_default();
                let display_name = if name.is_empty() { repo.clone() } else { name };
                let display_desc = if description.is_empty() {
                    format!("来自 {}", repo_slug)
                } else {
                    description
                };
                skills.insert(0, GitHubSkill {
                    name: display_name,
                    description: display_desc,
                    path: subpath.clone(),
                    repo: repo_slug.clone(),
                });
            }
        }
    }

    Ok(skills)
}

#[command]
pub async fn install_github_skill(
    repo_url: String,
    skill_path: String,
    target_platforms: Vec<String>,
) -> Result<CopySkillResult, String> {
    let (owner, repo, branch, _subpath) = parse_repo_url(&repo_url)?;

    // skill_path 为空表示 skill 在仓库根目录
    let is_root_skill = skill_path.is_empty();
    let skill_name = if is_root_skill {
        repo.clone()
    } else {
        skill_path
            .split('/')
            .last()
            .ok_or("无法确定 Skill 名称")?
            .to_string()
    };

    let home = dirs::home_dir().ok_or("无法找到用户主目录")?;
    let token = load_config_from_disk().github_token;

    // 确定分支：使用 URL 中的分支，或通过 API 获取默认分支
    let effective_branch = if branch.is_empty() {
        let repo_info_url = format!("https://api.github.com/repos/{}/{}", owner, repo);
        #[derive(serde::Deserialize)]
        struct RepoInfo { default_branch: String }
        let repo_info: RepoInfo = fetch_json(&repo_info_url, &token).await?;
        repo_info.default_branch
    } else {
        branch
    };

    // 通过 Trees API 获取仓库所有文件
    let trees_url = format!(
        "https://api.github.com/repos/{}/{}/git/trees/{}?recursive=1",
        owner, repo, effective_branch
    );
    let tree_resp: GitHubTreeResponse = fetch_json(&trees_url, &token).await?;

    // 过滤出 skill 目录下的文件
    let skill_files: Vec<&GitHubTreeItem> = if is_root_skill {
        // 根目录 skill：下载仓库中的所有文件
        tree_resp
            .tree
            .iter()
            .filter(|item| item.item_type == "blob")
            .collect()
    } else {
        let prefix = format!("{}/", skill_path);
        tree_resp
            .tree
            .iter()
            .filter(|item| item.item_type == "blob" && item.path.starts_with(&prefix))
            .collect()
    };

    if skill_files.is_empty() {
        return Err(format!("在 {}/{} 中未找到文件", owner, skill_path));
    }

    // Download to temp cache directory
    let cache_dir = home.join(".skillmanager").join("cache").join(&skill_name);

    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir).map_err(|e| format!("清理缓存失败: {}", e))?;
    }

    let mut errors: Vec<String> = Vec::new();
    let mut files_copied = 0usize;

    for file in &skill_files {
        // GitHub API uses '/' separators; normalize to platform separator for strip_prefix
        let normalized = file.path.replace('/', std::path::MAIN_SEPARATOR_STR);
        let relative = normalized.strip_prefix(&skill_path).unwrap_or(&normalized);
        // Convert back to '/' for consistent join behavior
        let relative_str = relative.replace(std::path::MAIN_SEPARATOR_STR, "/");
        let local_path = cache_dir.join(&relative_str);

        if let Some(parent) = local_path.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                errors.push(format!("创建目录失败 {}: {}", parent.display(), e));
                continue;
            }
        }

        let raw_url = raw_content_url(&owner, &repo, &file.path);
        match fetch_text(&raw_url, &token).await {
            Ok(content) => {
                if let Err(e) = fs::write(&local_path, content) {
                    errors.push(format!("保存文件失败 {}: {}", local_path.display(), e));
                } else {
                    files_copied += 1;
                }
            }
            Err(e) => {
                errors.push(format!("下载 {} 失败: {}", file.path, e));
            }
        }
    }

    if errors.is_empty() {
        // Copy from cache to target platforms
        let app_config = load_config_from_disk();
        let registry = get_merged_registry(&app_config);
        let mut platforms_completed: Vec<String> = Vec::new();

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

            if dest.exists() {
                // Already installed, skip
                continue;
            }

            if let Err(e) = fs::create_dir_all(&dest) {
                errors.push(format!("为 {} 创建目录失败: {}", platform_id, e));
                continue;
            }

            match crate::commands::install::copy_dir_recursive(&cache_dir, &dest) {
                Ok(_) => {
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
            files_copied,
            platforms_completed,
            errors,
        })
    } else {
        Ok(CopySkillResult {
            success: false,
            skill_name,
            files_copied,
            platforms_completed: vec![],
            errors,
        })
    }
}
