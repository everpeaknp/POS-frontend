/**
 * Desktop-only axios outbox hook.
 * When offline in Electron, mutating requests are queued with the same
 * method/url/body — API contracts unchanged. No-op on web.
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { isElectron, getDesktopApi } from "@/lib/desktop";
import { isApiNetworkError } from "@/lib/api/client";

const MUTATING = new Set(["post", "put", "patch", "delete"]);

function newMutationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

let installed = false;

export function installDesktopOfflineInterceptor(client: AxiosInstance) {
  if (installed || typeof window === "undefined") return;
  installed = true;

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (!isElectron()) return config;

    const api = getDesktopApi();
    if (!api?.offline) return config;

    // Keep sync engine authorized
    const token = localStorage.getItem("access_token");
    void api.offline.setToken(token);

    const method = (config.method || "get").toLowerCase();
    if (!MUTATING.has(method)) return config;

    // Prefer live network; if browser says offline, enqueue immediately
    if (!navigator.onLine) {
      return enqueueAndShortCircuit(api, config, method);
    }

    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (!isElectron()) return Promise.reject(error);
      const api = getDesktopApi();
      if (!api?.offline) return Promise.reject(error);

      const config = error.config as InternalAxiosRequestConfig | undefined;
      if (!config) return Promise.reject(error);

      const method = (config.method || "get").toLowerCase();
      if (!MUTATING.has(method)) return Promise.reject(error);

      // Network / server unreachable → queue for later (same payload)
      if (isApiNetworkError(error) || !error.response) {
        await enqueueMutation(api, config, method);
        return Promise.resolve({
          data: {
            offline_queued: true,
            client_mutation_id: (config.headers as Record<string, string>)?.[
              "X-Client-Mutation-Id"
            ],
          },
          status: 202,
          statusText: "Accepted (offline queue)",
          headers: {},
          config,
        });
      }

      return Promise.reject(error);
    }
  );
}

async function enqueueAndShortCircuit(
  api: NonNullable<ReturnType<typeof getDesktopApi>>,
  config: InternalAxiosRequestConfig,
  method: string
) {
  const id = await enqueueMutation(api, config, method);
  // Abort the real request by throwing a controlled response path:
  // Use adapter override
  config.adapter = async () => ({
    data: { offline_queued: true, client_mutation_id: id },
    status: 202,
    statusText: "Accepted (offline queue)",
    headers: {},
    config,
  });
  return config;
}

async function enqueueMutation(
  api: NonNullable<ReturnType<typeof getDesktopApi>>,
  config: InternalAxiosRequestConfig,
  method: string
) {
  const clientMutationId = newMutationId();
  const url = buildUrl(config);
  const body =
    typeof config.data === "string"
      ? config.data
      : config.data != null
        ? JSON.stringify(config.data)
        : null;

  await api.offline!.enqueue({
    clientMutationId,
    method: method.toUpperCase(),
    url,
    body,
    headers: {
      "X-Client-Mutation-Id": clientMutationId,
    },
    priority: method === "post" ? 60 : 50,
  });

  return clientMutationId;
}

function buildUrl(config: InternalAxiosRequestConfig) {
  const base = config.baseURL || "";
  const url = config.url || "";
  if (url.startsWith("http")) return url;
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}
