import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: Load specific ERD
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const sql = db();

    const erds = await sql`
      SELECT * FROM erds
      WHERE id = ${id} AND user_id = ${session.user.id}
      LIMIT 1
    `;

    if (erds.length === 0) {
      return NextResponse.json({ error: "ERD not found" }, { status: 404 });
    }

    return NextResponse.json({ erd: erds[0] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update ERD
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const sql = db();

    if (body.name !== undefined && body.data !== undefined) {
      const erds = await sql`
        UPDATE erds
        SET name = ${String(body.name).trim().slice(0, 100)},
            data = ${JSON.stringify(body.data)}::jsonb,
            updated_at = NOW()
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING *
      `;
      if (erds.length === 0) {
        return NextResponse.json({ error: "ERD not found" }, { status: 404 });
      }
      return NextResponse.json({ erd: erds[0] });
    } else if (body.name !== undefined) {
      const erds = await sql`
        UPDATE erds
        SET name = ${String(body.name).trim().slice(0, 100)}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING *
      `;
      if (erds.length === 0) {
        return NextResponse.json({ error: "ERD not found" }, { status: 404 });
      }
      return NextResponse.json({ erd: erds[0] });
    } else if (body.data !== undefined) {
      const erds = await sql`
        UPDATE erds
        SET data = ${JSON.stringify(body.data)}::jsonb, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING *
      `;
      if (erds.length === 0) {
        return NextResponse.json({ error: "ERD not found" }, { status: 404 });
      }
      return NextResponse.json({ erd: erds[0] });
    }

    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete ERD
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const sql = db();

    await sql`
      DELETE FROM erds WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
