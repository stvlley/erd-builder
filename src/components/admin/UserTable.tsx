"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/lib/constants";

interface UserWithCount {
  id: string;
  display_name: string;
  role: string;
  created_at: string;
  last_login_at: string;
  erd_count: number;
}

export default function UserTable() {
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("[Admin] Failed to load users:", err);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div style={{ padding: 20, color: COLORS.textDim, fontFamily: "var(--font-mono), monospace", fontSize: 11 }}>
        Loading users...
      </div>
    );
  }

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
        Users ({users.length})
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>NAME</th>
            <th style={headerCellStyle}>ROLE</th>
            <th style={headerCellStyle}>ERDS</th>
            <th style={headerCellStyle}>CREATED</th>
            <th style={headerCellStyle}>LAST LOGIN</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={cellStyle}>{user.display_name}</td>
              <td style={cellStyle}>
                <span
                  style={{
                    color: user.role === "admin" ? COLORS.accent : COLORS.textDim,
                    textTransform: "uppercase",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  {user.role}
                </span>
              </td>
              <td style={{ ...cellStyle, color: COLORS.accent }}>{user.erd_count}</td>
              <td style={{ ...cellStyle, color: COLORS.textDim }}>{formatDate(user.created_at)}</td>
              <td style={{ ...cellStyle, color: COLORS.textDim }}>{formatDate(user.last_login_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
