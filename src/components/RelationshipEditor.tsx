"use client";

import { useState } from "react";
import { ERDState, ERDAction, Relationship } from "@/types/erd";
import { COLORS } from "@/lib/constants";

interface RelationshipEditorProps {
  relationshipId: string | null;
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

export default function RelationshipEditor({
  relationshipId,
  state,
  dispatch,
}: RelationshipEditorProps) {
  const tableList = Object.values(state.tables);
  const existing = relationshipId
    ? state.relationships.find((r) => r.id === relationshipId)
    : null;

  const [fromTableId, setFromTableId] = useState(existing?.fromTableId ?? "");
  const [fromColumnId, setFromColumnId] = useState(existing?.fromColumnId ?? "");
  const [toTableId, setToTableId] = useState(existing?.toTableId ?? "");
  const [toColumnId, setToColumnId] = useState(existing?.toColumnId ?? "");
  const [cardinality, setCardinality] = useState<Relationship["cardinality"]>(
    existing?.cardinality ?? "1:N"
  );

  const fromTable = state.tables[fromTableId];
  const toTable = state.tables[toTableId];

  const handleSave = () => {
    if (!fromTableId || !fromColumnId || !toTableId || !toColumnId) return;

    if (existing) {
      dispatch({
        type: "UPDATE_RELATIONSHIP",
        relationshipId: existing.id,
        updates: {
          fromTableId,
          fromColumnId,
          toTableId,
          toColumnId,
          cardinality,
        },
      });
    } else {
      dispatch({
        type: "ADD_RELATIONSHIP",
        relationship: {
          id: crypto.randomUUID(),
          fromTableId,
          fromColumnId,
          toTableId,
          toColumnId,
          cardinality,
          inferred: false,
        },
      });
      dispatch({ type: "SET_SIDEBAR", sidebar: { type: "closed" } });
    }
  };

  return (
    <div>
      {/* From table */}
      <SectionLabel>From Table (1 side)</SectionLabel>
      <select
        value={fromTableId}
        onChange={(e) => {
          setFromTableId(e.target.value);
          setFromColumnId("");
        }}
        style={{ width: "100%", boxSizing: "border-box" }}
      >
        <option value="">-- select --</option>
        {tableList.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* From column */}
      <SectionLabel>From Column</SectionLabel>
      <select
        value={fromColumnId}
        onChange={(e) => setFromColumnId(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box" }}
        disabled={!fromTable}
      >
        <option value="">-- select --</option>
        {fromTable?.columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.type})
          </option>
        ))}
      </select>

      {/* To table */}
      <SectionLabel>To Table (N side)</SectionLabel>
      <select
        value={toTableId}
        onChange={(e) => {
          setToTableId(e.target.value);
          setToColumnId("");
        }}
        style={{ width: "100%", boxSizing: "border-box" }}
      >
        <option value="">-- select --</option>
        {tableList.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* To column */}
      <SectionLabel>To Column</SectionLabel>
      <select
        value={toColumnId}
        onChange={(e) => setToColumnId(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box" }}
        disabled={!toTable}
      >
        <option value="">-- select --</option>
        {toTable?.columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.type})
          </option>
        ))}
      </select>

      {/* Cardinality */}
      <SectionLabel>Cardinality</SectionLabel>
      <div style={{ display: "flex", gap: 8 }}>
        {(["1:1", "1:N", "N:M"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCardinality(c)}
            style={{
              flex: 1,
              padding: "8px",
              background: cardinality === c ? COLORS.accent + "20" : "transparent",
              border: `1px solid ${cardinality === c ? COLORS.accent : COLORS.borderDim}`,
              color: cardinality === c ? COLORS.accent : COLORS.textDim,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!fromTableId || !fromColumnId || !toTableId || !toColumnId}
        style={{
          marginTop: 24,
          width: "100%",
          padding: "10px",
          background: COLORS.accent,
          border: "none",
          color: "#000",
          fontSize: 11,
          fontWeight: 700,
          opacity: !fromTableId || !fromColumnId || !toTableId || !toColumnId ? 0.4 : 1,
        }}
      >
        {existing ? "UPDATE" : "CREATE RELATIONSHIP"}
      </button>

      {/* Delete */}
      {existing && (
        <button
          onClick={() => {
            dispatch({ type: "DELETE_RELATIONSHIP", relationshipId: existing.id });
          }}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "10px",
            background: "#ef444420",
            border: `1px solid #ef4444`,
            color: "#ef4444",
            fontSize: 10,
          }}
        >
          DELETE RELATIONSHIP
        </button>
      )}
    </div>
  );
}
