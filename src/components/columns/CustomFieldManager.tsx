"use client";

import { useState } from "react";
import { CustomFieldDefinition, ERDAction } from "@/types/erd";
import { COLORS } from "@/lib/constants";

interface CustomFieldManagerProps {
  customFieldDefinitions: CustomFieldDefinition[];
  dispatch: React.Dispatch<ERDAction>;
  onClose: () => void;
}

export default function CustomFieldManager({
  customFieldDefinitions,
  dispatch,
  onClose,
}: CustomFieldManagerProps) {
  const [newFieldName, setNewFieldName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = () => {
    const name = newFieldName.trim();
    if (!name) return;
    if (customFieldDefinitions.some((f) => f.name.toLowerCase() === name.toLowerCase())) return;

    dispatch({
      type: "ADD_CUSTOM_FIELD",
      field: { id: crypto.randomUUID(), name },
    });
    setNewFieldName("");
  };

  const handleRename = (fieldId: string) => {
    const name = editingName.trim();
    if (!name) return;
    if (customFieldDefinitions.some((f) => f.id !== fieldId && f.name.toLowerCase() === name.toLowerCase())) return;

    dispatch({ type: "RENAME_CUSTOM_FIELD", fieldId, newName: name });
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (fieldId: string, fieldName: string) => {
    if (!window.confirm(`Delete "${fieldName}"? This will remove its value from all columns.`)) return;
    dispatch({ type: "DELETE_CUSTOM_FIELD", fieldId });
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginBottom: 6,
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
          width: 480,
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
          MANAGE CUSTOM FIELDS
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Existing fields */}
          {customFieldDefinitions.length === 0 ? (
            <div
              style={{
                ...labelStyle,
                color: COLORS.textMuted,
                padding: "16px 0",
                textAlign: "center",
                fontSize: 10,
              }}
            >
              No custom fields defined yet
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle}>Defined Fields</div>
              {customFieldDefinitions.map((def) => (
                <div
                  key={def.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom: `1px solid #2e2e30`,
                  }}
                >
                  {editingId === def.id ? (
                    <>
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(def.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditingName("");
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: "4px 8px",
                          background: "#141416",
                          border: `1px solid ${COLORS.accent}`,
                          color: COLORS.text,
                          fontSize: 12,
                          fontFamily: "var(--font-mono), monospace",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleRename(def.id)}
                        style={{
                          padding: "4px 10px",
                          background: COLORS.accent,
                          border: "none",
                          color: "#000",
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono), monospace",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                        }}
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid ${COLORS.borderDim}`,
                          color: COLORS.textDim,
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono), monospace",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                        }}
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 12,
                          color: COLORS.text,
                        }}
                      >
                        {def.name}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(def.id);
                          setEditingName(def.name);
                        }}
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid ${COLORS.borderDim}`,
                          color: COLORS.textDim,
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono), monospace",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                        }}
                      >
                        RENAME
                      </button>
                      <button
                        onClick={() => handleDelete(def.id, def.name)}
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid #ef444444`,
                          color: "#ef4444",
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono), monospace",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                        }}
                      >
                        DELETE
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new field */}
          <div style={labelStyle}>Add New Field</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="e.g. Source System"
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "#141416",
                border: `1px solid ${COLORS.borderDim}`,
                color: COLORS.text,
                fontSize: 12,
                fontFamily: "var(--font-mono), monospace",
                outline: "none",
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newFieldName.trim()}
              style={{
                padding: "8px 16px",
                background: COLORS.accent,
                border: "none",
                color: "#000",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.1em",
                cursor: "pointer",
                opacity: !newFieldName.trim() ? 0.4 : 1,
              }}
            >
              ADD
            </button>
          </div>

          {/* Close button */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: `1px solid ${COLORS.borderDim}`,
                color: COLORS.textDim,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
