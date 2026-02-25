import { COLORS } from "@/lib/constants";

interface HeaderProps {
  tableCount: number;
  relationshipCount: number;
  columnCount: number;
}

export default function Header({ tableCount, relationshipCount, columnCount }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        borderBottom: `4px solid ${COLORS.muted}`,
        background: COLORS.bg,
        flexShrink: 0,
      }}
    >
      <div style={{ width: 4, height: 36, background: COLORS.accent }} />
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            color: COLORS.accent,
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          ERD BUILDER
        </div>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            color: COLORS.text,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          Entity Relationship Diagram
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 24, alignItems: "flex-end" }}>
        {[
          { label: "TABLES", value: tableCount },
          { label: "COLUMNS", value: columnCount },
          { label: "RELATIONSHIPS", value: relationshipCount },
        ].map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: COLORS.textMuted,
                fontSize: 9,
                letterSpacing: "0.2em",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: COLORS.accent,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
