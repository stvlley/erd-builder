"use client";

import { useRef, useCallback } from "react";
import { ERDAction, ERDState } from "@/types/erd";
import { parseFile, filesToTables, layoutTables } from "@/lib/parse-file";
import { inferRelationships, markForeignKeys } from "@/lib/infer-relationships";
import { COLORS } from "@/lib/constants";
import { exportSVG } from "@/lib/export-svg";
import type { SaveStatus } from "@/lib/erd-persistence";
import type { ViewMode } from "./ERDBuilder";
import Link from "next/link";

interface ToolbarProps {
  tableCount: number;
  dispatch: React.Dispatch<ERDAction>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onAddTable: () => void;
  state: ERDState;
  onSave: () => void;
  saveStatus: SaveStatus;
  erdId: string;
  viewMode: ViewMode;
  onToggleView: () => void;
}

export default function Toolbar({
  tableCount,
  dispatch,
  svgRef,
  onAddTable,
  state,
  onSave,
  saveStatus,
  erdId,
  viewMode,
  onToggleView,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList) => {
      try {
        const allParsed = [];
        for (const file of Array.from(files)) {
          const parsed = await parseFile(file);
          allParsed.push(...parsed);
        }
        if (allParsed.length === 0) return;

        let newTables = filesToTables(allParsed, tableCount);
        newTables = layoutTables(newTables);

        const tableMap: Record<string, (typeof newTables)[0]> = {};
        for (const t of newTables) tableMap[t.id] = t;

        const relationships = inferRelationships(tableMap);
        const updatedTables = markForeignKeys(tableMap, relationships);

        dispatch({ type: "LOAD_TABLES", tables: updatedTables, relationships });
      } catch (err) {
        console.error("[ERD] Toolbar upload error:", err);
      }
    },
    [dispatch, tableCount]
  );

  const handleGenerateRelationships = useCallback(() => {
    const relationships = inferRelationships(state.tables);
    const updatedTables = markForeignKeys(state.tables, relationships);
    dispatch({
      type: "GENERATE_RELATIONSHIPS",
      relationships,
      tables: updatedTables,
    });
  }, [dispatch, state.tables]);

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
    transition: "border-color 0.15s, color 0.15s",
    cursor: "pointer",
  };

  const primaryBtnStyle = {
    ...btnStyle,
    background: COLORS.accent,
    border: `1px solid ${COLORS.accent}`,
    color: "#000",
  };

  return (
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
      <button style={primaryBtnStyle} onClick={onAddTable}>
        + ADD TABLE
      </button>
      <button
        style={btnStyle}
        onClick={() => fileRef.current?.click()}
      >
        UPLOAD MORE
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          multiple
          onChange={(e) => {
            if (e.target.files) handleUpload(e.target.files);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </button>
      <button
        style={btnStyle}
        onClick={() =>
          dispatch({
            type: "SET_SIDEBAR",
            sidebar: { type: "add-relationship" },
          })
        }
      >
        + ADD RELATIONSHIP
      </button>
      <button
        style={{
          ...btnStyle,
          borderColor: COLORS.accent + "66",
          color: COLORS.accent,
        }}
        onClick={handleGenerateRelationships}
      >
        GENERATE RELATIONSHIPS
      </button>
      <button
        style={btnStyle}
        onClick={() => {
          if (svgRef.current) exportSVG(svgRef.current);
        }}
      >
        EXPORT SVG
      </button>
      <Link
        href={`/erd/${erdId}/columns`}
        style={{
          ...btnStyle,
          textDecoration: "none",
          display: "inline-block",
          borderColor: COLORS.accent + "66",
          color: COLORS.accent,
        }}
      >
        COLUMN DICTIONARY
      </Link>
      <button
        style={btnStyle}
        onClick={onSave}
        disabled={saveStatus === "saving"}
      >
        {saveStatus === "saving" ? "SAVING..." : "SAVE"}
      </button>
      <div style={{ flex: 1 }} />
      <button
        style={{
          ...btnStyle,
          background: viewMode === "grid" ? COLORS.accent + "20" : "transparent",
          borderColor: viewMode === "grid" ? COLORS.accent : COLORS.borderDim,
          color: viewMode === "grid" ? COLORS.accent : COLORS.textDim,
        }}
        onClick={onToggleView}
      >
        {viewMode === "canvas" ? "GRID VIEW" : "CANVAS VIEW"}
      </button>
      <button
        style={{ ...btnStyle, color: "#ef4444", borderColor: "#ef444444" }}
        onClick={() => {
          if (window.confirm("Reset everything? This cannot be undone.")) {
            dispatch({ type: "RESET" });
          }
        }}
      >
        RESET
      </button>
    </div>
  );
}
