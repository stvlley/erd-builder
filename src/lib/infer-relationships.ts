import { Table, Relationship } from "@/types/erd";

interface Candidate {
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  confidence: number;
}

function getColumnSuffix(name: string): string {
  // Strip first 2 chars for AS/400 style prefixes (letter + letter/digit, e.g. O2, PD, PB)
  if (/^[A-Z][A-Z0-9]/.test(name) && name.length > 2) {
    return name.slice(2).toLowerCase();
  }
  return name.toLowerCase();
}

function pluralize(word: string): string {
  if (word.endsWith("s")) return word;
  if (word.endsWith("y")) return word.slice(0, -1) + "ies";
  return word + "s";
}

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function inferRelationships(tables: Record<string, Table>): Relationship[] {
  const candidates: Candidate[] = [];
  const tableList = Object.values(tables);

  for (let i = 0; i < tableList.length; i++) {
    for (let j = i + 1; j < tableList.length; j++) {
      const tA = tableList[i];
      const tB = tableList[j];

      for (const colA of tA.columns) {
        for (const colB of tB.columns) {
          // Strategy 1: _id suffix match (0.95)
          // e.g., "user_id" in orders → "id" in users
          if (colA.name.toLowerCase().endsWith("_id") && !colA.isPrimaryKey) {
            const ref = colA.name.slice(0, -3).toLowerCase();
            const targetName = tB.name.toLowerCase();
            if (
              (targetName === ref ||
                targetName === pluralize(ref) ||
                singularize(targetName) === ref) &&
              colB.isPrimaryKey
            ) {
              candidates.push({
                fromTableId: tB.id,
                fromColumnId: colB.id,
                toTableId: tA.id,
                toColumnId: colA.id,
                confidence: 0.95,
              });
            }
          }
          // Reverse direction
          if (colB.name.toLowerCase().endsWith("_id") && !colB.isPrimaryKey) {
            const ref = colB.name.slice(0, -3).toLowerCase();
            const targetName = tA.name.toLowerCase();
            if (
              (targetName === ref ||
                targetName === pluralize(ref) ||
                singularize(targetName) === ref) &&
              colA.isPrimaryKey
            ) {
              candidates.push({
                fromTableId: tA.id,
                fromColumnId: colA.id,
                toTableId: tB.id,
                toColumnId: colB.id,
                confidence: 0.95,
              });
            }
          }

          // Strategy 2: Exact column name match (0.85)
          // Same column name across different tables
          if (colA.name === colB.name) {
            if (colA.isPrimaryKey && !colB.isPrimaryKey) {
              candidates.push({
                fromTableId: tA.id,
                fromColumnId: colA.id,
                toTableId: tB.id,
                toColumnId: colB.id,
                confidence: 0.85,
              });
            } else if (colB.isPrimaryKey && !colA.isPrimaryKey) {
              candidates.push({
                fromTableId: tB.id,
                fromColumnId: colB.id,
                toTableId: tA.id,
                toColumnId: colA.id,
                confidence: 0.85,
              });
            } else if (!colA.isPrimaryKey && !colB.isPrimaryKey) {
              // Neither is PK — still link them (lower confidence)
              candidates.push({
                fromTableId: tA.id,
                fromColumnId: colA.id,
                toTableId: tB.id,
                toColumnId: colB.id,
                confidence: 0.8,
              });
            }
          }

          // Strategy 3: Suffix match after stripping prefix (0.7)
          // AS/400 style: O0BCTN and O1BCTN share suffix BCTN
          // Also works for any columns where stripped suffix matches
          const suffA = getColumnSuffix(colA.name);
          const suffB = getColumnSuffix(colB.name);
          if (
            suffA === suffB &&
            suffA.length >= 2 &&
            colA.name !== colB.name // Different full names (exact match handled above)
          ) {
            const alreadyMatched = candidates.some(
              (c) =>
                (c.fromTableId === tA.id &&
                  c.fromColumnId === colA.id &&
                  c.toTableId === tB.id &&
                  c.toColumnId === colB.id) ||
                (c.fromTableId === tB.id &&
                  c.fromColumnId === colB.id &&
                  c.toTableId === tA.id &&
                  c.toColumnId === colA.id)
            );
            if (!alreadyMatched) {
              // PK side is "from" if available, otherwise first table is from
              if (colA.isPrimaryKey && !colB.isPrimaryKey) {
                candidates.push({
                  fromTableId: tA.id,
                  fromColumnId: colA.id,
                  toTableId: tB.id,
                  toColumnId: colB.id,
                  confidence: 0.7,
                });
              } else if (colB.isPrimaryKey && !colA.isPrimaryKey) {
                candidates.push({
                  fromTableId: tB.id,
                  fromColumnId: colB.id,
                  toTableId: tA.id,
                  toColumnId: colA.id,
                  confidence: 0.7,
                });
              } else {
                // Neither or both are PK — still link
                candidates.push({
                  fromTableId: tA.id,
                  fromColumnId: colA.id,
                  toTableId: tB.id,
                  toColumnId: colB.id,
                  confidence: 0.7,
                });
              }
            }
          }

          // Strategy 4: CamelCase Id match (0.6)
          // e.g., "orderId" → "order" table PK
          const camelMatchA = colA.name.match(/^(.+)Id$/);
          if (camelMatchA && !colA.isPrimaryKey) {
            const ref = camelMatchA[1].toLowerCase();
            const targetName = tB.name.toLowerCase();
            if (
              (targetName === ref ||
                targetName === pluralize(ref) ||
                singularize(targetName) === ref) &&
              colB.isPrimaryKey
            ) {
              candidates.push({
                fromTableId: tB.id,
                fromColumnId: colB.id,
                toTableId: tA.id,
                toColumnId: colA.id,
                confidence: 0.6,
              });
            }
          }
          const camelMatchB = colB.name.match(/^(.+)Id$/);
          if (camelMatchB && !colB.isPrimaryKey) {
            const ref = camelMatchB[1].toLowerCase();
            const targetName = tA.name.toLowerCase();
            if (
              (targetName === ref ||
                targetName === pluralize(ref) ||
                singularize(targetName) === ref) &&
              colA.isPrimaryKey
            ) {
              candidates.push({
                fromTableId: tA.id,
                fromColumnId: colA.id,
                toTableId: tB.id,
                toColumnId: colB.id,
                confidence: 0.6,
              });
            }
          }
        }
      }
    }
  }

  // Deduplicate: keep highest confidence per unique column pair
  const pairMap = new Map<string, Candidate>();
  for (const c of candidates) {
    const key = [c.fromTableId, c.fromColumnId, c.toTableId, c.toColumnId]
      .sort()
      .join("|");
    const existing = pairMap.get(key);
    if (!existing || c.confidence > existing.confidence) {
      pairMap.set(key, c);
    }
  }

  return Array.from(pairMap.values()).map((c) => ({
    id: crypto.randomUUID(),
    fromTableId: c.fromTableId,
    fromColumnId: c.fromColumnId,
    toTableId: c.toTableId,
    toColumnId: c.toColumnId,
    cardinality: "1:N" as const,
    inferred: true,
  }));
}

// Mark FK flags on columns that appear in relationships
export function markForeignKeys(
  tables: Record<string, Table>,
  relationships: Relationship[]
): Record<string, Table> {
  const fkSet = new Set<string>();
  for (const rel of relationships) {
    fkSet.add(`${rel.toTableId}:${rel.toColumnId}`);
  }

  const updated: Record<string, Table> = {};
  for (const [id, table] of Object.entries(tables)) {
    updated[id] = {
      ...table,
      columns: table.columns.map((col) => ({
        ...col,
        isForeignKey: col.isForeignKey || fkSet.has(`${id}:${col.id}`),
      })),
    };
  }
  return updated;
}
