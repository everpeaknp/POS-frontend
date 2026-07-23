# Khata Desktop Shell

Electron host for the **same** Next.js ERP in this package (`../` = `frontend/`).  
No duplicated pages or business logic.

## Architecture

See [`../../ProjectDoc/DESKTOP_ARCHITECTURE.md`](../../ProjectDoc/DESKTOP_ARCHITECTURE.md).

```
frontend/                 ← Next.js App Router ERP + Electron shell
  app/ components/ lib/   ← web UI (unchanged)
  electron/               ← native OS process (this folder)
```

## Prerequisites

1. Django API on `:8000`
2. Next.js on `:3000` (`npm run dev` from `frontend/`)

## Setup

```bash
cd frontend
npm install
npm run desktop:build
```

## Run (development)

Terminal A — Next:

```bash
cd frontend
npm run dev
```

Terminal B — Electron:

```bash
cd frontend
npm run desktop:dev
```

Optional env:

| Variable | Default |
|----------|---------|
| `KHATA_RENDERER_URL` | `http://localhost:3000` |
| `KHATA_API_URL` | `http://127.0.0.1:8000/api` |

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- IPC allowlist in `src/ipc/channels.ts`

## Renderer bridge

From any React code (safe on web):

```ts
import { desktop, isElectron } from "@/lib/desktop";

if (isElectron()) {
  await desktop.printSilent();
}
```

## Packaging

```bash
npm run desktop:dist
```

Configure `electron-builder` publish / code signing before production releases.
