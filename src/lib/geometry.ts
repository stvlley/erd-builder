import { Table } from "@/types/erd";
import { TABLE_W, ROW_H, HEADER_H } from "./constants";

export function getTableHeight(table: Table): number {
  return HEADER_H + table.columns.length * ROW_H + 8;
}

export function getFieldY(table: Table, columnId: string): number {
  const idx = table.columns.findIndex((c) => c.id === columnId);
  if (idx === -1) return table.y + HEADER_H + 10;
  return table.y + HEADER_H + idx * ROW_H + ROW_H / 2;
}

export interface ConnectorPath {
  path: string;
  midX: number;
  midY: number;
}

export function getConnectorPath(
  fromTable: Table,
  fromColumnId: string,
  toTable: Table,
  toColumnId: string
): ConnectorPath {
  const fy = getFieldY(fromTable, fromColumnId);
  const ty = getFieldY(toTable, toColumnId);
  const fromCX = fromTable.x + TABLE_W / 2;
  const toCX = toTable.x + TABLE_W / 2;

  let fxOut: number;
  let txIn: number;

  if (toCX >= fromCX) {
    fxOut = fromTable.x + TABLE_W;
    txIn = toTable.x;
  } else {
    fxOut = fromTable.x;
    txIn = toTable.x + TABLE_W;
  }

  const dx = Math.abs(txIn - fxOut);
  const cx = Math.max(40, dx * 0.4);
  const dirF = fxOut === fromTable.x + TABLE_W ? 1 : -1;
  const dirT = txIn === toTable.x ? -1 : 1;

  return {
    path: `M${fxOut},${fy} C${fxOut + dirF * cx},${fy} ${txIn + dirT * cx},${ty} ${txIn},${ty}`,
    midX: (fxOut + txIn) / 2,
    midY: (fy + ty) / 2,
  };
}

export function getFieldSuffix(name: string): string {
  // For legacy prefix-style names like O0BCTN → BCTN
  if (/^[A-Z]\d/.test(name) && name.length > 2) {
    return name.slice(2);
  }
  return name;
}
