"use client";

import { useReducer, useRef, useState, useEffect, useMemo } from "react";
import { erdReducer, initialState } from "@/lib/erd-reducer";
import { useERDPersistence } from "@/lib/erd-persistence";
import Header from "./Header";
import Toolbar from "./Toolbar";
import UploadPanel from "./UploadPanel";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import StatsFooter from "./StatsFooter";
import AddTableModal from "./AddTableModal";

interface ERDBuilderProps {
  erdId: string;
  userName: string;
  userRole: string;
}

export default function ERDBuilder({ erdId, userName, userRole }: ERDBuilderProps) {
  const [state, dispatch] = useReducer(erdReducer, initialState);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);

  const { saveStatus, saveNow, erdName, updateName, loaded } =
    useERDPersistence(erdId, state, dispatch);

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

  if (!loaded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#242424",
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
        userName={userName}
        userRole={userRole}
        erdName={erdName}
        onUpdateName={updateName}
        saveStatus={saveStatus}
      />

      {hasTables && (
        <Toolbar
          tableCount={tableCount}
          dispatch={dispatch}
          svgRef={svgRef}
          onAddTable={() => setShowAddTable(true)}
          state={state}
          onSave={saveNow}
          saveStatus={saveStatus}
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
