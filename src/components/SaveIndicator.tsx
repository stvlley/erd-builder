import { COLORS } from "@/lib/constants";
import type { SaveStatus } from "@/lib/erd-persistence";

interface SaveIndicatorProps {
  status: SaveStatus;
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const config = {
    saving: { text: "SAVING...", color: COLORS.textDim },
    saved: { text: "SAVED", color: "#34D399" },
    error: { text: "SAVE ERROR", color: "#ef4444" },
  } as const;

  const { text, color } = config[status];

  return (
    <div
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 9,
        color,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}
