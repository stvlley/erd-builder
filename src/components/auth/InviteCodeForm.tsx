"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/constants";

export default function InviteCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          displayName: displayName.trim() || "User",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }

      router.push(data.redirect || "/");
      router.refresh();
    } catch {
      setError("Connection error");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.bg,
        gap: 32,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: COLORS.accent,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          ERD BUILDER
        </div>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: 22,
            color: COLORS.text,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Enter invite code
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: 320,
        }}
      >
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{
            padding: "12px 16px",
            fontSize: 14,
            fontFamily: "var(--font-body), sans-serif",
            background: COLORS.canvas,
            border: `2px solid ${COLORS.borderDim}`,
            color: COLORS.text,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.borderDim)}
        />

        <input
          type="text"
          placeholder="Invite code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          autoFocus
          style={{
            padding: "12px 16px",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-mono), monospace",
            background: COLORS.canvas,
            border: `2px solid ${error ? "#ef4444" : code ? COLORS.accent : COLORS.borderDim}`,
            color: COLORS.text,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />

        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            padding: "12px 16px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-mono), monospace",
            background: loading || !code.trim() ? COLORS.borderDim : COLORS.accent,
            border: "none",
            color: "#000",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? "VERIFYING..." : "ENTER"}
        </button>
      </form>

      {error && (
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "#ef4444",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: COLORS.textMuted,
          letterSpacing: "0.06em",
        }}
      >
        Invite code required for access
      </div>
    </div>
  );
}
