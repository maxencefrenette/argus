mod config;

use config::Config;
use git2::Repository;
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

fn get_worktrees_for_repo(repo_path: &Path) -> Vec<WorktreeDto> {
    let repo = Repository::open(repo_path).unwrap();
    let worktrees = repo.worktrees().unwrap();

    worktrees
        .into_iter()
        .filter_map(|wt_name| wt_name)
        .map(|wt_name| {
            let wt = repo.find_worktree(&wt_name).unwrap();
            WorktreeDto {
                path: wt.path().to_str().unwrap().to_string(),
                name: wt_name.to_string(),
            }
        })
        .collect()
}

#[tauri::command]
fn get_repos() -> Vec<RepositoryDto> {
    let config = Config::load();

    config
        .repositories
        .into_iter()
        .map(|repo_config| RepositoryDto {
            path: repo_config.path.to_str().unwrap().to_string(),
            name: repo_config
                .path
                .file_name()
                .unwrap()
                .to_str()
                .unwrap()
                .to_string(),
            worktrees: get_worktrees_for_repo(&repo_config.path),
        })
        .collect()
}

#[tauri::command]
fn open_in_vscode<R: Runtime>(app: AppHandle<R>, path: String) {
    app.opener()
        .open_path(path, Some("/Applications/Visual Studio Code.app"))
        .unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_repos, open_in_vscode])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
