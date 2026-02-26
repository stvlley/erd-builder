import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sql = db();

    const users = await sql`
      SELECT u.id, u.display_name, u.username, u.role, u.created_at, u.last_login_at,
             COALESCE(e.erd_count, 0)::int as erd_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as erd_count FROM erds GROUP BY user_id
      ) e ON e.user_id = u.id
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { username, password, displayName, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 2) {
      return NextResponse.json(
        { error: "Username must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const sql = db();

    // Check for duplicate username
    const existing = await sql`
      SELECT id FROM users WHERE username = ${trimmedUsername} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === "admin" ? "admin" : "user";
    const name = (displayName || trimmedUsername).trim().slice(0, 50);

    const users = await sql`
      INSERT INTO users (display_name, username, password_hash, role)
      VALUES (${name}, ${trimmedUsername}, ${passwordHash}, ${userRole})
      RETURNING id, display_name, username, role, created_at
    `;

    return NextResponse.json({ user: users[0] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const sql = db();

    // Delete user's sessions first, then the user
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
    const deleted = await sql`
      DELETE FROM users WHERE id = ${userId} RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
