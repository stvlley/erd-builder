"use client";

import { useState } from "react";
import { ERDAction, Table, Column } from "@/types/erd";
import { COLORS, TABLE_COLORS } from "@/lib/constants";

interface AddTableModalProps {
  existingTableCount: number;
  dispatch: React.Dispatch<ERDAction>;
  onClose: () => void;
}

export default function AddTableModal({
  existingTableCount,
  dispatch,
  onClose,
}: AddTableModalProps) {
  const [name, setName] = useState("");
  const [columnsText, setColumnsText] = useState("id\nname\ncreated_at");

  const handleCreate = () => {
    if (!name.trim()) return;

    const colNames = columnsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const columns: Column[] = colNames.map((cName, i) => ({
      id: crypto.randomUUID(),
      name: cName,
      type: cName.toLowerCase().includes("id") ? "NUM" : "TEXT",
      isPrimaryKey: i === 0,
      isForeignKey: false,
    }));

    const table: Table = {
      id: crypto.randomUUID(),
      name: name.trim(),
      subtitle: `${columns.length} columns`,
      color: TABLE_COLORS[existingTableCount % TABLE_COLORS.length],
      x: 60 + (existingTableCount % 3) * 320,
      y: 60 + Math.floor(existingTableCount / 3) * 400,
      columns,
      collapsed: false,
    };

    dispatch({ type: "ADD_TABLE", table });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bg,
          border: `4px solid ${COLORS.muted}`,
          width: 420,
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${COLORS.borderDim}`,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.accent,
          }}
        >
          ADD TABLE
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: COLORS.textMuted,
              marginBottom: 6,
            }}
          >
            Table Name
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="users"
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 20 }}
            autoFocus
          />

          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: COLORS.textMuted,
              marginBottom: 6,
            }}
          >
            Columns (one per line)
          </div>
          <textarea
            value={columnsText}
            onChange={(e) => setColumnsText(e.target.value)}
            rows={8}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              style={{
                flex: 1,
                padding: "10px",
                background: COLORS.accent,
                border: "none",
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                opacity: !name.trim() ? 0.4 : 1,
              }}
            >
              CREATE
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                background: "transparent",
                border: `1px solid ${COLORS.borderDim}`,
                color: COLORS.textDim,
                fontSize: 11,
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
