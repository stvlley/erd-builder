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
  const [search, setSearch] = useState("");

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

  // Search matching
  const query = search.trim().toLowerCase();
  const hasSearch = query.length > 0;

  const isSearchMatch = useCallback(
    (name: string) => {
      if (!hasSearch) return false;
      return name.toLowerCase().includes(query);
    },
    [hasSearch, query]
  );

  // Count search matches per table (for dimming tables with no matches)
  const tableMatchCount = useMemo(() => {
    if (!hasSearch) return null;
    const counts = new Map<string, number>();
    for (const table of tableList) {
      let count = 0;
      if (table.name.toLowerCase().includes(query)) count++;
      for (const col of table.columns) {
        if (col.name.toLowerCase().includes(query)) count++;
      }
      counts.set(table.id, count);
    }
    return counts;
  }, [hasSearch, query, tableList]);

  // Total search match count
  const totalMatches = useMemo(() => {
    if (!tableMatchCount) return 0;
    let sum = 0;
    for (const c of tableMatchCount.values()) sum += c;
    return sum;
  }, [tableMatchCount]);

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        background: COLORS.canvas,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search bar */}
      <div
        style={{
          padding: "12px 24px",
          borderBottom: `1px solid ${COLORS.borderDim}`,
          background: COLORS.bg,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search columns..."
          style={{
            padding: "6px 12px",
            background: COLORS.canvas,
            border: `1px solid ${COLORS.borderDim}`,
            color: COLORS.text,
            fontSize: 11,
            fontFamily: "var(--font-mono), monospace",
            width: 280,
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.borderDim;
          }}
        />
        {hasSearch && (
          <>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                color: totalMatches > 0 ? COLORS.accent : COLORS.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {totalMatches} match{totalMatches !== 1 ? "es" : ""}
            </span>
            <button
              onClick={() => setSearch("")}
              style={{
                padding: "4px 10px",
                background: "transparent",
                border: `1px solid ${COLORS.borderDim}`,
                color: COLORS.textMuted,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              CLEAR
            </button>
          </>
        )}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {tableList.map((table) => {
            const tableHasMatches = tableMatchCount ? (tableMatchCount.get(table.id) || 0) > 0 : true;
            const tableNameMatch = hasSearch && isSearchMatch(table.name);

            return (
              <div
                key={table.id}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${tableNameMatch ? COLORS.accent + "66" : COLORS.borderDim}`,
                  overflow: "hidden",
                  opacity: hasSearch && !tableHasMatches ? 0.3 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${COLORS.borderDim}`,
                    borderLeft: `3px solid ${table.color}`,
                    background: tableNameMatch
                      ? COLORS.accent + "12"
                      : table.color + "10",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: tableNameMatch ? COLORS.accent : table.color,
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
                      const searchMatch = hasSearch && isSearchMatch(col.name);

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
                              : searchMatch
                              ? COLORS.accent + "14"
                              : idx % 2 === 0
                              ? "transparent"
                              : "#ffffff02",
                            borderLeft: highlighted
                              ? `3px solid ${COLORS.accent}`
                              : searchMatch
                              ? `3px solid ${COLORS.accent}88`
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
                                : searchMatch
                                ? COLORS.accent
                                : col.isPrimaryKey
                                ? COLORS.text
                                : COLORS.textDim,
                              fontWeight:
                                col.isPrimaryKey || highlighted || searchMatch
                                  ? 700
                                  : 400,
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
