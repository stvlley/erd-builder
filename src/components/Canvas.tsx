"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ERDState, ERDAction } from "@/types/erd";
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
const CULL_PADDING = 200; // render tables within this margin outside viewport

export default function Canvas({ state, dispatch, svgRef }: CanvasProps) {
  const { tables, relationships, hoveredTableId, hoveredField, activeRelationshipIndex, dragging } =
    state;

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 2000, h: 1200 });

  // Track container size for viewport culling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

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

  // Canvas pan
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
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

  // Memoize table entries
  const tableEntries = useMemo(() => Object.entries(tables), [tables]);

  // Memoize SVG dimensions
  const { svgW, svgH } = useMemo(() => {
    let maxX = 1000;
    let maxY = 900;
    for (const [, t] of tableEntries) {
      const right = t.x + TABLE_W + 60;
      const bottom = t.y + getTableHeight(t) + 60;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
    return { svgW: maxX, svgH: maxY };
  }, [tableEntries]);

  // Precompute relationship adjacency set for O(1) "isRelated" lookup
  const relatedTableSets = useMemo(() => {
    const adj = new Map<string, Set<string>>();
    for (const rel of relationships) {
      let setA = adj.get(rel.fromTableId);
      if (!setA) { setA = new Set(); adj.set(rel.fromTableId, setA); }
      setA.add(rel.toTableId);

      let setB = adj.get(rel.toTableId);
      if (!setB) { setB = new Set(); adj.set(rel.toTableId, setB); }
      setB.add(rel.fromTableId);
    }
    return adj;
  }, [relationships]);

  // Viewport culling bounds (in SVG coordinates)
  const cullBounds = useMemo(() => ({
    left: (-pan.x / zoom) - CULL_PADDING,
    top: (-pan.y / zoom) - CULL_PADDING,
    right: (-pan.x + viewportSize.w) / zoom + CULL_PADDING,
    bottom: (-pan.y + viewportSize.h) / zoom + CULL_PADDING,
  }), [pan, zoom, viewportSize]);

  // Filter visible tables
  const visibleTableEntries = useMemo(() => {
    return tableEntries.filter(([, t]) => {
      const th = getTableHeight(t);
      return (
        t.x + TABLE_W >= cullBounds.left &&
        t.x <= cullBounds.right &&
        t.y + th >= cullBounds.top &&
        t.y <= cullBounds.bottom
      );
    });
  }, [tableEntries, cullBounds]);

  // Set of visible table IDs for relationship culling
  const visibleTableIds = useMemo(
    () => new Set(visibleTableEntries.map(([id]) => id)),
    [visibleTableEntries]
  );

  // Filter visible relationships (at least one endpoint visible)
  const visibleRelationships = useMemo(() => {
    return relationships.filter(
      (rel) => visibleTableIds.has(rel.fromTableId) || visibleTableIds.has(rel.toTableId)
    );
  }, [relationships, visibleTableIds]);

  // Precompute real index map for relationship index lookup
  const relIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    relationships.forEach((rel, i) => map.set(rel.id, i));
    return map;
  }, [relationships]);

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

        {/* Relationships — only visible ones */}
        {visibleRelationships.map((rel) => {
          const fromTable = tables[rel.fromTableId];
          const toTable = tables[rel.toTableId];
          if (!fromTable || !toTable) return null;

          const realIndex = relIndexMap.get(rel.id) ?? -1;
          const isHot =
            activeRelationshipIndex === realIndex ||
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
              index={realIndex}
              fromTable={fromTable}
              toTable={toTable}
              isHot={isHot}
              isDimmed={isDimmed}
              dispatch={dispatch}
            />
          );
        })}

        {/* Tables — only visible ones */}
        {visibleTableEntries.map(([, table]) => {
          const isHovered = hoveredTableId === table.id;
          const isDraggingThis = dragging?.tableId === table.id;
          const isSelected = state.selectedTableId === table.id;
          const isRelated =
            hoveredTableId !== null &&
            hoveredTableId !== table.id &&
            (relatedTableSets.get(hoveredTableId)?.has(table.id) ?? false);
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
