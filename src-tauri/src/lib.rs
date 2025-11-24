mod config;

use config::Config;
use git2::Repository;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Runtime};
use tauri_plugin_opener::OpenerExt;

#[derive(serde::Serialize)]
struct RepositoryDto {
    path: String,
    name: String,
    worktrees: Vec<WorktreeDto>,
}

#[derive(serde::Serialize)]
struct WorktreeDto {
    path: String,
    name: String,
}

fn get_worktrees_for_repo(repo_path: &Path) -> Result<Vec<WorktreeDto>, String> {
    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;
    let worktrees = repo.worktrees().map_err(|e| e.to_string())?;

    worktrees
        .into_iter()
        .filter_map(|wt_name| wt_name)
        .map(|wt_name| {
            let wt = repo
                .find_worktree(&wt_name)
                .map_err(|e| format!("Failed to find worktree {}: {}", wt_name, e))?;
            Ok(WorktreeDto {
                path: wt
                    .path()
                    .to_str()
                    .ok_or_else(|| "Invalid path".to_string())?
                    .to_string(),
                name: wt_name.to_string(),
            })
        })
        .collect()
}

#[tauri::command]
fn get_repos() -> Result<Vec<RepositoryDto>, String> {
    let config = Config::load();
    config
        .repositories
        .into_iter()
        .map(|repo_config| {
            Ok(RepositoryDto {
                path: repo_config
                    .path
                    .to_str()
                    .ok_or_else(|| "Invalid path".to_string())?
                    .to_string(),
                name: repo_config
                    .path
                    .file_name()
                    .ok_or_else(|| "Invalid file name".to_string())?
                    .to_str()
                    .ok_or_else(|| "Invalid file name string".to_string())?
                    .to_string(),
                worktrees: get_worktrees_for_repo(&repo_config.path)?,
            })
        })
        .collect()
}

#[tauri::command]
fn add_worktree(repo_path: String, worktree_name: String) -> Result<(), String> {
    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;

    let repo_parent = repo
        .workdir()
        .ok_or_else(|| "No workdir".to_string())?
        .parent()
        .ok_or_else(|| "No parent dir".to_string())?;
    let repo_name = repo
        .workdir()
        .ok_or_else(|| "No workdir".to_string())?
        .file_name()
        .ok_or_else(|| "No file name".to_string())?
        .to_str()
        .ok_or_else(|| "Invalid string".to_string())?;
    let worktree_path = repo_parent
        .join(format!("{}.worktrees", repo_name))
        .join(&worktree_name);
    repo.worktree(&worktree_name, &worktree_path, None)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_worktree(repo_path: String, worktree_name: String) -> Result<(), String> {
    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;
    let worktree = repo
        .find_worktree(&worktree_name)
        .map_err(|e| e.to_string())?;

    // Remove the worktree on disk
    fs::remove_dir_all(worktree.path()).map_err(|e| e.to_string())?;

    // Prune the worktree from the repository
    repo.find_worktree(&worktree_name)
        .map_err(|e| e.to_string())?
        .prune(None)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_in_vscode<R: Runtime>(app: AppHandle<R>, path: String) -> Result<(), String> {
    app.opener()
        .open_path(path, Some("/Applications/Visual Studio Code.app"))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_repos,
            add_worktree,
            delete_worktree,
            open_in_vscode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
