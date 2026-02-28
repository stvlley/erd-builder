import Papa from "papaparse";
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
  return columns.length > 0 ? [columns[0].name] : [];
}

function findNameCol(fields: string[]): string | null {
  const patterns = [/^name$/i, /^column$/i, /^column.?name$/i, /^field$/i, /^field.?name$/i];
  for (const f of fields) {
    if (patterns.some((p) => p.test(f.trim()))) return f;
  }
  return null;
}

function findTypeCol(fields: string[]): string | null {
  const patterns = [/^type$/i, /^data.?type$/i, /^column.?type$/i, /^field.?type$/i, /^dtype$/i];
  for (const f of fields) {
    if (patterns.some((p) => p.test(f.trim()))) return f;
  }
  return null;
}

function isSchemaDefinition(fields: string[]): { nameCol: string; typeCol: string } | null {
  // Strategy 1: Explicit header matching (name/column + type/data_type)
  const nc = findNameCol(fields);
  const tc = findTypeCol(fields);
  if (nc !== null && tc !== null) return { nameCol: nc, typeCol: tc };

  // Strategy 2: If CSV has exactly 2 columns, treat first as name, second as type
  // This handles files where headers are non-standard (e.g. "Field", "DataType", etc.)
  if (fields.length === 2) {
    return { nameCol: fields[0], typeCol: fields[1] };
  }

  return null;
}

function parseCSV(text: string): ParsedFile["columns"] {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (!result.meta.fields || result.meta.fields.length === 0) return [];

  const fields = result.meta.fields;
  const data = result.data as Record<string, string>[];

  console.log("[ERD parseCSV] headers:", fields, "rows:", data.length);

  const schema = isSchemaDefinition(fields);
  if (schema) {
    console.log("[ERD parseCSV] Detected schema file, nameCol:", schema.nameCol, "typeCol:", schema.typeCol);
    const columns = data
      .map((row) => ({
        name: (row[schema.nameCol] ?? "").trim(),
        type: (row[schema.typeCol] ?? "TEXT").trim().toUpperCase(),
      }))
      .filter((c) => c.name !== "");
    console.log("[ERD parseCSV] Parsed", columns.length, "columns:", columns);
    return columns;
  }

  // Raw data file — headers ARE the column names, infer types from values
  console.log("[ERD parseCSV] Treating as data file, headers become columns");
  return fields.map((name) => ({
    name,
    type: inferType(data.map((row) => row[name])),
  }));
}

async function parseExcel(buffer: ArrayBuffer, baseName: string): Promise<ParsedFile[]> {
  // Dynamic import to avoid bundling xlsx at module level
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const results: ParsedFile[] = [];
  const multiSheet = workbook.SheetNames.length > 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    if (json.length === 0) continue;

    // Use file name; append sheet name only for multi-sheet workbooks
    const tableName = multiSheet ? `${baseName}_${sheetName.toUpperCase()}` : baseName;
    const rowFields = Object.keys(json[0]);

    const schema = isSchemaDefinition(rowFields);
    if (schema) {
      const columns = json
        .map((row) => ({
          name: String(row[schema.nameCol] ?? "").trim(),
          type: String(row[schema.typeCol] ?? "TEXT").trim().toUpperCase(),
        }))
        .filter((c) => c.name !== "");
      if (columns.length > 0) {
        results.push({ fileName: tableName, columns });
      }
    } else {
      const columns = rowFields.map((name) => ({
        name,
        type: inferType(json.map((row) => String(row[name] ?? ""))),
      }));
      results.push({ fileName: tableName, columns });
    }
  }

  return results;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function parseFile(file: File): Promise<ParsedFile[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "tsv") {
    const text = await file.text();
    const columns = parseCSV(text);
    console.log(`[ERD] Parsed CSV "${file.name}": ${columns.length} columns`, columns);
    const baseName = file.name.replace(/\.\w+$/, "").toUpperCase();
    return [{ fileName: baseName, columns }];
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const baseName = file.name.replace(/\.\w+$/, "").toUpperCase();
    const results = await parseExcel(buffer, baseName);
    console.log(`[ERD] Parsed Excel "${file.name}": ${results.length} sheet(s)`, results);
    return results;
  }

  console.warn(`[ERD] Unsupported file type: ${ext}`);
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
      id: generateId(),
      name: c.name,
      type: c.type,
      isPrimaryKey: pkNames.includes(c.name),
      isForeignKey: false,
    }));

    console.log(`[ERD] Table "${pf.fileName}": ${columns.length} columns created`, columns);

    const table: Table = {
      id: generateId(),
      name: pf.fileName,
      subtitle: `${columns.length} columns`,
      color: TABLE_COLORS[idx % TABLE_COLORS.length],
      x: GRID_START_X + col * GRID_GAP_X,
      y: GRID_START_Y + row * GRID_GAP_Y,
      columns,
      collapsed: false,
    };

    return table;
  });
}

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

    const height = 56 + table.columns.length * 24 + 8;
    colHeights[col] += height + GRID_GAP_Y;

    return positioned;
  });
}
