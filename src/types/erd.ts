export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface Table {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  x: number;
  y: number;
  columns: Column[];
  collapsed: boolean;
}

export interface Relationship {
  id: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  cardinality: "1:1" | "1:N" | "N:M";
  inferred: boolean;
}

export type SidebarMode =
  | { type: "closed" }
  | { type: "edit-table"; tableId: string }
  | { type: "edit-relationship"; relationshipId: string }
  | { type: "add-relationship" };

export interface ERDState {
  tables: Record<string, Table>;
  relationships: Relationship[];
  selectedTableId: string | null;
  hoveredTableId: string | null;
  hoveredField: { tableId: string; columnId: string; suffix: string } | null;
  activeRelationshipIndex: number | null;
  dragging: { tableId: string; offsetX: number; offsetY: number } | null;
  sidebar: SidebarMode;
}

export interface SerializableERDState {
  tables: Record<string, Table>;
  relationships: Relationship[];
}

export type ERDAction =
  | { type: "LOAD_TABLES"; tables: Record<string, Table>; relationships: Relationship[] }
  | { type: "LOAD_FROM_DB"; tables: Record<string, Table>; relationships: Relationship[] }
  | { type: "GENERATE_RELATIONSHIPS"; relationships: Relationship[]; tables: Record<string, Table> }
  | { type: "MOVE_TABLE"; tableId: string; x: number; y: number }
  | { type: "SET_DRAGGING"; dragging: ERDState["dragging"] }
  | { type: "SET_HOVERED_TABLE"; tableId: string | null }
  | { type: "SET_HOVERED_FIELD"; field: ERDState["hoveredField"] }
  | { type: "SET_ACTIVE_RELATIONSHIP"; index: number | null }
  | { type: "SELECT_TABLE"; tableId: string | null }
  | { type: "UPDATE_TABLE"; tableId: string; updates: Partial<Pick<Table, "name" | "subtitle" | "color">> }
  | { type: "UPDATE_COLUMN"; tableId: string; columnId: string; updates: Partial<Column> }
  | { type: "ADD_COLUMN"; tableId: string; column: Column }
  | { type: "DELETE_COLUMN"; tableId: string; columnId: string }
  | { type: "ADD_TABLE"; table: Table }
  | { type: "DELETE_TABLE"; tableId: string }
  | { type: "ADD_RELATIONSHIP"; relationship: Relationship }
  | { type: "UPDATE_RELATIONSHIP"; relationshipId: string; updates: Partial<Relationship> }
  | { type: "DELETE_RELATIONSHIP"; relationshipId: string }
  | { type: "TOGGLE_COLLAPSE"; tableId: string }
  | { type: "SET_SIDEBAR"; sidebar: SidebarMode }
  | { type: "RESET" };
