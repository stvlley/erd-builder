"use client";

import { useReducer, useRef, useState, useEffect, useMemo } from "react";
import { erdReducer, initialState } from "@/lib/erd-reducer";
import Header from "./Header";
import Toolbar from "./Toolbar";
import UploadPanel from "./UploadPanel";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import StatsFooter from "./StatsFooter";
import AddTableModal from "./AddTableModal";

export default function ERDBuilder() {
  const [state, dispatch] = useReducer(erdReducer, initialState);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);

  const tableCount = Object.keys(state.tables).length;
  const columnCount = useMemo(
    () => Object.values(state.tables).reduce((sum, t) => sum + t.columns.length, 0),
    [state.tables]
  );

  // Keyboard shortcut: Escape closes sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "SET_SIDEBAR", sidebar: { type: "closed" } });
        setShowAddTable(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasTables = tableCount > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <Header
        tableCount={tableCount}
        relationshipCount={state.relationships.length}
        columnCount={columnCount}
      />

      {hasTables && (
        <Toolbar
          tableCount={tableCount}
          dispatch={dispatch}
          svgRef={svgRef}
          onAddTable={() => setShowAddTable(true)}
        />
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {hasTables ? (
          <Canvas state={state} dispatch={dispatch} svgRef={svgRef} />
        ) : (
          <UploadPanel dispatch={dispatch} existingTableCount={0} />
        )}

        <Sidebar state={state} dispatch={dispatch} />
      </div>

      <StatsFooter />

      {showAddTable && (
        <AddTableModal
          existingTableCount={tableCount}
          dispatch={dispatch}
          onClose={() => setShowAddTable(false)}
        />
      )}
    </div>
  );
}
