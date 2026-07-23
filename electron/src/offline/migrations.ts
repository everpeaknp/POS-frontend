/** Schema migrations — applied in order. Never edit applied SQL; add a new version. */
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_cursor (
        entity TEXT PRIMARY KEY NOT NULL,
        cursor TEXT,
        updated_after TEXT,
        last_pulled_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY NOT NULL,
        client_mutation_id TEXT NOT NULL UNIQUE,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        body TEXT,
        headers TEXT,
        priority INTEGER NOT NULL DEFAULT 50,
        status TEXT NOT NULL DEFAULT 'pending',
        retries INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 8,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        next_attempt_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sync_queue_status
        ON sync_queue(status, priority DESC, created_at ASC);

      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        event TEXT NOT NULL,
        detail TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS entity_cache (
        entity TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        version TEXT,
        deleted_at TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (entity, record_id)
      );

      CREATE INDEX IF NOT EXISTS idx_entity_cache_updated
        ON entity_cache(entity, updated_at);

      CREATE TABLE IF NOT EXISTS file_cache (
        cache_key TEXT PRIMARY KEY NOT NULL,
        file_path TEXT NOT NULL,
        mime TEXT,
        size INTEGER,
        updated_at TEXT NOT NULL
      );
    `,
  },
];
