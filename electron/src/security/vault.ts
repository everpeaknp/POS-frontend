import { safeStorage, app } from "electron";
import fs from "fs";
import path from "path";

/**
 * OS-backed secret vault (DPAPI / Keychain via Electron safeStorage).
 * Falls back to restrictive file mode only if encryption unavailable.
 */

type VaultFile = Record<string, string>;

function vaultPath() {
  return path.join(app.getPath("userData"), "secure", "vault.bin");
}

function ensureDir() {
  fs.mkdirSync(path.dirname(vaultPath()), { recursive: true });
}

function readRaw(): VaultFile {
  ensureDir();
  const p = vaultPath();
  if (!fs.existsSync(p)) return {};
  try {
    const buf = fs.readFileSync(p);
    if (safeStorage.isEncryptionAvailable()) {
      const json = safeStorage.decryptString(buf);
      return JSON.parse(json) as VaultFile;
    }
    // Legacy/dev fallback — not for production secrets
    return JSON.parse(buf.toString("utf8")) as VaultFile;
  } catch {
    return {};
  }
}

function writeRaw(data: VaultFile) {
  ensureDir();
  const json = JSON.stringify(data);
  const p = vaultPath();
  const tmp = `${p}.tmp`;
  if (safeStorage.isEncryptionAvailable()) {
    const enc = safeStorage.encryptString(json);
    fs.writeFileSync(tmp, enc);
  } else {
    fs.writeFileSync(tmp, json, { encoding: "utf8", mode: 0o600 });
  }
  fs.renameSync(tmp, p);
}

export function vaultIsEncrypted() {
  return safeStorage.isEncryptionAvailable();
}

export function vaultSet(key: string, value: string) {
  const data = readRaw();
  data[key] = value;
  writeRaw(data);
}

export function vaultGet(key: string): string | null {
  const data = readRaw();
  return data[key] ?? null;
}

export function vaultDelete(key: string) {
  const data = readRaw();
  if (!(key in data)) return;
  delete data[key];
  writeRaw(data);
}

export function vaultClear() {
  ensureDir();
  const p = vaultPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
