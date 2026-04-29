import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import toml from "toml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(path.join(__dirname, "../../"));
const DATA_DIR = path.join(PROJECT_ROOT, "build/kv-data");
const WRANGLER_TOML = path.join(PROJECT_ROOT, "wrangler.toml");
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

function getKVBinding() {
  if (!fs.existsSync(WRANGLER_TOML)) {
    console.error("Can't find wrangler.toml, unable to confirm KV binding.");
    process.exit(1);
  }

  let config;
  try {
    config = toml.parse(fs.readFileSync(WRANGLER_TOML, "utf8"));
  } catch (err) {
    console.error("Failed to parse wrangler.toml:");
    console.error(err);
    process.exit(1);
  }

  const kvs = config.kv_namespaces;

  if (!Array.isArray(kvs) || kvs.length === 0) {
    console.error("[[kv_namespaces]] is not defined in wrangler.toml");
    process.exit(1);
  }

  const binding = kvs[0]?.binding;

  if (!binding) {
    console.error("First [[kv_namespaces]] entry has no binding field.");
    process.exit(1);
  }

  console.log(`Found KV binding: ${binding}`);
  return binding;
}

function getJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Dir ${dir} does not exist`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir)
    .map((f) => path.join(dir, f))
    .filter((f) => fs.statSync(f).isFile())
    .filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("Found no json file.");
    process.exit(0);
  }

  return files;
}

function uploadToKV(binding, files) {
  for (const file of files) {
    const key = path.basename(file, ".json");

    console.log(`Uploading ${key} to KV from ${file}...`);

    const result = spawnSync(
      NPX,
      [
        "wrangler",
        "kv",
        "key",
        "put",
        key,
        "--binding",
        binding,
        "--path",
        file,
        "--remote",
      ],
      {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
      }
    );

    if (result.status !== 0) {
      console.error(`Upload failed: ${key}`);
      process.exit(result.status ?? 1);
    }
  }

  console.log("All json files have been pushed to KV.");
}

const kvBinding = getKVBinding();
const files = getJsonFiles(DATA_DIR);
uploadToKV(kvBinding, files);