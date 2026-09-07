export function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-neutral-100",
    warning: "text-amber-400",
    danger: "text-accent",
    success: "text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-panelborder bg-panel p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-neutral-500">{sublabel}</p>}
    </div>
  );
}
