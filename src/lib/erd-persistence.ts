"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { ERDState, ERDAction, SerializableERDState } from "@/types/erd";

const SAVE_DEBOUNCE_MS = 2000;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useERDPersistence(
  erdId: string,
  state: ERDState,
  dispatch: React.Dispatch<ERDAction>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [erdName, setErdName] = useState("Untitled ERD");
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load ERD on mount
  useEffect(() => {
    let cancelled = false;

    async function loadERD() {
      try {
        const res = await fetch(`/api/erds/${erdId}`);
        if (!res.ok) return;

        const { erd } = await res.json();
        if (cancelled) return;

        setErdName(erd.name);

        const data = erd.data as SerializableERDState;
        if (data && data.tables) {
          dispatch({
            type: "LOAD_FROM_DB",
            tables: data.tables,
            relationships: data.relationships || [],
            customFieldDefinitions: data.customFieldDefinitions || [],
          });
          lastSavedRef.current = JSON.stringify({
            tables: data.tables,
            relationships: data.relationships || [],
            customFieldDefinitions: data.customFieldDefinitions || [],
          });
        }
        setLoaded(true);
      } catch (err) {
        console.error("[Persistence] Load error:", err);
        setLoaded(true);
      }
    }

    loadERD();
    return () => { cancelled = true; };
  }, [erdId, dispatch]);

  // Debounced auto-save when tables or relationships change
  useEffect(() => {
    if (!loaded) return;

    const serializable: SerializableERDState = {
      tables: state.tables,
      relationships: state.relationships,
      customFieldDefinitions: state.customFieldDefinitions,
    };

    const serialized = JSON.stringify(serializable);

    // Skip if nothing changed
    if (serialized === lastSavedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/erds/${erdId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: serializable }),
        });

        if (res.ok) {
          lastSavedRef.current = serialized;
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.tables, state.relationships, state.customFieldDefinitions, erdId, loaded]);

  // Manual save
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const serializable: SerializableERDState = {
      tables: state.tables,
      relationships: state.relationships,
      customFieldDefinitions: state.customFieldDefinitions,
    };

    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/erds/${erdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: serializable }),
      });

      if (res.ok) {
        lastSavedRef.current = JSON.stringify(serializable);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [state.tables, state.relationships, state.customFieldDefinitions, erdId]);

  // Update ERD name
  const updateName = useCallback(
    async (name: string) => {
      setErdName(name);
      try {
        await fetch(`/api/erds/${erdId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      } catch {
        // silently fail name update
      }
    },
    [erdId]
  );

  return { saveStatus, saveNow, erdName, updateName, loaded };
}
