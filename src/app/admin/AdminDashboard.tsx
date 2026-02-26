"use client";

import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/constants";
import UserTable from "@/components/admin/UserTable";

interface AdminDashboardProps {
  userName: string;
}

export default function AdminDashboard({ userName }: AdminDashboardProps) {
  const router = useRouter();

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
            Admin Dashboard
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
            <span style={{ color: COLORS.accent, marginLeft: 6 }}>ADMIN</span>
          </div>
          <button
            onClick={() => router.push("/")}
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
            BACK TO ERDS
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 40 }}>
        <UserTable />
      </div>
    </div>
  );
}
