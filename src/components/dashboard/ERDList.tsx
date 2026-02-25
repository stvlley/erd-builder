"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/constants";

interface ERDSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ERDListProps {
  userName: string;
  userRole: string;
}

export default function ERDList({ userName, userRole }: ERDListProps) {
  const router = useRouter();
  const [erds, setErds] = useState<ERDSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchERDs();
  }, []);

  async function fetchERDs() {
    try {
      const res = await fetch("/api/erds");
      if (res.ok) {
        const data = await res.json();
        setErds(data.erds);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to load ERDs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createERD() {
    setCreating(true);
    try {
      const res = await fetch("/api/erds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled ERD" }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/erd/${data.erd.id}`);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to create ERD:", err);
    } finally {
      setCreating(false);
    }
  }

  async function deleteERD(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/erds/${id}`, { method: "DELETE" });
      if (res.ok) {
        setErds((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error("[Dashboard] Failed to delete ERD:", err);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 20px",
          borderBottom: `4px solid ${COLORS.muted}`,
          background: COLORS.bg,
        }}
      >
        <div style={{ width: 4, height: 36, background: COLORS.accent }} />
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              color: COLORS.accent,
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            ERD BUILDER
          </div>
          <div
            style={{
              fontFamily: "var(--font-display), sans-serif",
              color: COLORS.text,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Your Diagrams
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: COLORS.textDim,
              letterSpacing: "0.05em",
            }}
          >
            {userName}
            {userRole === "admin" && (
              <span style={{ color: COLORS.accent, marginLeft: 6 }}>ADMIN</span>
            )}
          </div>
          {userRole === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: `1px solid ${COLORS.borderDim}`,
                color: COLORS.textDim,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                fontFamily: "var(--font-mono), monospace",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ADMIN
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              background: "transparent",
              border: `1px solid ${COLORS.borderDim}`,
              color: COLORS.textDim,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "var(--font-mono), monospace",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 20px",
          borderBottom: `1px solid ${COLORS.borderDim}`,
        }}
      >
        <button
          onClick={createERD}
          disabled={creating}
          style={{
            padding: "8px 16px",
            background: COLORS.accent,
            border: `1px solid ${COLORS.accent}`,
            color: "#000",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            fontFamily: "var(--font-mono), monospace",
            textTransform: "uppercase",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "CREATING..." : "+ NEW ERD"}
        </button>
      </div>

      {/* ERD List */}
      <div style={{ padding: 20 }}>
        {loading ? (
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: COLORS.textDim,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "center",
              padding: 40,
            }}
          >
            Loading...
          </div>
        ) : erds.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: 18,
                color: COLORS.textDim,
                marginBottom: 12,
              }}
            >
              No diagrams yet
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: COLORS.textMuted,
                letterSpacing: "0.05em",
              }}
            >
              Click &quot;+ NEW ERD&quot; to create your first diagram
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {erds.map((erd) => (
              <div
                key={erd.id}
                onClick={() => router.push(`/erd/${erd.id}`)}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.borderDim}`,
                  padding: 20,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = COLORS.accent)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = COLORS.borderDim)
                }
              >
                <div style={{ width: "100%", height: 4, background: COLORS.accent, marginBottom: 16 }} />
                <div
                  style={{
                    fontFamily: "var(--font-display), sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.text,
                    marginBottom: 8,
                  }}
                >
                  {erd.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    color: COLORS.textMuted,
                    letterSpacing: "0.05em",
                  }}
                >
                  Updated {formatDate(erd.updated_at)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteERD(erd.id, erd.name);
                  }}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "transparent",
                    border: "none",
                    color: COLORS.textMuted,
                    fontSize: 16,
                    cursor: "pointer",
                    padding: "2px 6px",
                    lineHeight: 1,
                  }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
