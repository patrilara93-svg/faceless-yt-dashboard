import { NextRequest, NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";

function parseMaybeJson(raw: unknown): { topic: string } {
  if (typeof raw === "object" && raw !== null) return raw as { topic: string };
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { topic: raw };
    }
  }
  return { topic: String(raw ?? "") };
}

export async function GET() {
  try {
    const redis = getRedis();
    const [queueRaw, pendingRaw] = await Promise.all([
      redis.lrange<unknown>(KEYS.queueTopics, 0, -1),
      redis.lrange<unknown>(KEYS.queuePendingAdditions, 0, -1),
    ]);

    return NextResponse.json({
      queue: queueRaw.map(parseMaybeJson),
      pending_additions: pendingRaw.map(parseMaybeJson),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo la cola." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { topic?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "El tema no puede estar vacío." }, { status: 400 });
  }
  if (topic.length > 300) {
    return NextResponse.json({ error: "El tema es demasiado largo (máx. 300 caracteres)." }, { status: 400 });
  }

  try {
    const redis = getRedis();
    await redis.rpush(
      KEYS.queuePendingAdditions,
      JSON.stringify({ topic, added_at: Date.now() / 1000 })
    );
    return NextResponse.json({
      ok: true,
      message:
        "Tema añadido. Se incorporará a topics_queue.txt en el Mac en el próximo ciclo de " +
        "sincronización (cada 1-2 minutos).",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error añadiendo el tema." },
      { status: 500 }
    );
  }
}
