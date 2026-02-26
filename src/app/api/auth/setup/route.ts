import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    const sql = db();

    // Check if any users exist
    const existing = await sql`SELECT id FROM users LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Users already exist." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword("Welcome2DHL!");

    const users = await sql`
      INSERT INTO users (display_name, username, password_hash, role)
      VALUES ('getrekt', 'getrekt', ${passwordHash}, 'admin')
      RETURNING id, display_name, username, role
    `;

    return NextResponse.json({
      message: "Admin account created",
      user: users[0],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
