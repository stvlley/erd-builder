"use client";

import { useState, useMemo, useCallback } from "react";
import { ERDState, ERDAction } from "@/types/erd";
import { COLORS } from "@/lib/constants";

interface GridViewProps {
  state: ERDState;
  dispatch: React.Dispatch<ERDAction>;
}

export default function GridView({ state, dispatch }: GridViewProps) {
  const { tables, relationships } = state;
  const [hoveredCol, setHoveredCol] = useState<{ tableId: string; columnId: string } | null>(null);

  const tableList = useMemo(() => Object.values(tables), [tables]);

  // Build a map: columnKey -> set of related columnKeys via relationships
  const relatedMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const rel of relationships) {
      const fromKey = `${rel.fromTableId}:${rel.fromColumnId}`;
      const toKey = `${rel.toTableId}:${rel.toColumnId}`;
      if (!map.has(fromKey)) map.set(fromKey, new Set());
      if (!map.has(toKey)) map.set(toKey, new Set());
      map.get(fromKey)!.add(toKey);
      map.get(toKey)!.add(fromKey);
    }
    return map;
  }, [relationships]);

  // Get all highlighted column keys when hovering
  const highlightedCols = useMemo(() => {
    if (!hoveredCol) return new Set<string>();
    const key = `${hoveredCol.tableId}:${hoveredCol.columnId}`;
    const related = relatedMap.get(key);
    const set = new Set<string>();
    set.add(key);
    if (related) {
      for (const r of related) set.add(r);
    }
    return set;
  }, [hoveredCol, relatedMap]);

  const isHighlighted = useCallback(
    (tableId: string, columnId: string) => {
      if (!hoveredCol) return false;
      return highlightedCols.has(`${tableId}:${columnId}`);
    },
    [hoveredCol, highlightedCols]
  );

  const isHoveredCol = useCallback(
    (tableId: string, columnId: string) => {
      return hoveredCol?.tableId === tableId && hoveredCol?.columnId === columnId;
    },
    [hoveredCol]
  );

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        background: COLORS.canvas,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          alignItems: "start",
        }}
      >
        {tableList.map((table) => (
          <div
            key={table.id}
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.borderDim}`,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${COLORS.borderDim}`,
                borderLeft: `3px solid ${table.color}`,
                background: table.color + "10",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: table.color,
                }}
              >
                {table.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 8,
                  letterSpacing: "0.15em",
                  color: table.color + "88",
                  marginTop: 2,
                  textTransform: "uppercase",
                }}
              >
                {table.columns.length} columns
              </div>
            </div>

            {/* Column rows */}
            <div>
              {table.columns
                .filter((col) => !col.collapsed)
                .map((col, idx) => {
                  const highlighted = isHighlighted(table.id, col.id);
                  const isSource = isHoveredCol(table.id, col.id);
                  const hasRelationship = relatedMap.has(`${table.id}:${col.id}`);

                  return (
                    <div
                      key={col.id}
                      onMouseEnter={() =>
                        setHoveredCol({ tableId: table.id, columnId: col.id })
                      }
                      onMouseLeave={() => setHoveredCol(null)}
                      onClick={() => {
                        dispatch({
                          type: "SELECT_TABLE",
                          tableId: table.id,
                        });
                        dispatch({
                          type: "SET_SIDEBAR",
                          sidebar: { type: "edit-table", tableId: table.id },
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 14px",
                        fontSize: 11,
                        fontFamily: "var(--font-mono), monospace",
                        cursor: hasRelationship ? "pointer" : "default",
                        background: isSource
                          ? COLORS.accent + "20"
                          : highlighted
                          ? COLORS.accent + "10"
                          : idx % 2 === 0
                          ? "transparent"
                          : "#ffffff02",
                        borderLeft: highlighted
                          ? `3px solid ${COLORS.accent}`
                          : "3px solid transparent",
                        transition: "background 0.1s, border-color 0.1s",
                      }}
                    >
                      {/* Badges */}
                      <span
                        style={{
                          width: 20,
                          flexShrink: 0,
                          fontSize: 7,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          color: col.isPrimaryKey
                            ? "#facc15"
                            : col.isForeignKey
                            ? "#818CF8"
                            : "transparent",
                        }}
                      >
                        {col.isPrimaryKey ? "PK" : col.isForeignKey ? "FK" : ""}
                      </span>

                      {/* Column name */}
                      <span
                        style={{
                          flex: 1,
                          color: highlighted
                            ? COLORS.accent
                            : col.isPrimaryKey
                            ? COLORS.text
                            : COLORS.textDim,
                          fontWeight: col.isPrimaryKey || highlighted ? 700 : 400,
                        }}
                      >
                        {col.name}
                      </span>

                      {/* Type */}
                      <span
                        style={{
                          fontSize: 8,
                          color: COLORS.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {col.type}
                      </span>

                      {/* Relationship indicator */}
                      {hasRelationship && (
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: highlighted
                              ? COLORS.accent
                              : COLORS.textMuted,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
