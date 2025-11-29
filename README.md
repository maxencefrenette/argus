# Argus

Desktop helper for managing git worktrees.

## Configuration

The app reads `~/.config/argus/config.toml` at startup. `editor` is required. Example:

```
editor = "code" # command used to open a repo/worktree

[[repositories]]
path = "/path/to/repo"
```

`editor` can be any CLI command that accepts the target path as its first argument (e.g. `code`, `cursor`, `antigravity`).
