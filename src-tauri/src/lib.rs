#[derive(serde::Serialize)]
struct Repository {
    path: String,
    name: String,
}

#[tauri::command]
fn get_repos() -> Vec<Repository> {
    vec![
        Repository {
            path: String::from("/Users/maxence/Repos/srs-benchmark"),
            name: String::from("srs-benchmark"),
        },
        Repository {
            path: String::from("/Users/maxence/Repos/heisenbase"),
            name: String::from("heisenbase"),
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_repos])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
