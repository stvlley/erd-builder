"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/lib/constants";

interface UserWithCount {
  id: string;
  display_name: string;
  username: string;
  role: string;
  created_at: string;
  last_login_at: string;
  erd_count: number;
}

export default function UserTable() {
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        return;
      }

      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      fetchUsers();
    } catch {
      setCreateError("Connection error");
    } finally {
      setCreating(false);
    }
  }

  async function deleteUser(userId: string) {
    setDeletingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("[Admin] Failed to delete user:", err);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "--";
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

  const inputStyle = {
    padding: "8px 12px",
    fontSize: 12,
    fontFamily: "var(--font-body), sans-serif",
    background: COLORS.canvas,
    border: `1px solid ${COLORS.borderDim}`,
    color: COLORS.text,
    outline: "none",
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

      {/* Create user form */}
      <form onSubmit={createUser} style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Username"
          value={newUsername}
          onChange={(e) => { setNewUsername(e.target.value); setCreateError(""); }}
          style={{ ...inputStyle, width: 140 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setCreateError(""); }}
          autoComplete="new-password"
          style={{ ...inputStyle, width: 140 }}
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
          style={{
            ...inputStyle,
            width: 90,
            cursor: "pointer",
          }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={creating || !newUsername.trim() || !newPassword}
          style={{
            padding: "8px 16px",
            background: creating || !newUsername.trim() || !newPassword ? COLORS.borderDim : COLORS.accent,
            border: "none",
            color: "#000",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            fontFamily: "var(--font-mono), monospace",
            textTransform: "uppercase",
            cursor: creating || !newUsername.trim() || !newPassword ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "CREATING..." : "CREATE USER"}
        </button>
        {createError && (
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "#ef4444", letterSpacing: "0.05em" }}>
            {createError}
          </span>
        )}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>USERNAME</th>
            <th style={headerCellStyle}>NAME</th>
            <th style={headerCellStyle}>ROLE</th>
            <th style={headerCellStyle}>ERDS</th>
            <th style={headerCellStyle}>CREATED</th>
            <th style={headerCellStyle}>LAST LOGIN</th>
            <th style={headerCellStyle}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ ...cellStyle, fontWeight: 700 }}>{user.username || "--"}</td>
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
              <td style={cellStyle}>
                <button
                  onClick={() => deleteUser(user.id)}
                  disabled={deletingId === user.id}
                  style={{
                    padding: "4px 8px",
                    background: "transparent",
                    border: `1px solid ${COLORS.borderDim}`,
                    color: deletingId === user.id ? COLORS.textMuted : "#ef4444",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-mono), monospace",
                    textTransform: "uppercase",
                    cursor: deletingId === user.id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === user.id ? "..." : "DELETE"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
