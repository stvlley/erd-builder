"use client";

import { useState, useRef, useEffect } from "react";
import { COLORS } from "@/lib/constants";

const PIN = "11601";

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", ""]);
  const [error, setError] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem("erd-unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(false);

    if (value && index < 4) {
      inputsRef.current[index + 1]?.focus();
    }

    // Check if all filled
    if (next.every((d) => d !== "")) {
      const entered = next.join("");
      if (entered === PIN) {
        sessionStorage.setItem("erd-unlocked", "1");
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(["", "", "", "", ""]);
          inputsRef.current[0]?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (text.length === 5) {
      const next = text.split("");
      setDigits(next);
      if (next.join("") === PIN) {
        sessionStorage.setItem("erd-unlocked", "1");
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(["", "", "", "", ""]);
          inputsRef.current[0]?.focus();
        }, 500);
      }
    }
  };

  if (unlocked) return <>{children}</>;

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
          Enter PIN to continue
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            style={{
              width: 48,
              height: 60,
              textAlign: "center",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "var(--font-mono), monospace",
              background: COLORS.canvas,
              border: `2px solid ${error ? "#ef4444" : d ? COLORS.accent : COLORS.borderDim}`,
              color: COLORS.text,
              borderRadius: 0,
              outline: "none",
              transition: "border-color 0.15s",
              caretColor: COLORS.accent,
            }}
          />
        ))}
      </div>

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
          INCORRECT PIN
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
        5-digit access code required
      </div>
    </div>
  );
}
