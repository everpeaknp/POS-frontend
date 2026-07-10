import fs from "fs";
import path from "path";

const root = path.join(process.cwd());

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

const skip = new Set([
  path.join(root, "components", "shared", "KhataSpinner.tsx"),
  path.join(root, "components", "shared", "PageLoader.tsx"),
  path.join(root, "lib", "icons", "lucide-react-shim.tsx"),
]);

const patterns = [
  // {submitting ? (<> Saving...</>) : "Save"} -> {submitting ? "Saving..." : "Save"}
  [
    /\{(\w+) \? \(\s*<>\s*([\s\S]*?)\s*<\/>\s*\) :/g,
    (match, cond, text) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.includes("<")) return match;
      return `{${cond} ? "${trimmed.replace(/"/g, '\\"')}" :`;
    },
  ],
  // Remove unused Loader2 import when not referenced in JSX
];

let changed = 0;
for (const file of walk(root)) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  const orig = src;

  for (const [re, rep] of patterns) {
    src = typeof rep === "function" ? src.replace(re, rep) : src.replace(re, rep);
  }

  if (src.includes("Loader2") && !src.includes("<Loader2")) {
    src = src.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["'];?\n?/g,
      (imp, names) => {
        const kept = names
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n && n !== "Loader2");
        if (kept.length === names.split(",").filter((n) => n.trim()).length) return imp;
        if (kept.length === 0) return "";
        return `import { ${kept.join(", ")} } from "lucide-react";\n`;
      },
    );
  }

  if (src.includes('KhataSpinner') && !src.includes("<KhataSpinner")) {
    src = src.replace(
      /import\s*\{[^}]*KhataSpinner[^}]*\}\s*from\s*["']@\/components\/shared\/KhataSpinner["'];?\n?/g,
      "",
    );
  }

  if (src !== orig) {
    fs.writeFileSync(file, src);
    changed++;
    console.log("updated:", path.relative(root, file));
  }
}

console.log("files changed:", changed);
