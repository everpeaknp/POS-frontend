/**
 * Offline / sync IPC — keep in sync with lib/desktop/channels.ts
 */
export const OFFLINE_IPC = {
  STATUS: "desktop:offline:status",
  ENQUEUE: "desktop:offline:enqueue",
  SYNC_NOW: "desktop:offline:syncNow",
  QUEUE_STATS: "desktop:offline:queueStats",
  CACHE_GET: "desktop:offline:cacheGet",
  CACHE_PUT: "desktop:offline:cachePut",
  CACHE_LIST: "desktop:offline:cacheList",
  LOGS: "desktop:offline:logs",
} as const;
