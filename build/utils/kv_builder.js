import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import toml from "toml";

const PROJECT_ROOT = path.resolve(path.join(import.meta.dirname, "../../"));
const DATA_DIR = path.join(PROJECT_ROOT, "build/kv-data");
const WRANGLER_TOML = path.join(PROJECT_ROOT, "wrangler.toml");

function getKVBinding() {
  if (!fs.existsSync(WRANGLER_TOML)) {
    console.error("Can't find wrangler.tom, unable to confirm KV binding.");
    process.exit(1);
  }

  const config = toml.parse(fs.readFileSync(WRANGLER_TOML, "utf8"));
  const kvs = config.kv_namespaces;
  if (!kvs || kvs.length === 0) {
    console.error("[[kv_namespaces]] is not defined in wrangler.toml");
    process.exit(1);
  }

  const binding = kvs[0].binding;
  console.log(`Found KV binding: ${binding}`);
  return binding;
}

// === 3. 获取文件列表 ===
function getFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Dir ${dir} does not exist`);
    process.exit(1);
  }
  const entries = fs.readdirSync(dir);
  const files = entries.map(f => path.join(dir, f)).filter(f => fs.statSync(f).isFile());
  if (files.length === 0) {
    console.log("Found no json file.");
    process.exit(0);
  }
  return files;
}

// === 4. 上传函数 ===
function uploadToKV(binding, files) {
  for (const file of files) {
    const key = path.basename(file);
    console.log(`Uploading ${key} to KV...`);
    const result = spawnSync(
      "npx",
      ["wrangler", "kv", "key", "put", key, "--binding", binding, "--path", file],
      { cwd: PROJECT_ROOT, stdio: "inherit" }
    );

    if (result.status !== 0) {
      console.error(`Upload failed:: ${key}`);
      process.exit(result.status);
    }
  }
  console.log("All json has pulled to KV.");
}

const kvBinding = getKVBinding();
const files = getFiles(DATA_DIR);
uploadToKV(kvBinding, files);
