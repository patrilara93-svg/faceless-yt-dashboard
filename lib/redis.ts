import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/**
 * Cliente Redis compartido con el pipeline del Mac (scripts/sync_dashboard.py
 * habla con la MISMA base de datos usando las mismas dos variables de
 * entorno). Lanza un error explícito si no está configurado, en vez de
 * fallar de forma confusa más abajo.
 */
export function getRedis(): Redis {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Configúralas en " +
        "Vercel → Settings → Environment Variables (ver web/README.md)."
    );
  }

  client = new Redis({ url, token });
  return client;
}

export const KEYS = {
  queueTopics: "dash:queue:topics",
  queuePendingAdditions: "dash:queue:pending_additions",
  triggerRequests: "dash:trigger:requests",
  status: "dash:status",
  quota: "dash:quota",
  services: "dash:services",
  history: "dash:history",
} as const;
