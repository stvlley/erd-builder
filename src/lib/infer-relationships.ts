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

function makePairKey(tA: string, cA: string, tB: string, cB: string): string {
  // Canonical key so both directions produce the same key
  if (tA < tB || (tA === tB && cA < cB)) {
    return `${tA}|${cA}|${tB}|${cB}`;
  }
  return `${tB}|${cB}|${tA}|${cA}`;
}

export function inferRelationships(tables: Record<string, Table>): Relationship[] {
  const pairMap = new Map<string, Candidate>();
  const tableList = Object.values(tables);

  // Pre-index: build suffix -> [{table, column}] map for Strategy 3
  const suffixIndex = new Map<string, { table: Table; colId: string; colName: string; isPK: boolean }[]>();
  for (const table of tableList) {
    for (const col of table.columns) {
      const suffix = getColumnSuffix(col.name);
      if (suffix.length < 2) continue;
      let arr = suffixIndex.get(suffix);
      if (!arr) { arr = []; suffixIndex.set(suffix, arr); }
      arr.push({ table, colId: col.id, colName: col.name, isPK: col.isPrimaryKey });
    }
  }

  function addCandidate(c: Candidate) {
    const key = makePairKey(c.fromTableId, c.fromColumnId, c.toTableId, c.toColumnId);
    const existing = pairMap.get(key);
    if (!existing || c.confidence > existing.confidence) {
      pairMap.set(key, c);
    }
  }

  // Strategies 1, 2, 4: require table-pair iteration
  for (let i = 0; i < tableList.length; i++) {
    for (let j = i + 1; j < tableList.length; j++) {
      const tA = tableList[i];
      const tB = tableList[j];
      const tANameLower = tA.name.toLowerCase();
      const tBNameLower = tB.name.toLowerCase();

      for (const colA of tA.columns) {
        const colANameLower = colA.name.toLowerCase();

        // Strategy 1: _id suffix (colA references tB)
        if (colANameLower.endsWith("_id") && !colA.isPrimaryKey) {
          const ref = colANameLower.slice(0, -3);
          if (tBNameLower === ref || tBNameLower === pluralize(ref) || singularize(tBNameLower) === ref) {
            for (const colB of tB.columns) {
              if (colB.isPrimaryKey) {
                addCandidate({ fromTableId: tB.id, fromColumnId: colB.id, toTableId: tA.id, toColumnId: colA.id, confidence: 0.95 });
                break;
              }
            }
          }
        }

        // Strategy 4: CamelCase Id (colA references tB)
        const camelMatchA = colA.name.match(/^(.+)Id$/);
        if (camelMatchA && !colA.isPrimaryKey) {
          const ref = camelMatchA[1].toLowerCase();
          if (tBNameLower === ref || tBNameLower === pluralize(ref) || singularize(tBNameLower) === ref) {
            for (const colB of tB.columns) {
              if (colB.isPrimaryKey) {
                addCandidate({ fromTableId: tB.id, fromColumnId: colB.id, toTableId: tA.id, toColumnId: colA.id, confidence: 0.6 });
                break;
              }
            }
          }
        }

        for (const colB of tB.columns) {
          // Strategy 1: _id suffix (colB references tA)
          if (colB.name.toLowerCase().endsWith("_id") && !colB.isPrimaryKey) {
            const ref = colB.name.slice(0, -3).toLowerCase();
            if (tANameLower === ref || tANameLower === pluralize(ref) || singularize(tANameLower) === ref) {
              if (colA.isPrimaryKey) {
                addCandidate({ fromTableId: tA.id, fromColumnId: colA.id, toTableId: tB.id, toColumnId: colB.id, confidence: 0.95 });
              }
            }
          }

          // Strategy 2: Exact column name match
          if (colA.name === colB.name) {
            if (colA.isPrimaryKey && !colB.isPrimaryKey) {
              addCandidate({ fromTableId: tA.id, fromColumnId: colA.id, toTableId: tB.id, toColumnId: colB.id, confidence: 0.85 });
            } else if (colB.isPrimaryKey && !colA.isPrimaryKey) {
              addCandidate({ fromTableId: tB.id, fromColumnId: colB.id, toTableId: tA.id, toColumnId: colA.id, confidence: 0.85 });
            } else if (!colA.isPrimaryKey && !colB.isPrimaryKey) {
              addCandidate({ fromTableId: tA.id, fromColumnId: colA.id, toTableId: tB.id, toColumnId: colB.id, confidence: 0.8 });
            }
          }
        }
      }

      // Strategy 4: CamelCase Id (colB references tA)
      for (const colB of tB.columns) {
        const camelMatchB = colB.name.match(/^(.+)Id$/);
        if (camelMatchB && !colB.isPrimaryKey) {
          const ref = camelMatchB[1].toLowerCase();
          if (tANameLower === ref || tANameLower === pluralize(ref) || singularize(tANameLower) === ref) {
            for (const colA of tA.columns) {
              if (colA.isPrimaryKey) {
                addCandidate({ fromTableId: tA.id, fromColumnId: colA.id, toTableId: tB.id, toColumnId: colB.id, confidence: 0.6 });
                break;
              }
            }
          }
        }
      }
    }
  }

  // Strategy 3: Suffix match via pre-built index
  // O(S * m^2) where S = unique suffixes, m = matches per suffix
  // Much faster than the previous O(T^2 * C^2) nested loop with O(n) dedup inside
  for (const [, entries] of suffixIndex) {
    if (entries.length < 2) continue;
    for (let a = 0; a < entries.length; a++) {
      for (let b = a + 1; b < entries.length; b++) {
        const eA = entries[a];
        const eB = entries[b];
        if (eA.table.id === eB.table.id) continue;
        if (eA.colName === eB.colName) continue; // exact match handled by Strategy 2

        if (eA.isPK && !eB.isPK) {
          addCandidate({ fromTableId: eA.table.id, fromColumnId: eA.colId, toTableId: eB.table.id, toColumnId: eB.colId, confidence: 0.7 });
        } else if (eB.isPK && !eA.isPK) {
          addCandidate({ fromTableId: eB.table.id, fromColumnId: eB.colId, toTableId: eA.table.id, toColumnId: eA.colId, confidence: 0.7 });
        } else {
          addCandidate({ fromTableId: eA.table.id, fromColumnId: eA.colId, toTableId: eB.table.id, toColumnId: eB.colId, confidence: 0.7 });
        }
      }
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
    let changed = false;
    const newCols = table.columns.map((col) => {
      const shouldBeFK = col.isForeignKey || fkSet.has(`${id}:${col.id}`);
      if (shouldBeFK !== col.isForeignKey) {
        changed = true;
        return { ...col, isForeignKey: shouldBeFK };
      }
      return col;
    });
    // Preserve table reference if nothing changed to avoid unnecessary re-renders
    updated[id] = changed ? { ...table, columns: newCols } : table;
  }
  return updated;
}
