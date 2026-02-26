import { ERDState, ERDAction, Table } from "@/types/erd";

export const initialState: ERDState = {
  tables: {},
  relationships: [],
  customFieldDefinitions: [],
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

    case "LOAD_FROM_DB": {
      console.log("[ERD Reducer] LOAD_FROM_DB:", Object.keys(action.tables).length, "tables");
      return {
        ...initialState,
        tables: action.tables,
        relationships: action.relationships,
        customFieldDefinitions: action.customFieldDefinitions || [],
      };
    }

    case "GENERATE_RELATIONSHIPS": {
      // Remove all existing inferred relationships, keep manual ones
      const manualRels = state.relationships.filter((r) => !r.inferred);
      // Combine manual + newly inferred
      const combined = [...manualRels, ...action.relationships];
      return {
        ...state,
        tables: action.tables,
        relationships: combined,
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

    case "TOGGLE_COLUMN_COLLAPSE": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: {
            ...table,
            columns: table.columns.map((col) =>
              col.id === action.columnId ? { ...col, collapsed: !col.collapsed } : col
            ),
          },
        },
      };
    }

    case "UPDATE_COLUMN_METADATA": {
      const table = state.tables[action.tableId];
      if (!table) return state;
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.tableId]: {
            ...table,
            columns: table.columns.map((col) =>
              col.id === action.columnId
                ? {
                    ...col,
                    ...(action.description !== undefined && { description: action.description }),
                    ...(action.metadata !== undefined && { metadata: action.metadata }),
                  }
                : col
            ),
          },
        },
      };
    }

    case "ADD_CUSTOM_FIELD":
      return {
        ...state,
        customFieldDefinitions: [...state.customFieldDefinitions, action.field],
      };

    case "RENAME_CUSTOM_FIELD": {
      const oldDef = state.customFieldDefinitions.find((f) => f.id === action.fieldId);
      if (!oldDef) return state;
      const oldName = oldDef.name;
      const newName = action.newName;
      // Rename definition
      const updatedDefs = state.customFieldDefinitions.map((f) =>
        f.id === action.fieldId ? { ...f, name: newName } : f
      );
      // Migrate key in all columns' metadata
      const updatedTables: Record<string, Table> = {};
      for (const [tid, table] of Object.entries(state.tables)) {
        updatedTables[tid] = {
          ...table,
          columns: table.columns.map((col) => {
            if (!col.metadata || !(oldName in col.metadata)) return col;
            const { [oldName]: value, ...rest } = col.metadata;
            return { ...col, metadata: { ...rest, [newName]: value } };
          }),
        };
      }
      return { ...state, customFieldDefinitions: updatedDefs, tables: updatedTables };
    }

    case "DELETE_CUSTOM_FIELD": {
      const defToDelete = state.customFieldDefinitions.find((f) => f.id === action.fieldId);
      if (!defToDelete) return state;
      const fieldName = defToDelete.name;
      const filteredDefs = state.customFieldDefinitions.filter((f) => f.id !== action.fieldId);
      // Remove key from all columns' metadata
      const cleanedTables: Record<string, Table> = {};
      for (const [tid, tbl] of Object.entries(state.tables)) {
        cleanedTables[tid] = {
          ...tbl,
          columns: tbl.columns.map((col) => {
            if (!col.metadata || !(fieldName in col.metadata)) return col;
            const { [fieldName]: _, ...rest } = col.metadata;
            return { ...col, metadata: rest };
          }),
        };
      }
      return { ...state, customFieldDefinitions: filteredDefs, tables: cleanedTables };
    }

    case "SET_SIDEBAR":
      return { ...state, sidebar: action.sidebar };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}
