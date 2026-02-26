import { Column } from "@/types/erd";
import { TABLE_W, ROW_H, COLORS } from "@/lib/constants";

interface FieldRowProps {
  column: Column;
  tableX: number;
  fieldY: number;
  index: number;
  tableColor: string;
  isActiveField: boolean;
  isJoinHighlight: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggleCollapse: () => void;
}

export default function FieldRow({
  column,
  tableX,
  fieldY,
  index,
  isActiveField,
  isJoinHighlight,
  onMouseEnter,
  onMouseLeave,
  onToggleCollapse,
}: FieldRowProps) {
  return (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "crosshair" }}
    >
      {/* Alternating row stripe */}
      {index % 2 === 1 && !isJoinHighlight && !isActiveField && (
        <rect
          x={tableX + 3}
          y={fieldY}
          width={TABLE_W - 3}
          height={ROW_H}
          fill="#FFFFFF03"
        />
      )}

      {/* Join highlight */}
      {(isJoinHighlight || isActiveField) && (
        <rect
          x={tableX + 3}
          y={fieldY}
          width={TABLE_W - 3}
          height={ROW_H}
          fill={isActiveField ? "#818CF820" : "#818CF812"}
          stroke={isActiveField ? "#818CF880" : "#818CF840"}
          strokeWidth={isActiveField ? 1 : 0.5}
        />
      )}

      {/* PK icon */}
      {column.isPrimaryKey && (
        <text x={tableX + 7} y={fieldY + 15} fill={COLORS.accent} fontSize={10}>
          ⬡
        </text>
      )}

      {/* FK label */}
      {column.isForeignKey && !column.isPrimaryKey && (
        <text
          x={tableX + 8}
          y={fieldY + 14}
          fill="#808084"
          fontSize={8}
          fontFamily="var(--font-mono), monospace"
        >
          FK
        </text>
      )}

      {/* Column name */}
      <text
        x={tableX + (column.isPrimaryKey || column.isForeignKey ? 24 : 12)}
        y={fieldY + 15}
        fill={
          isActiveField || isJoinHighlight
            ? "#818CF8"
            : column.isPrimaryKey
              ? "#d4d4d4"
              : column.isForeignKey
                ? "#7a7d80"
                : "#808084"
        }
        fontSize={10}
        fontFamily="var(--font-mono), monospace"
        letterSpacing="0.03em"
        fontWeight={column.isPrimaryKey || isActiveField || isJoinHighlight ? 700 : 400}
      >
        {column.name}
      </text>

      {/* Type */}
      <text
        x={tableX + TABLE_W - 24}
        y={fieldY + 15}
        textAnchor="end"
        fill={column.type === "NUM" ? "#34D39868" : "#38BDF858"}
        fontSize={8}
        fontFamily="var(--font-mono), monospace"
      >
        {column.type}
      </text>

      {/* Collapse toggle — small "x" on far right, visible on hover via opacity */}
      <g
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
        style={{ cursor: "pointer" }}
        opacity={isActiveField ? 0.6 : 0}
      >
        <rect
          x={tableX + TABLE_W - 18}
          y={fieldY + 2}
          width={14}
          height={ROW_H - 4}
          fill="transparent"
        />
        <text
          x={tableX + TABLE_W - 11}
          y={fieldY + 15}
          textAnchor="middle"
          fill="#666"
          fontSize={8}
          fontFamily="var(--font-mono), monospace"
        >
          ×
        </text>
      </g>
    </g>
  );
}
