#!/usr/bin/env node
/**
 * Lightweight release helper for Argus.
 *
 * Usage:
 *   pnpm release patch
 *   pnpm release minor
 *   pnpm release major
 *   pnpm release 0.3.0        # explicit version
 *   pnpm release patch --no-push
 *
 * Steps:
 *   - ensure git working tree is clean
 *   - compute next version
 *   - update versions in package.json, src-tauri/Cargo.toml,
 *     src-tauri/Cargo.lock and src-tauri/tauri.conf.json
 *   - git commit + tag vX.Y.Z
 *   - push commit and tag (unless --no-push)
 */

import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(new URL(".", import.meta.url).pathname, "..");

const run = (cmd, opts = {}) =>
  execSync(cmd, {
    cwd: repoRoot,
    stdio: "inherit",
    ...opts,
  });

const runQuiet = (cmd) =>
  execSync(cmd, { cwd: repoRoot, stdio: ["ignore", "pipe", "inherit"] })
    .toString()
    .trim();

const usage = () => {
  console.log(`Usage: pnpm release <major|minor|patch|X.Y.Z> [--no-push]`);
  process.exit(1);
};

const arg = process.argv[2];
const noPush = process.argv.includes("--no-push");
if (!arg) usage();

const isSemver = (v) => /^\d+\.\d+\.\d+$/.test(v);

const bump = (current, inc) => {
  const [maj, min, pat] = current.split(".").map(Number);
  switch (inc) {
    case "major":
      return `${maj + 1}.0.0`;
    case "minor":
      return `${maj}.${min + 1}.0`;
    case "patch":
      return `${maj}.${min}.${pat + 1}`;
    default:
      throw new Error(`Unknown bump "${inc}"`);
  }
};

const ensureCleanGit = () => {
  const status = runQuiet("git status --porcelain");
  if (status) {
    console.error("Working tree is dirty. Commit or stash changes first.");
    process.exit(1);
  }
};

const setJsonVersion = async (file, version) => {
  const fullPath = path.join(repoRoot, file);
  const json = JSON.parse(await readFile(fullPath, "utf8"));
  json.version = version;
  await writeFile(fullPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
};

const replaceVersionLine = async (file, pattern, replacement) => {
  const fullPath = path.join(repoRoot, file);
  const content = await readFile(fullPath, "utf8");
  const next = content.replace(pattern, replacement);
  if (next === content) {
    throw new Error(`Did not find version pattern in ${file}`);
  }
  await writeFile(fullPath, next, "utf8");
};

const main = async () => {
  ensureCleanGit();

  const currentVersion = JSON.parse(
    await readFile(path.join(repoRoot, "package.json"), "utf8"),
  ).version;

  const newVersion = isSemver(arg) ? arg : bump(currentVersion, arg);

  console.log(`Releasing ${currentVersion} -> ${newVersion}`);

  await setJsonVersion("package.json", newVersion);
  await setJsonVersion("src-tauri/tauri.conf.json", newVersion);

  await replaceVersionLine(
    "src-tauri/Cargo.toml",
    /^version\s*=\s*".*"/m,
    `version = "${newVersion}"`,
  );

  await replaceVersionLine(
    "src-tauri/Cargo.lock",
    /(name = "argus"\nversion = ")(.*)"/,
    `$1${newVersion}"`,
  );

  run("git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json");
  run(`git commit -m "chore: release v${newVersion}"`);
  run(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

  if (!noPush) {
    run("git push");
    run(`git push origin v${newVersion}`);
  } else {
    console.log("Skipping pushes (requested with --no-push).");
  }

  console.log("Done.");
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
