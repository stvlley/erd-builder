import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: List user's ERDs
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = db();
    const erds = await sql`
      SELECT id, name, created_at, updated_at
      FROM erds
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `;

    return NextResponse.json({ erds });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new ERD
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name || "Untitled ERD").trim().slice(0, 100);

    const sql = db();
    const erds = await sql`
      INSERT INTO erds (user_id, name, data)
      VALUES (${session.user.id}, ${name}, ${{tables: {}, relationships: []}}::jsonb)
      RETURNING *
    `;

    return NextResponse.json({ erd: erds[0] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
