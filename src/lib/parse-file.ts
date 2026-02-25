import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Column, Table } from "@/types/erd";
import { TABLE_COLORS, GRID_START_X, GRID_START_Y, GRID_GAP_X, GRID_GAP_Y, GRID_COLS } from "./constants";

export interface ParsedFile {
  fileName: string;
  columns: { name: string; type: string }[];
}

function inferType(values: string[]): string {
  const sample = values.filter((v) => v !== "" && v != null).slice(0, 100);
  if (sample.length === 0) return "TEXT";
  const allNum = sample.every((v) => !isNaN(Number(v)));
  if (allNum) return "NUM";
  const allDate = sample.every((v) => !isNaN(Date.parse(v)) && v.length >= 8);
  if (allDate) return "DATE";
  return "TEXT";
}

function detectPrimaryKey(columns: { name: string; type: string }[]): string[] {
  const pkPatterns = [/^id$/i, /_id$/i, /^pk$/i, /key$/i];
  const pks = columns.filter((c) =>
    pkPatterns.some((p) => p.test(c.name))
  );
  if (pks.length > 0) return pks.map((c) => c.name);
  // Default: first column
  return columns.length > 0 ? [columns[0].name] : [];
}

// Find a column header that looks like "name" or "column" (case-insensitive)
function findNameCol(fields: string[]): string | null {
  const patterns = [/^name$/i, /^column$/i, /^column.?name$/i, /^field$/i, /^field.?name$/i];
  for (const f of fields) {
    if (patterns.some((p) => p.test(f.trim()))) return f;
  }
  return null;
}

// Find a column header that looks like "type" or "data_type" (case-insensitive)
function findTypeCol(fields: string[]): string | null {
  const patterns = [/^type$/i, /^data.?type$/i, /^column.?type$/i, /^field.?type$/i, /^dtype$/i];
  for (const f of fields) {
    if (patterns.some((p) => p.test(f.trim()))) return f;
  }
  return null;
}

// Detect if a CSV is a schema definition (has name + type columns)
// vs a raw data file (column headers are the field names, rows are data)
function isSchemaDefinition(fields: string[]): boolean {
  return findNameCol(fields) !== null && findTypeCol(fields) !== null;
}

function parseCSVAsSchema(data: Record<string, string>[], fields: string[]): ParsedFile["columns"] {
  const nameCol = findNameCol(fields)!;
  const typeCol = findTypeCol(fields)!;

  return data
    .map((row) => ({
      name: (row[nameCol] ?? "").trim(),
      type: (row[typeCol] ?? "TEXT").trim().toUpperCase(),
    }))
    .filter((c) => c.name !== "");
}

function parseCSVAsData(data: Record<string, string>[], fields: string[]): ParsedFile["columns"] {
  return fields.map((name) => ({
    name,
    type: inferType(data.map((row) => row[name])),
  }));
}

function parseCSV(text: string): ParsedFile["columns"] {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (!result.meta.fields || result.meta.fields.length === 0) return [];

  const fields = result.meta.fields;
  const data = result.data as Record<string, string>[];

  // Detect if this is a schema definition file (has name + type columns)
  if (isSchemaDefinition(fields)) {
    return parseCSVAsSchema(data, fields);
  }

  // Otherwise treat as raw data — headers become column names, types inferred
  return parseCSVAsData(data, fields);
}

function parseExcelSheet(rows: Record<string, unknown>[]): ParsedFile["columns"] {
  if (rows.length === 0) return [];
  const fields = Object.keys(rows[0]);

  // Check if schema definition
  if (isSchemaDefinition(fields)) {
    const nameCol = findNameCol(fields)!;
    const typeCol = findTypeCol(fields)!;
    return rows
      .map((row) => ({
        name: String(row[nameCol] ?? "").trim(),
        type: String(row[typeCol] ?? "TEXT").trim().toUpperCase(),
      }))
      .filter((c) => c.name !== "");
  }

  // Raw data — infer types
  return fields.map((name) => ({
    name,
    type: inferType(rows.map((row) => String(row[name] ?? ""))),
  }));
}

function parseExcel(buffer: ArrayBuffer): ParsedFile[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const results: ParsedFile[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    if (json.length === 0) continue;

    const columns = parseExcelSheet(json);
    if (columns.length === 0) continue;

    results.push({ fileName: sheetName, columns });
  }

  return results;
}

export async function parseFile(file: File): Promise<ParsedFile[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "tsv") {
    const text = await file.text();
    const columns = parseCSV(text);
    return [{ fileName: file.name.replace(/\.\w+$/, ""), columns }];
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    return parseExcel(buffer);
  }

  return [];
}

export function filesToTables(
  parsedFiles: ParsedFile[],
  existingCount: number
): Table[] {
  return parsedFiles.map((pf, i) => {
    const idx = existingCount + i;
    const col = idx % GRID_COLS;
    const row = Math.floor(idx / GRID_COLS);
    const pkNames = detectPrimaryKey(pf.columns);

    const columns: Column[] = pf.columns.map((c) => ({
      id: crypto.randomUUID(),
      name: c.name,
      type: c.type,
      isPrimaryKey: pkNames.includes(c.name),
      isForeignKey: false,
    }));

    const table: Table = {
      id: crypto.randomUUID(),
      name: pf.fileName,
      subtitle: `${pf.columns.length} columns`,
      color: TABLE_COLORS[idx % TABLE_COLORS.length],
      x: GRID_START_X + col * GRID_GAP_X,
      y: GRID_START_Y + row * GRID_GAP_Y,
      columns,
      collapsed: false,
    };

    return table;
  });
}

// Compute proper Y positioning after all tables are created
// so they don't overlap vertically
export function layoutTables(tables: Table[]): Table[] {
  const colHeights: number[] = [];

  return tables.map((table, i) => {
    const col = i % GRID_COLS;
    if (colHeights[col] === undefined) {
      colHeights[col] = GRID_START_Y;
    }

    const positioned = {
      ...table,
      x: GRID_START_X + col * GRID_GAP_X,
      y: colHeights[col],
    };

    // Advance column height
    const height = 56 + table.columns.length * 24 + 8; // HEADER_H + columns * ROW_H + padding
    colHeights[col] += height + GRID_GAP_Y;

    return positioned;
  });
}
