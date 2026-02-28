"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ERDState, ERDAction } from "@/types/erd";
import { COLORS } from "@/lib/constants";

interface GridViewProps {
  state: ERDState;
  dispatch: React.Dispatch<ERDAction>;
}

export default function GridView({ state, dispatch }: GridViewProps) {
  const { tables, relationships } = state;
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<{
    tableId: string;
    columnId: string;
  } | null>(null);
  const [search, setSearch] = useState("");

  const tableList = useMemo(() => Object.values(tables), [tables]);

  // Auto-select first table on mount or when tables change
  useEffect(() => {
    if (
      tableList.length > 0 &&
      (!selectedTableId || !tables[selectedTableId])
    ) {
      setSelectedTableId(tableList[0].id);
    }
  }, [tableList, selectedTableId, tables]);

  const selectedTable = selectedTableId ? tables[selectedTableId] : null;

  // Relationship count per table
  const relCountByTable = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rel of relationships) {
      counts.set(rel.fromTableId, (counts.get(rel.fromTableId) || 0) + 1);
      if (rel.toTableId !== rel.fromTableId) {
        counts.set(rel.toTableId, (counts.get(rel.toTableId) || 0) + 1);
      }
    }
    return counts;
  }, [relationships]);

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

  // For the selected table, build a map of columnId -> relationship targets
  const columnRelTargets = useMemo(() => {
    if (!selectedTableId) return new Map<string, string[]>();
    const map = new Map<string, string[]>();

    for (const rel of relationships) {
      if (rel.fromTableId === selectedTableId) {
        const targets = map.get(rel.fromColumnId) || [];
        const toTable = tables[rel.toTableId];
        const toCol = toTable?.columns.find((c) => c.id === rel.toColumnId);
        if (toTable && toCol) {
          targets.push(`→ ${toTable.name}.${toCol.name}`);
        }
        map.set(rel.fromColumnId, targets);
      }
      if (rel.toTableId === selectedTableId) {
        const targets = map.get(rel.toColumnId) || [];
        const fromTable = tables[rel.fromTableId];
        const fromCol = fromTable?.columns.find(
          (c) => c.id === rel.fromColumnId
        );
        if (fromTable && fromCol) {
          targets.push(`← ${fromTable.name}.${fromCol.name}`);
        }
        map.set(rel.toColumnId, targets);
      }
    }
    return map;
  }, [selectedTableId, relationships, tables]);

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
      return (
        hoveredCol?.tableId === tableId && hoveredCol?.columnId === columnId
      );
    },
    [hoveredCol]
  );

  // Search matching
  const query = search.trim().toLowerCase();
  const hasSearch = query.length > 0;

  const isColSearchMatch = useCallback(
    (col: {
      name: string;
      description?: string;
      metadata?: Record<string, string>;
    }) => {
      if (!hasSearch) return false;
      if (col.name.toLowerCase().includes(query)) return true;
      if (col.description && col.description.toLowerCase().includes(query))
        return true;
      if (col.metadata) {
        for (const val of Object.values(col.metadata)) {
          if (val.toLowerCase().includes(query)) return true;
        }
      }
      return false;
    },
    [hasSearch, query]
  );

  // Count search matches per table
  const tableMatchCount = useMemo(() => {
    if (!hasSearch) return null;
    const counts = new Map<string, number>();
    for (const table of tableList) {
      let count = 0;
      if (table.name.toLowerCase().includes(query)) count++;
      for (const col of table.columns) {
        if (isColSearchMatch(col)) count++;
      }
      counts.set(table.id, count);
    }
    return counts;
  }, [hasSearch, query, tableList, isColSearchMatch]);

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
        overflow: "hidden",
        background: COLORS.canvas,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search bar */}
      <div
        style={{
          padding: "8px 16px",
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
          placeholder="Search columns, descriptions, metadata..."
          style={{
            padding: "5px 10px",
            background: COLORS.canvas,
            border: `1px solid ${COLORS.borderDim}`,
            color: COLORS.text,
            fontSize: 11,
            fontFamily: "var(--font-mono), monospace",
            flex: 1,
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
                flexShrink: 0,
              }}
            >
              {totalMatches} match{totalMatches !== 1 ? "es" : ""}
            </span>
            <button
              onClick={() => setSearch("")}
              style={{
                padding: "3px 8px",
                background: "transparent",
                border: `1px solid ${COLORS.borderDim}`,
                color: COLORS.textMuted,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.1em",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              CLEAR
            </button>
          </>
        )}
      </div>

      {/* Split panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel — table list */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.borderDim}`,
            background: COLORS.bg,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${COLORS.borderDim}`,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: COLORS.textMuted,
                textTransform: "uppercase",
              }}
            >
              TABLES ({tableList.length})
            </span>
          </div>

          {/* Scrollable table list */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {tableList.map((table) => {
              const isSelected = table.id === selectedTableId;
              const matchCount = tableMatchCount?.get(table.id) ?? 0;
              const hasMtch = !hasSearch || matchCount > 0;
              const relCount = relCountByTable.get(table.id) || 0;

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderLeft: isSelected
                      ? `3px solid ${table.color}`
                      : "3px solid transparent",
                    background: isSelected ? table.color + "12" : "transparent",
                    opacity: hasSearch && !hasMtch ? 0.3 : 1,
                    transition: "opacity 0.15s, background 0.1s",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "#ffffff06";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {/* Color dot */}
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      background: table.color,
                      flexShrink: 0,
                      marginTop: 3,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: isSelected ? table.color : COLORS.text,
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {table.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 8,
                        color: COLORS.textMuted,
                        letterSpacing: "0.1em",
                        marginTop: 1,
                      }}
                    >
                      {table.columns.length} cols &middot; {relCount} rel
                      {relCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — column detail */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: COLORS.canvas,
          }}
        >
          {selectedTable ? (
            <>
              {/* Table header */}
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: `1px solid ${COLORS.borderDim}`,
                  background: COLORS.bg,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: selectedTable.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: selectedTable.color,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {selectedTable.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 9,
                      color: COLORS.textMuted,
                      letterSpacing: "0.12em",
                      marginTop: 1,
                    }}
                  >
                    {selectedTable.columns.length} columns &middot;{" "}
                    {relCountByTable.get(selectedTableId!) || 0} relationships
                  </div>
                </div>
              </div>

              {/* Column table */}
              <div style={{ flex: 1, overflow: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "#1a1a1c",
                        borderBottom: `2px solid ${COLORS.borderDim}`,
                        zIndex: 1,
                      }}
                    >
                      {["COLUMN", "TYPE", "PK", "FK", "DESCRIPTION", "RELATED TO"].map(
                        (header) => (
                          <th
                            key={header}
                            style={{
                              padding: "7px 12px",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.15em",
                              color: COLORS.textMuted,
                              textTransform: "uppercase",
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.columns
                      .filter((col) => !col.collapsed)
                      .map((col, idx) => {
                        const highlighted = isHighlighted(
                          selectedTable.id,
                          col.id
                        );
                        const isSource = isHoveredCol(
                          selectedTable.id,
                          col.id
                        );
                        const searchMatch =
                          hasSearch && isColSearchMatch(col);
                        const relTargets =
                          columnRelTargets.get(col.id) || [];

                        return (
                          <tr
                            key={col.id}
                            onMouseEnter={() =>
                              setHoveredCol({
                                tableId: selectedTable.id,
                                columnId: col.id,
                              })
                            }
                            onMouseLeave={() => setHoveredCol(null)}
                            onClick={() => {
                              dispatch({
                                type: "SELECT_TABLE",
                                tableId: selectedTable.id,
                              });
                              dispatch({
                                type: "SET_SIDEBAR",
                                sidebar: {
                                  type: "edit-table",
                                  tableId: selectedTable.id,
                                },
                              });
                            }}
                            style={{
                              cursor: "pointer",
                              background: isSource
                                ? COLORS.accent + "20"
                                : highlighted
                                ? COLORS.accent + "10"
                                : searchMatch
                                ? COLORS.accent + "14"
                                : idx % 2 === 0
                                ? COLORS.surface
                                : "transparent",
                              borderLeft: highlighted
                                ? `3px solid ${COLORS.accent}`
                                : searchMatch
                                ? `3px solid ${COLORS.accent}88`
                                : "3px solid transparent",
                              transition:
                                "background 0.1s, border-color 0.1s",
                            }}
                          >
                            {/* Column name */}
                            <td
                              style={{
                                padding: "5px 12px",
                                fontSize: 11,
                                fontWeight:
                                  col.isPrimaryKey || highlighted
                                    ? 700
                                    : 400,
                                color: highlighted
                                  ? COLORS.accent
                                  : searchMatch
                                  ? COLORS.accent
                                  : col.isPrimaryKey
                                  ? COLORS.text
                                  : COLORS.textDim,
                              }}
                            >
                              {col.name}
                            </td>

                            {/* Type */}
                            <td
                              style={{
                                padding: "5px 12px",
                                fontSize: 10,
                                color: COLORS.textMuted,
                              }}
                            >
                              {col.type}
                            </td>

                            {/* PK badge */}
                            <td style={{ padding: "5px 12px" }}>
                              {col.isPrimaryKey && (
                                <span
                                  style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    color: "#facc15",
                                  }}
                                >
                                  PK
                                </span>
                              )}
                            </td>

                            {/* FK badge */}
                            <td style={{ padding: "5px 12px" }}>
                              {col.isForeignKey && (
                                <span
                                  style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    color: "#818CF8",
                                  }}
                                >
                                  FK
                                </span>
                              )}
                            </td>

                            {/* Description */}
                            <td
                              style={{
                                padding: "5px 12px",
                                fontSize: 10,
                                color:
                                  searchMatch &&
                                  col.description
                                    ?.toLowerCase()
                                    .includes(query)
                                    ? COLORS.accent + "cc"
                                    : COLORS.textDim,
                                maxWidth: 240,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {col.description || ""}
                            </td>

                            {/* Related To */}
                            <td
                              style={{
                                padding: "5px 12px",
                                fontSize: 10,
                              }}
                            >
                              {relTargets.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                  }}
                                >
                                  {relTargets.map((target, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        color: COLORS.accent,
                                        fontWeight: highlighted ? 700 : 400,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {target}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Empty state */
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: COLORS.textMuted,
                  letterSpacing: "0.1em",
                }}
              >
                Select a table
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
