"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "./StatCard";
import { Panel } from "./Panel";
import type { HistoryRecord, QuotaPayload, ServicesPayload, StatusPayload } from "@/lib/types";

const PHASE_LABELS: Record<string, string> = {
  guion: "📝 Guion",
  locucion: "🎤️ Locución",
  subtitulos: "💬 Subtítulos",
  montaje: "🏞️ Montaje",
  miniatura: "🖼️ Miniatura",
  metadatos: "🔖 Metadatos SEO",
  publicacion: "⬆️ Publicando en YouTube",
  completado: "✅ Completado",
  error: "❌ Error",
};

const REFRESH_MS = 15000;

function timeAgo(seconds?: number): string {
  if (!seconds) return "—";
  const diff = Date.now() / 1000 - seconds;
  if (diff < 60) return `hace ${Math.max(0, Math.round(diff))}s`;
  if (diff < 3600) return `hace ${Math.round(diff / 60)} min`;
  return `hace ${Math.round(diff / 3600)} h`;
}

function formatDate(seconds?: number): string {
  if (!seconds) return "—";
  return new Date(seconds * 1000).toLocaleString("es-ES");
}

export function DashboardClient() {
  const router = useRouter();

  const [status, setStatus] = useState<StatusPayload>({});
  const [quota, setQuota] = useState<QuotaPayload>({});
  const [services, setServices] = useState<ServicesPayload>({});
  const [queue, setQueue] = useState<{ topic: string }[]>([]);
  const [pending, setPending] = useState<{ topic: string }[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);

  const [newTopic, setNewTopic] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  const [triggering, setTriggering] = useState<"short" | "long" | null>(null);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [statusRes, queueRes, historyRes] = await Promise.all([
        fetch("/api/status", { cache: "no-store" }),
        fetch("/api/queue", { cache: "no-store" }),
        fetch("/api/history", { cache: "no-store" }),
      ]);

      if (statusRes.status === 401 || queueRes.status === 401 || historyRes.status === 401) {
        router.push("/login");
        return;
      }

      const statusData = await statusRes.json();
      const queueData = await queueRes.json();
      const historyData = await historyRes.json();

      if (!statusRes.ok) throw new Error(statusData.error || "Error cargando estado.");
      if (!queueRes.ok) throw new Error(queueData.error || "Error cargando la cola.");
      if (!historyRes.ok) throw new Error(historyData.error || "Error cargando el historial.");

      setStatus(statusData.status ?? {});
      setQuota(statusData.quota ?? {});
      setServices(statusData.services ?? {});
      setQueue(queueData.queue ?? []);
      setPending(queueData.pending_additions ?? []);
      setHistory(historyData.history ?? []);
      setLoadError(null);
      setLastLoaded(Date.now() / 1000);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error desconocido cargando datos.");
    }
  }, [router]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  async function handleAddTopic(e: FormEvent) {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setAddingTopic(true);
    setAddMessage(null);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo añadir el tema.");
      setAddMessage(data.message ?? "Tema añadido.");
      setNewTopic("");
      loadAll();
    } catch (err) {
      setAddMessage(err instanceof Error ? err.message : "Error añadiendo el tema.");
    } finally {
      setAddingTopic(false);
    }
  }

  async function handleTrigger(format: "short" | "long") {
    setTriggering(format);
    setTriggerMessage(null);
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo lanzar la generación.");
      setTriggerMessage(data.message ?? "Petición enviada.");
    } catch (err) {
      setTriggerMessage(err instanceof Error ? err.message : "Error lanzando la generación.");
    } finally {
      setTriggering(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  const quotaUsed = quota.units_used ?? 0;
  const quotaLimit = quota.daily_limit ?? 10000;
  const quotaPct = quotaLimit > 0 ? Math.min(100, Math.round((quotaUsed / quotaLimit) * 100)) : 0;
  const quotaTone = quota.over_soft_threshold ? "danger" : quotaPct > 60 ? "warning" : "success";

  const publishedOk = history.filter((h) => h.status === "ok" || h.status === "publicado").length;
  const publishedErr = history.filter((h) => h.status === "error").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">🎬 YouTube Faceless — Panel de Control</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {lastLoaded ? `Actualizado ${timeAgo(lastLoaded)}` : "Cargando..."} · se refresca cada{" "}
            {REFRESH_MS / 1000}s
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-panelborder px-3 py-1.5 text-sm text-neutral-400 hover:border-accent hover:text-accent"
        >
          Cerrar sesión
        </button>
      </header>

      {loadError && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
          {loadError}
        </div>
      )}

      {/* Métricas principales */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Cuota YouTube hoy"
          value={`${quotaUsed} / ${quotaLimit}`}
          sublabel={`${quotaPct}% usado${quota.over_soft_threshold ? " — umbral blando alcanzado" : ""}`}
          tone={quotaTone}
        />
        <StatCard
          label="Vídeos publicados"
          value={String(publishedOk)}
          sublabel={publishedErr > 0 ? `${publishedErr} con error` : "sin errores registrados"}
          tone={publishedErr > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Temas en cola"
          value={String(queue.length)}
          sublabel={pending.length > 0 ? `${pending.length} pendiente(s) de sincronizar` : "cola sincronizada"}
        />
        <StatCard
          label="Proveedor de voz"
          value={services.tts_provider === "edge" ? "Edge-TTS (forzado)" : "ElevenLabs + fallback"}
          sublabel={`Privacidad por defecto: ${services.yt_default_privacy ?? "—"}`}
        />
      </div>

      {/* Estado del job actual */}
      <div className="mb-6">
        <Panel title="Estado actual del bot">
          {status.phase ? (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-canvas px-3 py-1 font-medium">
                  {PHASE_LABELS[status.phase] ?? status.phase}
                </span>
                <span className="text-neutral-400">Tema: {status.topic ?? "—"}</span>
                <span className="text-neutral-400">Formato: {status.format ?? "—"}</span>
                <span className="text-neutral-600">{timeAgo(status.updated_at)}</span>
              </div>
              {status.phase === "error" && (
                <p className="text-sm text-accent">
                  {String((status.extra as { error?: string } | undefined)?.error ?? "")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No hay ningún job registrado todavía. En cuanto cron dispare la primera generación,
              aparecerá aquí.
            </p>
          )}
        </Panel>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cola de temas */}
        <Panel title="Cola de temas pendientes">
          <form onSubmit={handleAddTopic} className="mb-4 flex gap-2">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Escribe un tema nuevo..."
              className="flex-1 rounded-lg border border-panelborder bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={addingTopic || !newTopic.trim()}
              className="rounded-lg bg-accent2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {addingTopic ? "..." : "Añadir"}
            </button>
          </form>
          {addMessage && <p className="mb-3 text-xs text-neutral-400">{addMessage}</p>}

          {queue.length === 0 && pending.length === 0 ? (
            <p className="text-sm text-neutral-500">La cola está vacía.</p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {pending.map((item, i) => (
                <li
                  key={`pending-${i}`}
                  className="rounded-lg border border-dashed border-accent2/40 bg-accent2/5 px-3 py-2 text-neutral-300"
                >
                  {item.topic} <span className="text-xs text-accent2">· pendiente de sincronizar</span>
                </li>
              ))}
              {queue.map((item, i) => (
                <li key={`queue-${i}`} className="rounded-lg bg-canvas px-3 py-2 text-neutral-300">
                  {i + 1}. {item.topic}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Generación inmediata */}
        <Panel title="Generar ahora">
          <p className="mb-4 text-sm text-neutral-500">
            Encola una petición de generación inmediata. El Mac la recoge y la lanza en su
            próximo ciclo de sincronización (máx. 1-2 minutos), igual que el pipeline
            programado por cron.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleTrigger("short")}
              disabled={triggering !== null}
              className="flex-1 rounded-lg border border-panelborder bg-canvas px-4 py-3 text-sm font-medium hover:border-accent disabled:opacity-50"
            >
              {triggering === "short" ? "Enviando..." : "⚡ Short ahora"}
            </button>
            <button
              onClick={() => handleTrigger("long")}
              disabled={triggering !== null}
              className="flex-1 rounded-lg border border-panelborder bg-canvas px-4 py-3 text-sm font-medium hover:border-accent disabled:opacity-50"
            >
              {triggering === "long" ? "Enviando..." : "⚡ Largo ahora"}
            </button>
          </div>
          {triggerMessage && <p className="mt-4 text-xs text-neutral-400">{triggerMessage}</p>}
        </Panel>
      </div>

      {/* Historial */}
      <Panel title="Historial de publicaciones">
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay publicaciones registradas.</p>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-panel text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Formato</th>
                  <th className="py-2 pr-3">Tema</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Enlace</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i} className="border-t border-panelborder/60">
                    <td className="py-2 pr-3 text-neutral-400">{formatDate(r.timestamp)}</td>
                    <td className="py-2 pr-3 text-neutral-400">{r.format ?? "—"}</td>
                    <td className="py-2 pr-3">{r.title || r.topic || "—"}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          r.status === "error"
                            ? "text-accent"
                            : r.status === "ok" || r.status === "publicado"
                            ? "text-emerald-400"
                            : "text-neutral-400"
                        }
                      >
                        {r.status ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {r.video_url ? (
                        <a
                          href={r.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent2 hover:underline"
                        >
                          Abrir ▸
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </main>
  );
}
