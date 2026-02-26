"use client";

import { useReducer, useMemo, useState } from "react";
import { erdReducer, initialState } from "@/lib/erd-reducer";
import { useERDPersistence } from "@/lib/erd-persistence";
import { COLORS } from "@/lib/constants";
import Link from "next/link";
import ColumnTable from "./ColumnTable";
import CustomFieldManager from "./CustomFieldManager";

interface ColumnDictionaryProps {
  erdId: string;
  userName: string;
  userRole: string;
}

export default function ColumnDictionary({ erdId, userName }: ColumnDictionaryProps) {
  const [state, dispatch] = useReducer(erdReducer, initialState);
  const { saveStatus, erdName, loaded } = useERDPersistence(erdId, state, dispatch);

  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [showFieldManager, setShowFieldManager] = useState(false);

  const tables = useMemo(() => Object.values(state.tables), [state.tables]);

  const flatColumns = useMemo(() => {
    return tables.flatMap((table) =>
      table.columns.map((col) => ({
        ...col,
        tableId: table.id,
        tableName: table.name,
        tableColor: table.color,
      }))
    );
  }, [tables]);

  const filteredColumns = useMemo(() => {
    let cols = flatColumns;

    if (tableFilter !== "all") {
      cols = cols.filter((c) => c.tableId === tableFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cols = cols.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tableName.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          Object.values(c.metadata || {}).some((v) => v.toLowerCase().includes(q))
      );
    }

    return cols;
  }, [flatColumns, tableFilter, searchQuery]);

  if (!loaded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: COLORS.bg,
          color: "#888",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Loading...
      </div>
    );
  }

  const btnStyle = {
    padding: "8px 16px",
    background: "transparent",
    border: `1px solid ${COLORS.borderDim}`,
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: 700 as const,
    letterSpacing: "0.1em",
    fontFamily: "var(--font-mono), monospace",
    textTransform: "uppercase" as const,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 20px",
          borderBottom: `4px solid ${COLORS.muted}`,
          background: COLORS.bg,
        }}
      >
        <Link
          href={`/erd/${erdId}`}
          style={{
            ...btnStyle,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          &larr; BACK TO CANVAS
        </Link>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: COLORS.text,
          }}
        >
          {erdName}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.accent,
            fontWeight: 700,
          }}
        >
          COLUMN DICTIONARY
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: COLORS.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {userName} &middot;{" "}
          {saveStatus === "saving"
            ? "SAVING..."
            : saveStatus === "saved"
            ? "SAVED"
            : saveStatus === "error"
            ? "SAVE ERROR"
            : ""}
        </span>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 20px",
          borderBottom: `1px solid ${COLORS.borderDim}`,
          background: COLORS.bg,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search columns, descriptions, metadata..."
          style={{
            padding: "7px 12px",
            background: "#1a1a1a",
            border: `1px solid ${COLORS.borderDim}`,
            color: COLORS.text,
            fontSize: 11,
            fontFamily: "var(--font-mono), monospace",
            width: 320,
            outline: "none",
          }}
        />
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          style={{
            padding: "7px 12px",
            background: "#1a1a1a",
            border: `1px solid ${COLORS.borderDim}`,
            color: COLORS.text,
            fontSize: 11,
            fontFamily: "var(--font-mono), monospace",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">ALL TABLES ({tables.length})</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.columns.length})
            </option>
          ))}
        </select>
        <button
          style={{
            ...btnStyle,
            borderColor: COLORS.accent + "66",
            color: COLORS.accent,
          }}
          onClick={() => setShowFieldManager(true)}
        >
          MANAGE CUSTOM FIELDS
        </button>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: COLORS.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {filteredColumns.length} of {flatColumns.length} columns
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <ColumnTable
          columns={filteredColumns}
          customFieldDefinitions={state.customFieldDefinitions}
          dispatch={dispatch}
        />
      </div>

      {/* Custom Field Manager Modal */}
      {showFieldManager && (
        <CustomFieldManager
          customFieldDefinitions={state.customFieldDefinitions}
          dispatch={dispatch}
          onClose={() => setShowFieldManager(false)}
        />
      )}
    </div>
  );
}
