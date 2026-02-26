"use client";

import { useState, useCallback } from "react";
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...columns].sort((a, b) => {
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
      // Custom field
      aVal = a.metadata?.[sortKey] || "";
      bVal = b.metadata?.[sortKey] || "";
    }

    const cmp = aVal.localeCompare(bVal);
    return sortDir === "asc" ? cmp : -cmp;
  });

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
    background: "#1e1e1e",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 1,
  };

  const tdStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: 12,
    fontFamily: "var(--font-mono), monospace",
    borderBottom: `1px solid #333`,
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
            Table{sortIndicator("tableName")}
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
        {sorted.map((col) => (
          <tr
            key={`${col.tableId}-${col.id}`}
            style={{ background: "#2a2a2a" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.background = "#303030";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.background = "#2a2a2a";
            }}
          >
            <td style={tdStyle}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: col.tableColor,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: COLORS.text, fontSize: 11 }}>{col.tableName}</span>
              </span>
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
                  handleDescriptionChange(col.tableId, col.id, e.target.value)
                }
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.accent;
                  e.currentTarget.style.background = "#1a1a1a";
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
                    handleMetadataChange(
                      col.tableId,
                      col.id,
                      def.name,
                      e.target.value,
                      col.metadata
                    )
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accent;
                    e.currentTarget.style.background = "#1a1a1a";
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
      </tbody>
    </table>
  );
}
