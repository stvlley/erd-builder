"use client";

import { ERDState, ERDAction } from "@/types/erd";
import { COLORS } from "@/lib/constants";
import TableEditor from "./TableEditor";
import RelationshipEditor from "./RelationshipEditor";

interface SidebarProps {
  state: ERDState;
  dispatch: React.Dispatch<ERDAction>;
}

export default function Sidebar({ state, dispatch }: SidebarProps) {
  const { sidebar } = state;
  if (sidebar.type === "closed") return null;

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        background: COLORS.bg,
        borderLeft: `4px solid ${COLORS.muted}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${COLORS.borderDim}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.accent,
          }}
        >
          {sidebar.type === "edit-table" && "EDIT TABLE"}
          {sidebar.type === "edit-relationship" && "EDIT RELATIONSHIP"}
          {sidebar.type === "add-relationship" && "ADD RELATIONSHIP"}
        </div>
        <button
          onClick={() => dispatch({ type: "SET_SIDEBAR", sidebar: { type: "closed" } })}
          style={{
            background: "transparent",
            border: `1px solid ${COLORS.borderDim}`,
            color: COLORS.textDim,
            padding: "4px 12px",
            fontSize: 10,
          }}
        >
          CLOSE
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {sidebar.type === "edit-table" && (
          <TableEditor
            tableId={sidebar.tableId}
            state={state}
            dispatch={dispatch}
          />
        )}
        {(sidebar.type === "edit-relationship" || sidebar.type === "add-relationship") && (
          <RelationshipEditor
            relationshipId={sidebar.type === "edit-relationship" ? sidebar.relationshipId : null}
            state={state}
            dispatch={dispatch}
          />
        )}
      </div>
    </div>
  );
}
