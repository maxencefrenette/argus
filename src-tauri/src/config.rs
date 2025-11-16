use std::fs;
use std::path::{Path, PathBuf};
use toml;

#[derive(serde::Deserialize)]
pub struct Config {
    pub repositories: Vec<RepoConfig>,
}

#[derive(serde::Deserialize)]
pub struct RepoConfig {
    pub path: PathBuf,
}

impl Config {
    pub fn load() -> Self {
        // Load configuration from "~/.config/argus/config.toml"
        let home = std::env::var("HOME").unwrap();
        let config_path = Path::new(&home).join(".config/argus/config.toml");

        let contents = fs::read_to_string(&config_path).unwrap();
        let config = toml::from_str::<Config>(&contents).unwrap();
        config
    }
}
