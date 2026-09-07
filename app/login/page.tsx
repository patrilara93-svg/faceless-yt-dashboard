"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push(params.get("next") || "/");
      router.refresh();
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-panelborder bg-panel p-8 shadow-xl"
      >
        <h1 className="mb-1 text-xl font-semibold text-neutral-100">🎬 Panel de Control</h1>
        <p className="mb-6 text-sm text-neutral-400">YouTube Faceless Pipeline</p>

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Contraseña
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-panelborder bg-canvas px-3 py-2 text-sm text-neutral-100 outline-none focus:border-accent"
          placeholder="••••••••"
        />

        {error && <p className="mb-4 text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
