import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import type { HistoryRecord } from "@/lib/types";

function parseMaybeJson(raw: unknown): HistoryRecord {
  if (typeof raw === "object" && raw !== null) return raw as HistoryRecord;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

export async function GET() {
  try {
    const redis = getRedis();
    const raw = await redis.lrange<unknown>(KEYS.history, 0, -1);
    return NextResponse.json({ history: raw.map(parseMaybeJson) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo el historial." },
      { status: 500 }
    );
  }
}
