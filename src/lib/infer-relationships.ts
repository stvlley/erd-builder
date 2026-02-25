import { Table, Relationship } from "@/types/erd";

interface Candidate {
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  confidence: number;
}

function getColumnSuffix(name: string): string {
  if (/^[A-Z]\d/.test(name) && name.length > 2) {
    return name.slice(2);
  }
  return name;
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
    for (let j = 0; j < tableList.length; j++) {
      if (i === j) continue;
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

          // Strategy 2: Exact column name match (0.85)
          // Same column name across tables, PK side = from
          if (
            colA.name === colB.name &&
            colA.isPrimaryKey &&
            !colB.isPrimaryKey
          ) {
            candidates.push({
              fromTableId: tA.id,
              fromColumnId: colA.id,
              toTableId: tB.id,
              toColumnId: colB.id,
              confidence: 0.85,
            });
          }

          // Strategy 3: Legacy prefix-suffix match (0.7)
          // AS/400 style: O0BCTN/O1BCTN share suffix BCTN
          const suffA = getColumnSuffix(colA.name);
          const suffB = getColumnSuffix(colB.name);
          if (
            suffA === suffB &&
            suffA !== colA.name && // Ensure it actually has a prefix
            suffB !== colB.name &&
            colA.name !== colB.name && // Different full names
            colA.isPrimaryKey &&
            !colB.isPrimaryKey
          ) {
            // Check we haven't already matched this pair via exact match
            const alreadyMatched = candidates.some(
              (c) =>
                c.fromTableId === tA.id &&
                c.fromColumnId === colA.id &&
                c.toTableId === tB.id &&
                c.toColumnId === colB.id
            );
            if (!alreadyMatched) {
              candidates.push({
                fromTableId: tA.id,
                fromColumnId: colA.id,
                toTableId: tB.id,
                toColumnId: colB.id,
                confidence: 0.7,
              });
            }
          }

          // Strategy 4: CamelCase Id match (0.6)
          // e.g., "orderId" → "order" table PK
          const camelMatch = colA.name.match(/^(.+)Id$/);
          if (camelMatch && !colA.isPrimaryKey) {
            const ref = camelMatch[1].toLowerCase();
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
