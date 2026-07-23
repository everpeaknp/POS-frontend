import { appendLog, vacuumHint } from "./db";
import type { SyncEngine } from "./sync-engine";
import type { NetworkMonitor } from "./network-monitor";

/**
 * Lightweight background worker — scheduled maintenance only.
 * Heavy jobs (backup encryption, image optimize) plug in later waves.
 */
export class BackgroundWorker {
  private sync: SyncEngine;
  private network: NetworkMonitor;
  private timers: NodeJS.Timeout[] = [];

  constructor(sync: SyncEngine, network: NetworkMonitor) {
    this.sync = sync;
    this.network = network;
  }

  start() {
    // Network probe
    this.network.start(12_000);

    // Sync when online
    this.sync.start(25_000);

    // Periodic maintenance
    this.timers.push(
      setInterval(() => {
        try {
          vacuumHint();
          appendLog("debug", "maintenance_tick", {});
        } catch {
          // ignore
        }
      }, 10 * 60_000)
    );

    // Sync immediately when connectivity returns
    let wasOnline = this.network.getSnapshot().apiOk;
    this.network.subscribe((snap) => {
      if (snap.apiOk && !wasOnline) {
        appendLog("info", "connectivity_restored", snap);
        void this.sync.syncNow("connectivity_restored");
      }
      wasOnline = snap.apiOk;
    });
  }

  stop() {
    this.network.stop();
    this.sync.stop();
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
  }
}
