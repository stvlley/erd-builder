import { Table, Relationship, ERDAction, ERDState } from "@/types/erd";
import { TABLE_W, HEADER_H, ROW_H } from "@/lib/constants";
import { getTableHeight, getFieldSuffix, getCollapsedColumnCount } from "@/lib/geometry";
import FieldRow from "./FieldRow";

interface TableNodeProps {
  table: Table;
  isHovered: boolean;
  isDragging: boolean;
  isRelated: boolean;
  isDimmed: boolean;
  isSelected: boolean;
  hoveredField: ERDState["hoveredField"];
  relationships: Relationship[];
  dispatch: React.Dispatch<ERDAction>;
}

export default function TableNode({
  table,
  isHovered,
  isDragging,
  isRelated,
  isDimmed,
  isSelected,
  hoveredField,
  dispatch,
}: TableNodeProps) {
  const h = getTableHeight(table);
  const collapsedCount = getCollapsedColumnCount(table);
  const visibleColumns = table.columns.filter((c) => !c.collapsed);

  return (
    <g
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onMouseEnter={() => dispatch({ type: "SET_HOVERED_TABLE", tableId: table.id })}
      onMouseLeave={() => dispatch({ type: "SET_HOVERED_TABLE", tableId: null })}
      onDoubleClick={() => {
        dispatch({ type: "SELECT_TABLE", tableId: table.id });
        dispatch({ type: "SET_SIDEBAR", sidebar: { type: "edit-table", tableId: table.id } });
      }}
      opacity={isDimmed ? 0.25 : 1}
    >
      {/* Drag shadow */}
      {isDragging && (
        <rect
          x={table.x + 8}
          y={table.y + 8}
          width={TABLE_W}
          height={h}
          fill="#000000"
          opacity={0.6}
        />
      )}

      {/* Hover/related glow ring */}
      {(isHovered || isRelated || isSelected) && (
        <rect
          x={table.x - 3}
          y={table.y - 3}
          width={TABLE_W + 6}
          height={h + 6}
          fill="none"
          stroke={table.color}
          strokeWidth={isSelected ? 2 : isRelated ? 1 : 2}
          opacity={isRelated ? 0.25 : 0.4}
          filter="url(#glow)"
        />
      )}

      {/* Card body */}
      <rect
        x={table.x}
        y={table.y}
        width={TABLE_W}
        height={h}
        fill="#1c1c1e"
        stroke={isHovered || isDragging || isSelected ? table.color : BORDER_COLOR}
        strokeWidth={isHovered || isDragging || isSelected ? 1.5 : 1}
      />

      {/* Header fill */}
      <rect
        x={table.x}
        y={table.y}
        width={TABLE_W}
        height={HEADER_H}
        fill={table.color + "15"}
      />
      <line
        x1={table.x}
        y1={table.y + HEADER_H}
        x2={table.x + TABLE_W}
        y2={table.y + HEADER_H}
        stroke={table.color + "35"}
        strokeWidth={1}
      />

      {/* Left accent bar */}
      <rect
        x={table.x}
        y={table.y}
        width={3}
        height={h}
        fill={table.color}
        opacity={0.9}
      />

      {/* Collapse toggle */}
      <g
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: "TOGGLE_COLLAPSE", tableId: table.id });
        }}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={table.x + TABLE_W - 28}
          y={table.y + 6}
          width={20}
          height={16}
          fill="transparent"
        />
        <text
          x={table.x + TABLE_W - 18}
          y={table.y + 18}
          fill={table.color + "80"}
          fontSize={10}
          fontFamily="var(--font-mono), monospace"
          textAnchor="middle"
        >
          {table.collapsed ? "▸" : "▾"}
        </text>
      </g>

      {/* Table title */}
      <text
        x={table.x + 14}
        y={table.y + 22}
        fill={table.color}
        fontSize={13}
        fontWeight={700}
        fontFamily="var(--font-mono), monospace"
        letterSpacing="0.1em"
      >
        {table.name}
      </text>
      <text
        x={table.x + 14}
        y={table.y + 40}
        fill={table.color + "88"}
        fontSize={8.5}
        fontFamily="var(--font-mono), monospace"
        letterSpacing="0.18em"
      >
        ▸ {table.subtitle}
        {table.collapsed ? ` (${table.columns.length})` : ""}
      </text>

      {/* Field rows — only when expanded */}
      {!table.collapsed &&
        visibleColumns.map((column, idx) => {
          const fy = table.y + HEADER_H + idx * ROW_H;
          const colSuffix = getFieldSuffix(column.name);
          const isActiveField =
            hoveredField?.tableId === table.id && hoveredField?.columnId === column.id;
          const isJoinHighlight =
            hoveredField !== null &&
            colSuffix === hoveredField.suffix &&
            !(hoveredField.tableId === table.id && hoveredField.columnId === column.id);

          return (
            <FieldRow
              key={column.id}
              column={column}
              tableX={table.x}
              fieldY={fy}
              index={idx}
              tableColor={table.color}
              isActiveField={isActiveField}
              isJoinHighlight={isJoinHighlight}
              onMouseEnter={() =>
                dispatch({
                  type: "SET_HOVERED_FIELD",
                  field: { tableId: table.id, columnId: column.id, suffix: colSuffix },
                })
              }
              onMouseLeave={() => dispatch({ type: "SET_HOVERED_FIELD", field: null })}
              onToggleCollapse={() =>
                dispatch({
                  type: "TOGGLE_COLUMN_COLLAPSE",
                  tableId: table.id,
                  columnId: column.id,
                })
              }
            />
          );
        })}

      {/* Collapsed columns summary row */}
      {!table.collapsed && collapsedCount > 0 && (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            // Expand all collapsed columns
            table.columns.forEach((col) => {
              if (col.collapsed) {
                dispatch({
                  type: "TOGGLE_COLUMN_COLLAPSE",
                  tableId: table.id,
                  columnId: col.id,
                });
              }
            });
          }}
        >
          <rect
            x={table.x + 3}
            y={table.y + HEADER_H + visibleColumns.length * ROW_H}
            width={TABLE_W - 3}
            height={14}
            fill="#ffffff06"
          />
          <text
            x={table.x + TABLE_W / 2}
            y={table.y + HEADER_H + visibleColumns.length * ROW_H + 10}
            textAnchor="middle"
            fill="#58585c"
            fontSize={8}
            fontFamily="var(--font-mono), monospace"
            letterSpacing="0.1em"
          >
            + {collapsedCount} HIDDEN
          </text>
        </g>
      )}
    </g>
  );
}

const BORDER_COLOR = "#3a3a3c";
