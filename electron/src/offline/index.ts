import { initLocalDb, getDbPath, getEntity, listEntities, putEntity, recentLogs } from "./db";
import { NetworkMonitor } from "./network-monitor";
import { SyncEngine } from "./sync-engine";
import { BackgroundWorker } from "./worker";

let network: NetworkMonitor | null = null;
let sync: SyncEngine | null = null;
let worker: BackgroundWorker | null = null;
let accessToken: string | null = null;

export async function startOfflineSystem(apiBaseUrl: string) {
  await initLocalDb();
  network = new NetworkMonitor(apiBaseUrl);
  sync = new SyncEngine({
    apiBase: apiBaseUrl,
    network,
    getAccessToken: () => accessToken,
  });
  worker = new BackgroundWorker(sync, network);
  worker.start();
  return { dbPath: getDbPath() };
}

export function stopOfflineSystem() {
  worker?.stop();
  worker = null;
  sync = null;
  network = null;
}

export function setOfflineAccessToken(token: string | null) {
  accessToken = token;
}

export function getOfflineServices() {
  if (!network || !sync) {
    throw new Error("Offline system not started");
  }
  return { network, sync };
}

export function offlineCacheGet(entity: string, id: string) {
  return getEntity(entity, id);
}

export function offlineCachePut(entity: string, id: string, payload: unknown, version?: string) {
  putEntity(entity, id, payload, version);
}

export function offlineCacheList(entity: string, limit?: number) {
  return listEntities(entity, limit);
}

export function offlineLogs(limit?: number) {
  return recentLogs(limit);
}
