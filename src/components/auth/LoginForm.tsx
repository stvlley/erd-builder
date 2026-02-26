"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/constants";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
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

  const canSubmit = username.trim() && password;

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
          Sign in
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
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          autoFocus
          autoComplete="username"
          style={{
            padding: "12px 16px",
            fontSize: 14,
            fontFamily: "var(--font-body), sans-serif",
            background: COLORS.canvas,
            border: `2px solid ${error ? "#ef4444" : COLORS.borderDim}`,
            color: COLORS.text,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = COLORS.accent;
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = COLORS.borderDim;
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          autoComplete="current-password"
          style={{
            padding: "12px 16px",
            fontSize: 14,
            fontFamily: "var(--font-body), sans-serif",
            background: COLORS.canvas,
            border: `2px solid ${error ? "#ef4444" : COLORS.borderDim}`,
            color: COLORS.text,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = COLORS.accent;
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = COLORS.borderDim;
          }}
        />

        <button
          type="submit"
          disabled={loading || !canSubmit}
          style={{
            padding: "12px 16px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-mono), monospace",
            background: loading || !canSubmit ? COLORS.borderDim : COLORS.accent,
            border: "none",
            color: "#000",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: loading || !canSubmit ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
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
    </div>
  );
}
