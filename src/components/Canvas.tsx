"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;

export default function Canvas({ state, dispatch, svgRef }: CanvasProps) {
  const { tables, relationships, hoveredTableId, hoveredField, activeRelationshipIndex, dragging } =
    state;

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [zoom, pan]
  );

  // Wheel zoom (trackpad pinch + mouse wheel)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom (trackpad) — ctrlKey is set for pinch gestures
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = -e.deltaY * 0.01;
        setZoom((prev) => {
          const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * (1 + delta)));
          const scale = next / prev;
          setPan((p) => ({
            x: mouseX - scale * (mouseX - p.x),
            y: mouseY - scale * (mouseY - p.y),
          }));
          return next;
        });
      } else {
        // Regular scroll — pan
        setPan((p) => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // Table drag
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

  // Canvas pan (middle-click or right-click drag on empty space)
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle click or right click to pan
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
      }
    },
    [pan]
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

  // Pan drag handling
  useEffect(() => {
    if (!panning) return;

    const onMove = (e: MouseEvent) => {
      setPan({
        x: panning.panX + (e.clientX - panning.startX),
        y: panning.panY + (e.clientY - panning.startY),
      });
    };

    const onUp = () => {
      setPanning(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [panning]);

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
      ref={containerRef}
      className="flex-1"
      style={{
        background: "#141416",
        overflow: "hidden",
        position: "relative",
        cursor: panning ? "grabbing" : dragging ? "grabbing" : "default",
      }}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        style={{
          display: "block",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
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

      {/* Zoom indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "#666",
          letterSpacing: "0.1em",
          userSelect: "none",
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
