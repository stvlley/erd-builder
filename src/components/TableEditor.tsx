"use client";

import { ERDState, ERDAction, Column } from "@/types/erd";
import { COLORS, TABLE_COLORS } from "@/lib/constants";

interface TableEditorProps {
  tableId: string;
  state: ERDState;
  dispatch: React.Dispatch<ERDAction>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: COLORS.textMuted,
        marginBottom: 6,
        marginTop: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function TableEditor({ tableId, state, dispatch }: TableEditorProps) {
  const table = state.tables[tableId];
  if (!table) return null;

  const addColumn = () => {
    const col: Column = {
      id: crypto.randomUUID(),
      name: "new_column",
      type: "TEXT",
      isPrimaryKey: false,
      isForeignKey: false,
    };
    dispatch({ type: "ADD_COLUMN", tableId, column: col });
  };

  return (
    <div>
      {/* Table name */}
      <SectionLabel>Table Name</SectionLabel>
      <input
        value={table.name}
        onChange={(e) =>
          dispatch({ type: "UPDATE_TABLE", tableId, updates: { name: e.target.value } })
        }
        style={{ width: "100%", boxSizing: "border-box" }}
      />

      {/* Subtitle */}
      <SectionLabel>Subtitle</SectionLabel>
      <input
        value={table.subtitle}
        onChange={(e) =>
          dispatch({ type: "UPDATE_TABLE", tableId, updates: { subtitle: e.target.value } })
        }
        style={{ width: "100%", boxSizing: "border-box" }}
      />

      {/* Color */}
      <SectionLabel>Color</SectionLabel>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TABLE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => dispatch({ type: "UPDATE_TABLE", tableId, updates: { color } })}
            style={{
              width: 24,
              height: 24,
              background: color,
              border: table.color === color ? `2px solid ${COLORS.text}` : `2px solid transparent`,
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Columns */}
      <SectionLabel>Columns ({table.columns.length})</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {table.columns.map((col) => (
          <div
            key={col.id}
            style={{
              border: `1px solid ${COLORS.borderDim}`,
              padding: "8px 10px",
              background: COLORS.surface,
            }}
          >
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input
                value={col.name}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_COLUMN",
                    tableId,
                    columnId: col.id,
                    updates: { name: e.target.value },
                  })
                }
                style={{ flex: 1, fontSize: 12 }}
              />
              <select
                value={col.type}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_COLUMN",
                    tableId,
                    columnId: col.id,
                    updates: { type: e.target.value },
                  })
                }
                style={{ width: 72, fontSize: 11 }}
              >
                <option value="TEXT">TEXT</option>
                <option value="NUM">NUM</option>
                <option value="DATE">DATE</option>
                <option value="CHAR">CHAR</option>
                <option value="BOOL">BOOL</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  color: COLORS.textDim,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={col.isPrimaryKey}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_COLUMN",
                      tableId,
                      columnId: col.id,
                      updates: { isPrimaryKey: e.target.checked },
                    })
                  }
                  style={{ accentColor: COLORS.accent }}
                />
                PK
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  color: COLORS.textDim,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={col.isForeignKey}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_COLUMN",
                      tableId,
                      columnId: col.id,
                      updates: { isForeignKey: e.target.checked },
                    })
                  }
                  style={{ accentColor: COLORS.accent }}
                />
                FK
              </label>
              <button
                onClick={() => dispatch({ type: "DELETE_COLUMN", tableId, columnId: col.id })}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: 9,
                  padding: "2px 6px",
                  fontWeight: 700,
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add column */}
      <button
        onClick={addColumn}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "8px",
          background: "transparent",
          border: `1px dashed ${COLORS.borderDim}`,
          color: COLORS.textDim,
          fontSize: 10,
        }}
      >
        + ADD COLUMN
      </button>

      {/* Delete table */}
      <button
        onClick={() => {
          dispatch({ type: "DELETE_TABLE", tableId });
          dispatch({ type: "SET_SIDEBAR", sidebar: { type: "closed" } });
        }}
        style={{
          marginTop: 32,
          width: "100%",
          padding: "10px",
          background: "#ef444420",
          border: `1px solid #ef4444`,
          color: "#ef4444",
          fontSize: 10,
        }}
      >
        DELETE TABLE
      </button>
    </div>
  );
}
