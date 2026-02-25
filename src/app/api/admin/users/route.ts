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

    const users = await sql`
      SELECT u.*, COALESCE(e.erd_count, 0)::int as erd_count
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
