import fs from "fs";
import path from "path";
import { app } from "electron";

export type AuditEvent = {
  id: string;
  ts: string;
  category: string;
  action: string;
  userId?: string | null;
  role?: string | null;
  org?: string | null;
  detail?: unknown;
  ok: boolean;
};

const MAX_LINES = 5000;

function auditPath() {
  return path.join(app.getPath("userData"), "logs", "audit.jsonl");
}

function ensureDir() {
  fs.mkdirSync(path.dirname(auditPath()), { recursive: true });
}

function newId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let actor: { userId?: string | null; role?: string | null; org?: string | null } =
  {};

export function setAuditActor(next: {
  userId?: string | null;
  role?: string | null;
  org?: string | null;
}) {
  actor = { ...next };
}

/**
 * Append-only local audit trail (desktop). Optional SIEM shipping is SEC-4.
 */
export function auditLog(
  category: string,
  action: string,
  detail?: unknown,
  ok = true
): AuditEvent {
  ensureDir();
  const event: AuditEvent = {
    id: newId(),
    ts: new Date().toISOString(),
    category,
    action,
    userId: actor.userId ?? null,
    role: actor.role ?? null,
    org: actor.org ?? null,
    detail,
    ok,
  };
  fs.appendFileSync(auditPath(), `${JSON.stringify(event)}\n`, {
    encoding: "utf8",
  });
  trimIfNeeded();
  return event;
}

function trimIfNeeded() {
  const p = auditPath();
  try {
    const lines = fs.readFileSync(p, "utf8").split("\n").filter(Boolean);
    if (lines.length <= MAX_LINES) return;
    const kept = lines.slice(-MAX_LINES);
    fs.writeFileSync(p, `${kept.join("\n")}\n`);
  } catch {
    // ignore
  }
}

export function readAuditLogs(limit = 100): AuditEvent[] {
  ensureDir();
  const p = auditPath();
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf8").split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((l) => {
      try {
        return JSON.parse(l) as AuditEvent;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as AuditEvent[];
}

export function getAuditFilePath() {
  return auditPath();
}
