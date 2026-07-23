import { app } from "electron";
import fs from "fs";
import path from "path";
import os from "os";
import { getDbPath } from "../offline/db";
import { queueStats } from "../offline/db";
import { vaultIsEncrypted } from "./vault";
import { listCapabilities, getCurrentRole } from "./permissions";
import { getAuditFilePath } from "./audit";

export type DiagnosticsSnapshot = {
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  packaged: boolean;
  uptimeSec: number;
  memory: NodeJS.MemoryUsage;
  system: {
    totalMem: number;
    freeMem: number;
    cpus: number;
    loadavg: number[];
  };
  paths: {
    userData: string;
    logs: string;
    offlineDb: string;
    auditLog: string;
  };
  security: {
    vaultEncrypted: boolean;
    role: string;
    capabilities: string[];
  };
  offline: {
    queue: Record<string, number>;
    dbExists: boolean;
    dbSizeBytes: number;
  };
};

export function getDiagnostics(): DiagnosticsSnapshot {
  const offlineDb = (() => {
    try {
      return getDbPath();
    } catch {
      return "";
    }
  })();

  let dbSize = 0;
  if (offlineDb && fs.existsSync(offlineDb)) {
    dbSize = fs.statSync(offlineDb).size;
  }

  let queue: Record<string, number> = {};
  try {
    queue = queueStats();
  } catch {
    queue = {};
  }

  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    uptimeSec: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    system: {
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      cpus: os.cpus().length,
      loadavg: os.loadavg(),
    },
    paths: {
      userData: app.getPath("userData"),
      logs: path.join(app.getPath("userData"), "logs"),
      offlineDb,
      auditLog: getAuditFilePath(),
    },
    security: {
      vaultEncrypted: vaultIsEncrypted(),
      role: getCurrentRole(),
      capabilities: listCapabilities(),
    },
    offline: {
      queue,
      dbExists: Boolean(offlineDb && fs.existsSync(offlineDb)),
      dbSizeBytes: dbSize,
    },
  };
}
