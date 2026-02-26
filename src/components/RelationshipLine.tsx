import { Relationship, Table, ERDAction } from "@/types/erd";
import { getConnectorPath } from "@/lib/geometry";
import { COLORS } from "@/lib/constants";

interface RelationshipLineProps {
  relationship: Relationship;
  index: number;
  fromTable: Table;
  toTable: Table;
  isHot: boolean;
  isDimmed: boolean;
  dispatch: React.Dispatch<ERDAction>;
}

export default function RelationshipLine({
  relationship,
  index,
  fromTable,
  toTable,
  isHot,
  isDimmed,
  dispatch,
}: RelationshipLineProps) {
  const { path, midX, midY } = getConnectorPath(
    fromTable,
    relationship.fromColumnId,
    toTable,
    relationship.toColumnId
  );

  return (
    <g
      onMouseEnter={() => dispatch({ type: "SET_ACTIVE_RELATIONSHIP", index })}
      onMouseLeave={() => dispatch({ type: "SET_ACTIVE_RELATIONSHIP", index: null })}
      onClick={() =>
        dispatch({
          type: "SET_SIDEBAR",
          sidebar: { type: "edit-relationship", relationshipId: relationship.id },
        })
      }
      style={{ cursor: "pointer" }}
    >
      {/* Hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} />

      {/* Visible line */}
      <path
        d={path}
        fill="none"
        stroke={isHot ? "#d4683a" : isDimmed ? "#333333" : COLORS.borderDim}
        strokeWidth={isHot ? 2 : 1.5}
        strokeDasharray={isHot ? "none" : "5 4"}
        markerEnd={isHot ? "url(#arr-hot)" : "url(#arr)"}
        filter={isHot ? "url(#glow)" : "none"}
        style={{ transition: "stroke 0.12s, stroke-width 0.12s" }}
      />

      {/* Cardinality label */}
      {isHot && (
        <g>
          <rect
            x={midX - 22}
            y={midY - 10}
            width={44}
            height={18}
            fill={COLORS.bg}
            stroke={COLORS.accent}
            strokeWidth={1}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill={COLORS.accent}
            fontSize={9}
            fontFamily="var(--font-mono), monospace"
            letterSpacing="0.1em"
          >
            {relationship.cardinality}
          </text>
        </g>
      )}

      {/* Inferred badge */}
      {isHot && relationship.inferred && (
        <text
          x={midX}
          y={midY + 18}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={7}
          fontFamily="var(--font-mono), monospace"
          letterSpacing="0.08em"
        >
          INFERRED
        </text>
      )}
    </g>
  );
}
