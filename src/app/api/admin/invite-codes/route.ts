import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sql = db();

    const codes = await sql`
      SELECT ic.*, u.display_name as redeemer_name
      FROM invite_codes ic
      LEFT JOIN users u ON u.id = ic.redeemed_by
      ORDER BY ic.created_at DESC
    `;

    return NextResponse.json({ codes });
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

    const { label } = await request.json();
    const code = crypto.randomUUID().slice(0, 8).toUpperCase();

    const sql = db();

    const codes = await sql`
      INSERT INTO invite_codes (code, label, created_by)
      VALUES (${code}, ${label || null}, ${session.user.id})
      RETURNING *
    `;

    return NextResponse.json({ code: codes[0] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
