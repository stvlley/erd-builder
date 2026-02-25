"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/lib/constants";

interface InviteCodeData {
  id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
  redeemer_name: string | null;
}

export default function InviteCodeManager() {
  const [codes, setCodes] = useState<InviteCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    try {
      const res = await fetch("/api/admin/invite-codes");
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes);
      }
    } catch (err) {
      console.error("[Admin] Failed to load codes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setCodes((prev) => [data.code, ...prev]);
        setLabel("");
      }
    } catch (err) {
      console.error("[Admin] Failed to generate code:", err);
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const cellStyle = {
    padding: "10px 16px",
    fontFamily: "var(--font-mono), monospace",
    fontSize: 11,
    color: COLORS.text,
    borderBottom: `1px solid ${COLORS.borderDim}`,
    letterSpacing: "0.03em",
  };

  const headerCellStyle = {
    ...cellStyle,
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
  };

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: 12,
          letterSpacing: "0.04em",
        }}
      >
        Invite Codes
      </div>

      {/* Generate form */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{
            padding: "8px 12px",
            fontSize: 12,
            fontFamily: "var(--font-body), sans-serif",
            background: COLORS.canvas,
            border: `1px solid ${COLORS.borderDim}`,
            color: COLORS.text,
            outline: "none",
            width: 200,
          }}
        />
        <button
          onClick={generateCode}
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
          {creating ? "GENERATING..." : "GENERATE CODE"}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 20, color: COLORS.textDim, fontFamily: "var(--font-mono), monospace", fontSize: 11 }}>
          Loading codes...
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>CODE</th>
              <th style={headerCellStyle}>LABEL</th>
              <th style={headerCellStyle}>STATUS</th>
              <th style={headerCellStyle}>REDEEMED BY</th>
              <th style={headerCellStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id}>
                <td style={{ ...cellStyle, letterSpacing: "0.15em", fontWeight: 700 }}>
                  {code.code}
                </td>
                <td style={{ ...cellStyle, color: COLORS.textDim }}>
                  {code.label || "—"}
                </td>
                <td style={cellStyle}>
                  <span
                    style={{
                      color: code.redeemed_by ? COLORS.textMuted : "#34D399",
                      textTransform: "uppercase",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                    }}
                  >
                    {code.redeemed_by ? "USED" : "AVAILABLE"}
                  </span>
                </td>
                <td style={{ ...cellStyle, color: COLORS.textDim }}>
                  {code.redeemer_name || "—"}
                </td>
                <td style={cellStyle}>
                  {!code.redeemed_by && (
                    <button
                      onClick={() => copyCode(code.code, code.id)}
                      style={{
                        padding: "4px 8px",
                        background: "transparent",
                        border: `1px solid ${COLORS.borderDim}`,
                        color: copiedId === code.id ? "#34D399" : COLORS.textDim,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        fontFamily: "var(--font-mono), monospace",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      {copiedId === code.id ? "COPIED" : "COPY"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
