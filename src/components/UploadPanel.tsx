"use client";

import { useState, useCallback } from "react";
import { ERDAction } from "@/types/erd";
import { parseFile, filesToTables, layoutTables } from "@/lib/parse-file";
import { inferRelationships, markForeignKeys } from "@/lib/infer-relationships";
import { COLORS } from "@/lib/constants";

interface UploadPanelProps {
  dispatch: React.Dispatch<ERDAction>;
  existingTableCount: number;
}

export default function UploadPanel({ dispatch, existingTableCount }: UploadPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(
    async (files: FileList) => {
      setIsProcessing(true);
      try {
        const allParsed = [];
        for (const file of Array.from(files)) {
          const parsed = await parseFile(file);
          allParsed.push(...parsed);
        }

        if (allParsed.length === 0) return;

        let newTables = filesToTables(allParsed, existingTableCount);
        newTables = layoutTables(newTables);

        const tableMap: Record<string, (typeof newTables)[0]> = {};
        for (const t of newTables) {
          tableMap[t.id] = t;
        }

        const relationships = inferRelationships(tableMap);
        const updatedTables = markForeignKeys(tableMap, relationships);

        dispatch({
          type: "LOAD_TABLES",
          tables: updatedTables,
          relationships,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, existingTableCount]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: COLORS.canvas }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? COLORS.accent : COLORS.borderDim}`,
          background: isDragOver ? COLORS.accent + "08" : "transparent",
          transition: "border-color 0.15s, background 0.15s",
          padding: "80px 120px",
          textAlign: "center",
        }}
      >
        {isProcessing ? (
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 14,
                color: COLORS.accent,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              PROCESSING FILES...
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 48,
                color: COLORS.borderDim,
                marginBottom: 24,
                lineHeight: 1,
              }}
            >
              ⬡
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: 22,
                color: COLORS.text,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Drop your data files here
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: COLORS.textDim,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 32,
              }}
            >
              CSV, TSV, XLSX — one file per table
            </div>
            <label
              style={{
                display: "inline-block",
                padding: "10px 32px",
                background: COLORS.accent,
                color: "#000",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                border: "none",
              }}
            >
              BROWSE FILES
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                multiple
                onChange={handleFileInput}
                style={{ display: "none" }}
              />
            </label>
            <div
              style={{
                marginTop: 24,
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                color: COLORS.textMuted,
                letterSpacing: "0.06em",
              }}
            >
              Relationships will be auto-inferred from column names
            </div>
          </>
        )}
      </div>
    </div>
  );
}
