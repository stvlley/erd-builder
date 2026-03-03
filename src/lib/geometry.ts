import { Table } from "@/types/erd";
import { TABLE_W, ROW_H, HEADER_H } from "./constants";

const COLLAPSED_ROW_H = 14;

/** Count visible and collapsed columns in a single pass */
export function getColumnCounts(table: Table): { visible: number; collapsed: number } {
  let visible = 0;
  let collapsed = 0;
  for (const col of table.columns) {
    if (col.collapsed) collapsed++;
    else visible++;
  }
  return { visible, collapsed };
}

export function getVisibleColumnCount(table: Table): number {
  return getColumnCounts(table).visible;
}

export function getCollapsedColumnCount(table: Table): number {
  return getColumnCounts(table).collapsed;
}

export function getTableHeight(table: Table): number {
  if (table.collapsed) return HEADER_H + 8;
  const { visible, collapsed } = getColumnCounts(table);
  return HEADER_H + visible * ROW_H + (collapsed > 0 ? COLLAPSED_ROW_H : 0) + 8;
}

/** Returns the visual index of a column among visible (non-collapsed) columns */
function getVisibleIndex(table: Table, columnId: string): number {
  let visIdx = 0;
  for (const col of table.columns) {
    if (col.id === columnId) return visIdx;
    if (!col.collapsed) visIdx++;
  }
  return -1;
}

export function getFieldY(table: Table, columnId: string): number {
  const col = table.columns.find((c) => c.id === columnId);
  if (!col) return table.y + HEADER_H + 10;
  // If column is collapsed, return -1 to signal "don't render"
  if (col.collapsed) return -1;
  const visIdx = getVisibleIndex(table, columnId);
  if (visIdx === -1) return table.y + HEADER_H + 10;
  return table.y + HEADER_H + visIdx * ROW_H + ROW_H / 2;
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
): ConnectorPath | null {
  const fy = getFieldY(fromTable, fromColumnId);
  const ty = getFieldY(toTable, toColumnId);

  // If either column is collapsed, don't draw the connector
  if (fy === -1 || ty === -1) return null;

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
  // For legacy prefix-style names like O0BCTN → BCTN, PDDIV → DIV
  if (/^[A-Z][A-Z0-9]/.test(name) && name.length > 2) {
    return name.slice(2);
  }
  return name;
}
