import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import type { QuotaPayload, ServicesPayload, StatusPayload } from "@/lib/types";

function parseMaybeJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw === "object" && raw !== null) return raw as T;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export async function GET() {
  try {
    const redis = getRedis();
    const [statusRaw, quotaRaw, servicesRaw] = await Promise.all([
      redis.get<unknown>(KEYS.status),
      redis.get<unknown>(KEYS.quota),
      redis.get<unknown>(KEYS.services),
    ]);

    const status = parseMaybeJson<StatusPayload>(statusRaw, {});
    const quota = parseMaybeJson<QuotaPayload>(quotaRaw, {});
    const services = parseMaybeJson<ServicesPayload>(servicesRaw, {});

    return NextResponse.json({ status, quota, services });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo el estado." },
      { status: 500 }
    );
  }
}
