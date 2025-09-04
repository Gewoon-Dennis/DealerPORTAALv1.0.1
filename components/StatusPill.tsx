export default function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Ingediend: { bg: "#e6f7f5", color: "#0d9b90" },
    "In behandeling": { bg: "#eef2ff", color: "#4f46e5" },
    Goedgekeurd: { bg: "#ecfdf5", color: "#047857" },
    Afgewezen: { bg: "#fef2f2", color: "#b91c1c" },
  };
  const s = map[status] || { bg: "#eee", color: "#333" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}
