"use client";

import { useRef, useCallback, useEffect } from "react";
import { ERDState, ERDAction, Relationship } from "@/types/erd";
import { TABLE_W } from "@/lib/constants";
import { getTableHeight } from "@/lib/geometry";
import SVGDefs from "./SVGDefs";
import GridPattern from "./GridPattern";
import TableNode from "./TableNode";
import RelationshipLine from "./RelationshipLine";
import JoinHighlight from "./JoinHighlight";

interface CanvasProps {
  state: ERDState;
  dispatch: React.Dispatch<ERDAction>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export default function Canvas({ state, dispatch, svgRef }: CanvasProps) {
  const { tables, relationships, hoveredTableId, hoveredField, activeRelationshipIndex, dragging } =
    state;

  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svgEl = svgRef.current;
      if (!svgEl) return { x: 0, y: 0 };
      const pt = svgEl.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      return pt.matrixTransform(ctm.inverse());
    },
    [svgRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = getSVGPoint(e.clientX, e.clientY);
      const table = tables[tableId];
      if (!table) return;
      dispatch({
        type: "SET_DRAGGING",
        dragging: { tableId, offsetX: x - table.x, offsetY: y - table.y },
      });
      dispatch({ type: "SET_HOVERED_TABLE", tableId });
    },
    [tables, getSVGPoint, dispatch]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const { x, y } = getSVGPoint(e.clientX, e.clientY);
      dispatch({
        type: "MOVE_TABLE",
        tableId: dragging.tableId,
        x: x - dragging.offsetX,
        y: y - dragging.offsetY,
      });
    };

    const onUp = () => {
      dispatch({ type: "SET_DRAGGING", dragging: null });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, getSVGPoint, dispatch]);

  const tableEntries = Object.entries(tables);
  const maxX = tableEntries.length > 0
    ? Math.max(...tableEntries.map(([, t]) => t.x + TABLE_W + 60))
    : 1000;
  const maxY = tableEntries.length > 0
    ? Math.max(...tableEntries.map(([, t]) => t.y + getTableHeight(t) + 60))
    : 900;
  const svgW = Math.max(1000, maxX);
  const svgH = Math.max(900, maxY);

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: "#1a1a1a" }}
    >
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        style={{ display: "block", cursor: dragging ? "grabbing" : "default" }}
      >
        <SVGDefs />
        <GridPattern width={svgW} height={svgH} />

        {/* Join highlight lines */}
        <JoinHighlight tables={tables} hoveredField={hoveredField} />

        {/* Relationships */}
        {relationships.map((rel, i) => {
          const fromTable = tables[rel.fromTableId];
          const toTable = tables[rel.toTableId];
          if (!fromTable || !toTable) return null;

          const isHot =
            activeRelationshipIndex === i ||
            hoveredTableId === rel.fromTableId ||
            hoveredTableId === rel.toTableId;
          const isDimmed =
            !isHot &&
            hoveredTableId !== null &&
            hoveredTableId !== rel.fromTableId &&
            hoveredTableId !== rel.toTableId;

          return (
            <RelationshipLine
              key={rel.id}
              relationship={rel}
              index={i}
              fromTable={fromTable}
              toTable={toTable}
              isHot={isHot}
              isDimmed={isDimmed}
              dispatch={dispatch}
            />
          );
        })}

        {/* Tables */}
        {tableEntries.map(([, table]) => {
          const isHovered = hoveredTableId === table.id;
          const isDraggingThis = dragging?.tableId === table.id;
          const isSelected = state.selectedTableId === table.id;
          const isRelated =
            hoveredTableId !== null &&
            hoveredTableId !== table.id &&
            relationships.some(
              (r: Relationship) =>
                (r.fromTableId === hoveredTableId && r.toTableId === table.id) ||
                (r.toTableId === hoveredTableId && r.fromTableId === table.id)
            );
          const isDimmed =
            hoveredTableId !== null && !isHovered && !isRelated;

          return (
            <g
              key={table.id}
              onMouseDown={(e) => handleMouseDown(e, table.id)}
            >
              <TableNode
                table={table}
                isHovered={isHovered}
                isDragging={isDraggingThis}
                isRelated={isRelated}
                isDimmed={isDimmed}
                isSelected={isSelected}
                hoveredField={hoveredField}
                relationships={relationships}
                dispatch={dispatch}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
