// components/ui.tsx
export function btn({
  kind,
}: {
  kind: "primary" | "secondary" | "ghost" | "disabled";
}) {
  const base: React.CSSProperties = {
    border: "1px solid transparent",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };
  if (kind === "primary")
    return { ...base, background: "#00C7B7", color: "#fff" };
  if (kind === "secondary")
    return {
      ...base,
      background: "#f5f5f5",
      color: "#111",
      borderColor: "#e5e5e5",
    };
  if (kind === "ghost")
    return {
      ...base,
      background: "transparent",
      color: "#00C7B7",
      borderColor: "#c7f2ef",
    };
  if (kind === "disabled")
    return {
      ...base,
      background: "#e5e5e5",
      color: "#999",
      cursor: "not-allowed",
    };
  return base;
}
export function input(extra: { minW?: number } = {}) {
  return {
    width: "100%",
    minWidth: extra.minW || undefined,
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
    background: "#fff",
    color: "#111",
    WebkitTextFillColor: "#111",
  } as React.CSSProperties;
}
export function card() {
  return {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 16,
  } as React.CSSProperties;
}
export function h3() {
  return {
    margin: 0,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: 800,
    color: "#111",
  } as React.CSSProperties;
}
