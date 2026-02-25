import { ERDState, ERDAction } from "@/types/erd";

export const initialState: ERDState = {
  tables: {},
  relationships: [],
  selectedTableId: null,
  hoveredTableId: null,
  hoveredField: null,
  activeRelationshipIndex: null,
  dragging: null,
  sidebar: { type: "closed" },
};

export function erdReducer(state: ERDState, action: ERDAction): ERDState {
  switch (action.type) {
    case "LOAD_TABLES": {
      console.log("[ERD Reducer] LOAD_TABLES:", Object.keys(action.tables).length, "tables");
      for (const [id, t] of Object.entries(action.tables)) {
        console.log(`[ERD Reducer]   "${t.name}" (${id}): ${t.columns.length} columns, collapsed=${t.collapsed}`);
      }
      return {
        ...state,
        tables: { ...state.tables, ...action.tables },
        relationships: [...state.relationships, ...action.relationships],
        sidebar: { type: "closed" },
      };
    }

    case "MOVE_TABLE":
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: {
            ...state.tables[action.tableId],
            x: Math.max(0, action.x),
            y: Math.max(0, action.y),
          },
        },
      };

    case "SET_DRAGGING":
      return { ...state, dragging: action.dragging };

    case "SET_HOVERED_TABLE":
      return { ...state, hoveredTableId: action.tableId };

    case "SET_HOVERED_FIELD":
      return { ...state, hoveredField: action.field };

    case "SET_ACTIVE_RELATIONSHIP":
      return { ...state, activeRelationshipIndex: action.index };

    case "SELECT_TABLE":
      return { ...state, selectedTableId: action.tableId };

    case "UPDATE_TABLE": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: { ...table, ...action.updates },
        },
      };
    }

    case "UPDATE_COLUMN": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: {
            ...table,
            columns: table.columns.map((col) =>
              col.id === action.columnId ? { ...col, ...action.updates } : col
            ),
          },
        },
      };
    }

    case "ADD_COLUMN": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: {
            ...table,
            columns: [...table.columns, action.column],
          },
        },
      };
    }

    case "DELETE_COLUMN": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      // Also remove relationships referencing this column
      const newRels = state.relationships.filter(
        (r) =>
          !(r.fromTableId === action.tableId && r.fromColumnId === action.columnId) &&
          !(r.toTableId === action.tableId && r.toColumnId === action.columnId)
      );
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: {
            ...table,
            columns: table.columns.filter((col) => col.id !== action.columnId),
          },
        },
        relationships: newRels,
      };
    }

    case "ADD_TABLE":
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.table.id]: action.table,
        },
      };

    case "DELETE_TABLE": {
      const { [action.tableId]: _, ...remaining } = state.tables;
      return {
        ...state,
        tables: remaining,
        relationships: state.relationships.filter(
          (r) => r.fromTableId !== action.tableId && r.toTableId !== action.tableId
        ),
        sidebar:
          state.sidebar.type === "edit-table" && state.sidebar.tableId === action.tableId
            ? { type: "closed" }
            : state.sidebar,
        selectedTableId:
          state.selectedTableId === action.tableId ? null : state.selectedTableId,
      };
    }

    case "ADD_RELATIONSHIP":
      return {
        ...state,
        relationships: [...state.relationships, action.relationship],
      };

    case "UPDATE_RELATIONSHIP":
      return {
        ...state,
        relationships: state.relationships.map((r) =>
          r.id === action.relationshipId ? { ...r, ...action.updates } : r
        ),
      };

    case "DELETE_RELATIONSHIP":
      return {
        ...state,
        relationships: state.relationships.filter((r) => r.id !== action.relationshipId),
        sidebar:
          state.sidebar.type === "edit-relationship" &&
          state.sidebar.relationshipId === action.relationshipId
            ? { type: "closed" }
            : state.sidebar,
      };

    case "TOGGLE_COLLAPSE": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: { ...table, collapsed: !table.collapsed },
        },
      };
    }

    case "SET_SIDEBAR":
      return { ...state, sidebar: action.sidebar };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}
