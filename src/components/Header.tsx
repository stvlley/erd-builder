import { COLORS } from "@/lib/constants";
import SaveIndicator from "./SaveIndicator";
import type { SaveStatus } from "@/lib/erd-persistence";

interface HeaderProps {
  tableCount: number;
  relationshipCount: number;
  columnCount: number;
  userName: string;
  userRole: string;
  erdName: string;
  onUpdateName: (name: string) => void;
  saveStatus: SaveStatus;
}

export default function Header({
  tableCount,
  relationshipCount,
  columnCount,
  userName,
  userRole,
  erdName,
  onUpdateName,
  saveStatus,
}: HeaderProps) {
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
        <input
          type="text"
          value={erdName}
          onChange={(e) => onUpdateName(e.target.value)}
          style={{
            fontFamily: "var(--font-display), sans-serif",
            color: COLORS.text,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: "transparent",
            border: "none",
            outline: "none",
            padding: 0,
            width: 260,
          }}
        />
      </div>

      <SaveIndicator status={saveStatus} />

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

        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: COLORS.textDim,
            letterSpacing: "0.05em",
            borderLeft: `1px solid ${COLORS.borderDim}`,
            paddingLeft: 16,
          }}
        >
          {userName}
          {userRole === "admin" && (
            <span style={{ color: COLORS.accent, marginLeft: 6 }}>ADMIN</span>
          )}
        </div>
      </div>
    </div>
  );
}
