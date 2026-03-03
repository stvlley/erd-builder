import { memo, useMemo } from "react";
import { Table, ERDState } from "@/types/erd";
import { TABLE_W } from "@/lib/constants";
import { getFieldY, getFieldSuffix } from "@/lib/geometry";

interface JoinHighlightProps {
  tables: Record<string, Table>;
  hoveredField: ERDState["hoveredField"];
}

/**
 * Pre-built suffix index: suffix -> [{ tableId, table, columnId }]
 * Built once via useMemo when tables change, so hover only does an O(1) Map lookup.
 */
export default memo(function JoinHighlight({ tables, hoveredField }: JoinHighlightProps) {
  // Build suffix index once when tables change (not on every hover)
  const suffixIndex = useMemo(() => {
    const index = new Map<string, { tableId: string; table: Table; columnId: string }[]>();
    for (const table of Object.values(tables)) {
      for (const col of table.columns) {
        if (col.collapsed) continue;
        const suffix = getFieldSuffix(col.name);
        let arr = index.get(suffix);
        if (!arr) {
          arr = [];
          index.set(suffix, arr);
        }
        arr.push({ tableId: table.id, table, columnId: col.id });
      }
    }
    return index;
  }, [tables]);

  if (!hoveredField) return null;

  const { suffix } = hoveredField;
  const matches = suffixIndex.get(suffix);
  if (!matches || matches.length < 2) return null;

  // Only draw lines between distinct tables (cap to avoid O(m^2) explosion)
  const MAX_LINES = 50;
  const lines: { path: string; midX: number; midY: number; key: string }[] = [];

  outer:
  for (let a = 0; a < matches.length; a++) {
    for (let b = a + 1; b < matches.length; b++) {
      if (matches[a].tableId === matches[b].tableId) continue;
      const A = matches[a];
      const B = matches[b];
      const ay = getFieldY(A.table, A.columnId);
      const by = getFieldY(B.table, B.columnId);
      if (ay === -1 || by === -1) continue;

      const aCX = A.table.x + TABLE_W / 2;
      const bCX = B.table.x + TABLE_W / 2;

      let ax: number, bx: number;
      if (bCX >= aCX) {
        ax = A.table.x + TABLE_W;
        bx = B.table.x;
      } else {
        ax = A.table.x;
        bx = B.table.x + TABLE_W;
      }

      const dx = Math.abs(bx - ax);
      const cx = Math.max(40, dx * 0.4);
      const dA = ax === A.table.x + TABLE_W ? 1 : -1;
      const dB = bx === B.table.x ? -1 : 1;

      lines.push({
        path: `M${ax},${ay} C${ax + dA * cx},${ay} ${bx + dB * cx},${by} ${bx},${by}`,
        midX: (ax + bx) / 2,
        midY: (ay + by) / 2,
        key: `${A.tableId}-${B.tableId}-${suffix}`,
      });

      if (lines.length >= MAX_LINES) break outer;
    }
  }

  return (
    <>
      {lines.map((l) => (
        <g key={l.key}>
          <path
            d={l.path}
            fill="none"
            stroke="#818CF8"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            markerEnd="url(#arr-join)"
            filter="url(#glow)"
            opacity={0.8}
          />
          <rect
            x={l.midX - 26}
            y={l.midY - 10}
            width={52}
            height={18}
            fill="#1c1c1e"
            stroke="#818CF8"
            strokeWidth={1}
          />
          <text
            x={l.midX}
            y={l.midY + 4}
            textAnchor="middle"
            fill="#818CF8"
            fontSize={8.5}
            fontFamily="var(--font-mono), monospace"
            letterSpacing="0.08em"
          >
            JOIN:{suffix}
          </text>
        </g>
      ))}
    </>
  );
});
