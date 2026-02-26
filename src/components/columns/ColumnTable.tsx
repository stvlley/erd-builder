"use client";

import { useState, useCallback, useMemo } from "react";
import { Column, CustomFieldDefinition, ERDAction } from "@/types/erd";
import { COLORS } from "@/lib/constants";

interface FlatColumn extends Column {
  tableId: string;
  tableName: string;
  tableColor: string;
}

interface ColumnTableProps {
  columns: FlatColumn[];
  customFieldDefinitions: CustomFieldDefinition[];
  dispatch: React.Dispatch<ERDAction>;
}

type SortKey = "tableName" | "name" | "type" | "description" | string;
type SortDir = "asc" | "desc";

export default function ColumnTable({
  columns,
  customFieldDefinitions,
  dispatch,
}: ColumnTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("tableName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleTable = (tableId: string) => {
    setCollapsedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  const collapseAll = () => {
    const allIds = new Set(columns.map((c) => c.tableId));
    setCollapsedTables(allIds);
  };

  const expandAll = () => {
    setCollapsedTables(new Set());
  };

  const sorted = useMemo(() => {
    return [...columns].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (sortKey === "tableName") {
        aVal = a.tableName;
        bVal = b.tableName;
      } else if (sortKey === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortKey === "type") {
        aVal = a.type;
        bVal = b.type;
      } else if (sortKey === "description") {
        aVal = a.description || "";
        bVal = b.description || "";
      } else {
        aVal = a.metadata?.[sortKey] || "";
        bVal = b.metadata?.[sortKey] || "";
      }

      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [columns, sortKey, sortDir]);

  // Group sorted columns by table
  const grouped = useMemo(() => {
    const groups: { tableId: string; tableName: string; tableColor: string; columns: FlatColumn[] }[] = [];
    const seen = new Map<string, number>();

    for (const col of sorted) {
      const idx = seen.get(col.tableId);
      if (idx !== undefined) {
        groups[idx].columns.push(col);
      } else {
        seen.set(col.tableId, groups.length);
        groups.push({
          tableId: col.tableId,
          tableName: col.tableName,
          tableColor: col.tableColor,
          columns: [col],
        });
      }
    }

    return groups;
  }, [sorted]);

  const handleDescriptionChange = useCallback(
    (tableId: string, columnId: string, value: string) => {
      dispatch({
        type: "UPDATE_COLUMN_METADATA",
        tableId,
        columnId,
        description: value,
      });
    },
    [dispatch]
  );

  const handleMetadataChange = useCallback(
    (tableId: string, columnId: string, fieldName: string, value: string, currentMetadata?: Record<string, string>) => {
      dispatch({
        type: "UPDATE_COLUMN_METADATA",
        tableId,
        columnId,
        metadata: { ...(currentMetadata || {}), [fieldName]: value },
      });
    },
    [dispatch]
  );

  const totalCustomCols = customFieldDefinitions.length;
  const totalCols = 6 + totalCustomCols; // Table, Column, Type, PK, FK, Description + custom

  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontFamily: "var(--font-mono), monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: COLORS.textMuted,
    textAlign: "left",
    borderBottom: `2px solid ${COLORS.borderDim}`,
    background: "#1a1a1c",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 2,
  };

  const tdStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: 12,
    fontFamily: "var(--font-mono), monospace",
    borderBottom: `1px solid #2e2e30`,
    verticalAlign: "middle",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 6px",
    background: "transparent",
    border: "1px solid transparent",
    color: COLORS.text,
    fontSize: 11,
    fontFamily: "var(--font-mono), monospace",
    outline: "none",
    boxSizing: "border-box",
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  };

  if (columns.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: COLORS.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        No columns found
      </div>
    );
  }

  const anyCollapsed = collapsedTables.size > 0;

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "auto",
      }}
    >
      <thead>
        <tr>
          <th style={thStyle} onClick={() => handleSort("tableName")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  anyCollapsed ? expandAll() : collapseAll();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.textMuted,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 10,
                  fontFamily: "var(--font-mono), monospace",
                  lineHeight: 1,
                }}
                title={anyCollapsed ? "Expand all" : "Collapse all"}
              >
                {anyCollapsed ? "\u25B6" : "\u25BC"}
              </button>
              Table{sortIndicator("tableName")}
            </span>
          </th>
          <th style={thStyle} onClick={() => handleSort("name")}>
            Column{sortIndicator("name")}
          </th>
          <th style={thStyle} onClick={() => handleSort("type")}>
            Type{sortIndicator("type")}
          </th>
          <th style={{ ...thStyle, textAlign: "center", cursor: "default" }}>PK</th>
          <th style={{ ...thStyle, textAlign: "center", cursor: "default" }}>FK</th>
          <th style={{ ...thStyle, minWidth: 200 }} onClick={() => handleSort("description")}>
            Description{sortIndicator("description")}
          </th>
          {customFieldDefinitions.map((def) => (
            <th
              key={def.id}
              style={{ ...thStyle, minWidth: 140 }}
              onClick={() => handleSort(def.name)}
            >
              {def.name}{sortIndicator(def.name)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grouped.map((group) => {
          const isCollapsed = collapsedTables.has(group.tableId);
          return (
            <TableGroup
              key={group.tableId}
              tableId={group.tableId}
              tableName={group.tableName}
              tableColor={group.tableColor}
              columns={group.columns}
              isCollapsed={isCollapsed}
              onToggle={() => toggleTable(group.tableId)}
              totalCols={totalCols}
              customFieldDefinitions={customFieldDefinitions}
              tdStyle={tdStyle}
              inputStyle={inputStyle}
              onDescriptionChange={handleDescriptionChange}
              onMetadataChange={handleMetadataChange}
            />
          );
        })}
      </tbody>
    </table>
  );
}

// Extracted to avoid re-creating inline functions per row in the main component
function TableGroup({
  tableId,
  tableName,
  tableColor,
  columns,
  isCollapsed,
  onToggle,
  totalCols,
  customFieldDefinitions,
  tdStyle,
  inputStyle,
  onDescriptionChange,
  onMetadataChange,
}: {
  tableId: string;
  tableName: string;
  tableColor: string;
  columns: FlatColumn[];
  isCollapsed: boolean;
  onToggle: () => void;
  totalCols: number;
  customFieldDefinitions: CustomFieldDefinition[];
  tdStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  onDescriptionChange: (tableId: string, columnId: string, value: string) => void;
  onMetadataChange: (tableId: string, columnId: string, fieldName: string, value: string, currentMetadata?: Record<string, string>) => void;
}) {
  return (
    <>
      {/* Table group header */}
      <tr
        onClick={onToggle}
        style={{
          background: "#1e1e20",
          cursor: "pointer",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLTableRowElement).style.background = "#282828";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLTableRowElement).style.background = "#1e1e20";
        }}
      >
        <td
          colSpan={totalCols}
          style={{
            padding: "8px 12px",
            borderBottom: `1px solid ${COLORS.borderDim}`,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 9 }}>
              {isCollapsed ? "\u25B6" : "\u25BC"}
            </span>
            <span
              style={{
                width: 8,
                height: 8,
                background: tableColor,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ color: COLORS.text }}>{tableName}</span>
            <span
              style={{
                color: COLORS.textMuted,
                fontSize: 9,
                fontWeight: 400,
                letterSpacing: "0.1em",
              }}
            >
              {columns.length} {columns.length === 1 ? "COLUMN" : "COLUMNS"}
            </span>
          </span>
        </td>
      </tr>

      {/* Column rows */}
      {!isCollapsed &&
        columns.map((col) => (
          <tr
            key={`${col.tableId}-${col.id}`}
            style={{ background: "#232325" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.background = "#2a2a2c";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.background = "#232325";
            }}
          >
            <td style={{ ...tdStyle, paddingLeft: 32 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 10 }}>{col.tableName}</span>
            </td>
            <td style={{ ...tdStyle, color: COLORS.text, fontWeight: 600 }}>
              {col.name}
            </td>
            <td style={{ ...tdStyle, color: COLORS.textMuted, fontSize: 10 }}>
              {col.type}
            </td>
            <td style={{ ...tdStyle, textAlign: "center" }}>
              {col.isPrimaryKey && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "#facc15",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  PK
                </span>
              )}
            </td>
            <td style={{ ...tdStyle, textAlign: "center" }}>
              {col.isForeignKey && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "#818CF8",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  FK
                </span>
              )}
            </td>
            <td style={tdStyle}>
              <input
                style={inputStyle}
                value={col.description || ""}
                placeholder="Add description..."
                onChange={(e) =>
                  onDescriptionChange(col.tableId, col.id, e.target.value)
                }
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.accent;
                  e.currentTarget.style.background = "#141416";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.background = "transparent";
                }}
              />
            </td>
            {customFieldDefinitions.map((def) => (
              <td key={def.id} style={tdStyle}>
                <input
                  style={inputStyle}
                  value={col.metadata?.[def.name] || ""}
                  placeholder={`Add ${def.name.toLowerCase()}...`}
                  onChange={(e) =>
                    onMetadataChange(
                      col.tableId,
                      col.id,
                      def.name,
                      e.target.value,
                      col.metadata
                    )
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accent;
                    e.currentTarget.style.background = "#141416";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.background = "transparent";
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
    </>
  );
}
