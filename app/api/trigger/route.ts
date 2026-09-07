import { NextRequest, NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";

/**
 * Webhook para pedir "genera un vídeo ahora". No ejecuta nada directamente
 * (Vercel no tiene acceso al Mac) — encola la petición en Redis y
 * scripts/sync_dashboard.py la recoge en su siguiente ciclo (cada 1-2 min)
 * y lanza scripts/next_video.sh <formato> en el Mac.
 */
export async function POST(req: NextRequest) {
  let body: { format?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const format = (body.format ?? "").trim().toLowerCase();
  if (format !== "short" && format !== "long") {
    return NextResponse.json({ error: 'El campo "format" debe ser "short" o "long".' }, { status: 400 });
  }

  try {
    const redis = getRedis();
    await redis.rpush(
      KEYS.triggerRequests,
      JSON.stringify({ format, requested_at: Date.now() / 1000 })
    );
    return NextResponse.json({
      ok: true,
      message: `Petición registrada. El Mac lanzará la generación de un vídeo "${format}" en cuanto sincronice (máx. 1-2 minutos).`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error registrando la petición." },
      { status: 500 }
    );
  }
}
