"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ERDState, ERDAction, SerializableERDState } from "@/types/erd";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;

export function useERDPersistence(
  erdId: string,
  state: ERDState,
  dispatch: React.Dispatch<ERDAction>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [erdName, setErdName] = useState("Untitled ERD");
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load ERD from server on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/erds/${erdId}`);
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const json = await res.json();
        if (cancelled) return;

        const erd = json.erd;
        if (erd) {
          setErdName(erd.name || "Untitled ERD");
          const data = typeof erd.data === "string" ? JSON.parse(erd.data) : erd.data;
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
        }
      } catch {
        // Failed to load — start fresh
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [erdId, dispatch]);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!loaded) return;

    const serializable: SerializableERDState = {
      tables: state.tables,
      relationships: state.relationships,
      customFieldDefinitions: state.customFieldDefinitions,
    };

    const snapshot = JSON.stringify(serializable);
    if (snapshot === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/erds/${erdId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: serializable }),
        });
        if (res.ok) {
          lastSavedRef.current = snapshot;
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [erdId, state.tables, state.relationships, state.customFieldDefinitions, loaded]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);

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
        body: JSON.stringify({ name: erdName, data: serializable }),
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
  }, [erdId, erdName, state.tables, state.relationships, state.customFieldDefinitions]);

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
        // Silently fail name update
      }
    },
    [erdId]
  );

  return { saveStatus, saveNow, erdName, updateName, loaded };
}
