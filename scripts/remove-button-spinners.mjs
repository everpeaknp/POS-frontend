import fs from "fs";
import path from "path";

const root = process.cwd();

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

const skipFiles = new Set([
  path.join(root, "components", "shared", "KhataSpinner.tsx"),
  path.join(root, "components", "shared", "PageLoader.tsx"),
]);

const patterns = [
  [/\n\s*\{isSubmitting && \(\s*\n\s*<KhataSpinner variant="onPrimary"[^/]*\/>\s*\n\s*\)\}/g, ""],
  [/\n\s*\{isSubmitting && <KhataSpinner variant="onPrimary"[^/]*\/>}/g, ""],
  [/\n\s*\{loading && \(\s*\n\s*<KhataSpinner variant="onPrimary"[^/]*\/>\s*\n\s*\)\}/g, ""],
  [/\n\s*\{submitting && \(\s*\n\s*<KhataSpinner variant="onPrimary"[^/]*\/>\s*\n\s*\)\}/g, ""],
  [/\n\s*\{isSubmitting && <Loader2[^/]*\/>}/g, ""],
  [/\n\s*\{submitting \? <Loader2[^/]*\/> : null\}/g, ""],
  [/\n\s*\{loading && <Loader2[^/]*\/>}/g, ""],
  [/\{isLoading && <Loader2[^/]*\/>}/g, ""],
  [/\n\s*\{updating \? <Loader2 className="h-3\.5 w-3\.5 animate-spin" \/> : (<[^>]+>)\}/g, "\n                  $1"],
  [/\n\s*\{updating \? <Loader2 className="h-4 w-4 animate-spin mr-2" \/> : null\}/g, ""],
  [/\n\s*\{submitting \? <Loader2 className="h-4 w-4 animate-spin mr-2" \/> : null\}/g, ""],
  [/\n\s*<Loader2 className="[^"]*animate-spin[^"]*"[^/]*\/>/g, ""],
  [/\n\s*<Loader2 className=\{cn\([^)]*\)\}[^/]*\/>/g, ""],
];

let changed = 0;
for (const file of walk(root)) {
  if (skipFiles.has(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  for (const [re, rep] of patterns) {
    src = src.replace(re, rep);
  }
  if (src !== orig) {
    fs.writeFileSync(file, src);
    changed++;
    console.log("updated:", path.relative(root, file));
  }
}

console.log("files changed:", changed);
