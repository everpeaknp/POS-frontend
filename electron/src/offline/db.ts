import fs from "fs";
import path from "path";
import { app } from "electron";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { MIGRATIONS } from "./migrations";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let dbPath = "";

function nowIso() {
  return new Date().toISOString();
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  // Locate wasm next to sql.js package
  const wasmPath = path.join(
    path.dirname(require.resolve("sql.js")),
    "sql-wasm.wasm"
  );
  SQL = await initSqlJs({
    locateFile: (file) => {
      if (file.endsWith(".wasm") && fs.existsSync(wasmPath)) return wasmPath;
      return path.join(path.dirname(require.resolve("sql.js")), file);
    },
  });
  return SQL;
}

function persist() {
  if (!db || !dbPath) return;
  const data = db.export();
  const tmp = `${dbPath}.tmp`;
  fs.writeFileSync(tmp, Buffer.from(data));
  fs.renameSync(tmp, dbPath);
}

function run(sql: string, params: unknown[] = []) {
  if (!db) throw new Error("Local DB not initialized");
  db.run(sql, params as never[]);
}

function getAll<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T[] {
  if (!db) throw new Error("Local DB not initialized");
  const stmt = db.prepare(sql);
  stmt.bind(params as never[]);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function getOne<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T | null {
  return getAll<T>(sql, params)[0] ?? null;
}

function applyMigrations() {
  run(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  )`);

  const applied = new Set(
    getAll<{ version: number }>(`SELECT version FROM schema_migrations`).map(
      (r) => Number(r.version)
    )
  );

  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    db!.run("BEGIN");
    try {
      // exec supports multiple statements (run does not)
      db!.exec(m.sql);
      run(`INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)`, [
        m.version,
        nowIso(),
      ]);
      db!.run("COMMIT");
    } catch (e) {
      db!.run("ROLLBACK");
      throw e;
    }
  }
  persist();
}

export async function initLocalDb(): Promise<void> {
  if (db) return;
  const dir = path.join(app.getPath("userData"), "offline");
  fs.mkdirSync(dir, { recursive: true });
  dbPath = path.join(dir, "khata-offline.sqlite");

  const sqljs = await loadSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new sqljs.Database(buf);
  } else {
    db = new sqljs.Database();
  }

  applyMigrations();
  setMeta("db_initialized_at", getMeta("db_initialized_at") || nowIso());
  persist();
}

export function getDbPath() {
  return dbPath;
}

export function setMeta(key: string, value: string) {
  run(
    `INSERT INTO meta(key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
  persist();
}

export function getMeta(key: string): string | null {
  const row = getOne<{ value: string }>(`SELECT value FROM meta WHERE key = ?`, [
    key,
  ]);
  return row?.value ?? null;
}

export type QueueItemInput = {
  clientMutationId: string;
  method: string;
  url: string;
  body?: string | null;
  headers?: Record<string, string>;
  priority?: number;
};

export type QueueRow = {
  id: string;
  client_mutation_id: string;
  method: string;
  url: string;
  body: string | null;
  headers: string | null;
  priority: number;
  status: string;
  retries: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  next_attempt_at: string | null;
};

export function enqueueMutation(input: QueueItemInput): QueueRow {
  const id = input.clientMutationId;
  const ts = nowIso();
  run(
    `INSERT INTO sync_queue(
      id, client_mutation_id, method, url, body, headers,
      priority, status, retries, max_retries, created_at, updated_at, next_attempt_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, 8, ?, ?, ?)
    ON CONFLICT(client_mutation_id) DO NOTHING`,
    [
      id,
      input.clientMutationId,
      input.method.toUpperCase(),
      input.url,
      input.body ?? null,
      input.headers ? JSON.stringify(input.headers) : null,
      input.priority ?? 50,
      ts,
      ts,
      ts,
    ]
  );
  persist();
  const row = getOne<QueueRow>(
    `SELECT * FROM sync_queue WHERE client_mutation_id = ?`,
    [input.clientMutationId]
  );
  if (!row) throw new Error("Failed to enqueue mutation");
  return row;
}

export function listPendingQueue(limit = 25): QueueRow[] {
  return getAll<QueueRow>(
    `SELECT * FROM sync_queue
     WHERE status IN ('pending', 'failed')
       AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
     ORDER BY priority DESC, created_at ASC
     LIMIT ?`,
    [nowIso(), limit]
  );
}

export function markQueue(
  id: string,
  patch: {
    status: string;
    last_error?: string | null;
    retries?: number;
    next_attempt_at?: string | null;
  }
) {
  run(
    `UPDATE sync_queue SET
      status = ?,
      last_error = COALESCE(?, last_error),
      retries = COALESCE(?, retries),
      next_attempt_at = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      patch.status,
      patch.last_error ?? null,
      patch.retries ?? null,
      patch.next_attempt_at ?? null,
      nowIso(),
      id,
    ]
  );
  persist();
}

export function queueStats() {
  const rows = getAll<{ status: string; c: number }>(
    `SELECT status, COUNT(*) as c FROM sync_queue GROUP BY status`
  );
  const stats: Record<string, number> = {
    pending: 0,
    processing: 0,
    failed: 0,
    done: 0,
    conflict: 0,
  };
  for (const r of rows) stats[r.status] = Number(r.c);
  return stats;
}

export function putEntity(
  entity: string,
  recordId: string,
  payload: unknown,
  version?: string | null
) {
  run(
    `INSERT INTO entity_cache(entity, record_id, payload, version, deleted_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?)
     ON CONFLICT(entity, record_id) DO UPDATE SET
       payload = excluded.payload,
       version = excluded.version,
       deleted_at = NULL,
       updated_at = excluded.updated_at`,
    [entity, recordId, JSON.stringify(payload), version ?? null, nowIso()]
  );
  persist();
}

export function getEntity(entity: string, recordId: string): unknown | null {
  const row = getOne<{ payload: string; deleted_at: string | null }>(
    `SELECT payload, deleted_at FROM entity_cache WHERE entity = ? AND record_id = ?`,
    [entity, recordId]
  );
  if (!row || row.deleted_at) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

export function listEntities(entity: string, limit = 200): unknown[] {
  const rows = getAll<{ payload: string }>(
    `SELECT payload FROM entity_cache
     WHERE entity = ? AND deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT ?`,
    [entity, limit]
  );
  return rows.map((r) => {
    try {
      return JSON.parse(r.payload);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function appendLog(level: string, event: string, detail?: unknown) {
  run(
    `INSERT INTO sync_log(level, event, detail, created_at) VALUES (?, ?, ?, ?)`,
    [level, event, detail ? JSON.stringify(detail) : null, nowIso()]
  );
  // Keep log slim
  run(
    `DELETE FROM sync_log WHERE id NOT IN (
      SELECT id FROM sync_log ORDER BY id DESC LIMIT 500
    )`
  );
  persist();
}

export function recentLogs(limit = 50) {
  return getAll(
    `SELECT id, level, event, detail, created_at FROM sync_log ORDER BY id DESC LIMIT ?`,
    [limit]
  );
}

export function setCursor(entity: string, cursor: string | null, updatedAfter: string | null) {
  run(
    `INSERT INTO sync_cursor(entity, cursor, updated_after, last_pulled_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(entity) DO UPDATE SET
       cursor = excluded.cursor,
       updated_after = excluded.updated_after,
       last_pulled_at = excluded.last_pulled_at`,
    [entity, cursor, updatedAfter, nowIso()]
  );
  persist();
}

export function getCursor(entity: string) {
  return getOne<{
    entity: string;
    cursor: string | null;
    updated_after: string | null;
    last_pulled_at: string | null;
  }>(`SELECT * FROM sync_cursor WHERE entity = ?`, [entity]);
}

export function vacuumHint() {
  // sql.js has limited VACUUM; persist is enough for v1
  persist();
}
