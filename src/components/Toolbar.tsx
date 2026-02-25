"use client";

import { useRef, useCallback } from "react";
import { ERDAction } from "@/types/erd";
import { parseFile, filesToTables, layoutTables } from "@/lib/parse-file";
import { inferRelationships, markForeignKeys } from "@/lib/infer-relationships";
import { COLORS } from "@/lib/constants";
import { exportSVG } from "@/lib/export-svg";

interface ToolbarProps {
  tableCount: number;
  dispatch: React.Dispatch<ERDAction>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onAddTable: () => void;
}

export default function Toolbar({ tableCount, dispatch, svgRef, onAddTable }: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList) => {
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
    },
    [dispatch, tableCount]
  );

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
        style={btnStyle}
        onClick={() => {
          if (svgRef.current) exportSVG(svgRef.current);
        }}
      >
        EXPORT SVG
      </button>
      <div style={{ flex: 1 }} />
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
