import { COLORS } from "@/lib/constants";

export default function StatsFooter() {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderTop: `1px solid ${COLORS.borderDim}`,
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 9,
          color: COLORS.textMuted,
          letterSpacing: "0.08em",
        }}
      >
        DOUBLE-CLICK TABLE TO EDIT &nbsp;·&nbsp; HOVER FIELDS FOR JOIN MATCHES
        &nbsp;·&nbsp; DRAG TABLES TO REPOSITION
      </div>
    </div>
  );
}
