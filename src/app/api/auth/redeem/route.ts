import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { code, displayName } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();
    const name = (displayName || "User").trim().slice(0, 50);
    const sql = db();

    // Check if this is the admin bootstrap code
    const adminSetupCode = process.env.ADMIN_SETUP_CODE;
    if (adminSetupCode && trimmedCode === adminSetupCode.toUpperCase()) {
      // Check if an admin already exists
      const existingAdmins = await sql`
        SELECT id FROM users WHERE role = 'admin' LIMIT 1
      `;

      if (existingAdmins.length > 0) {
        return NextResponse.json(
          { error: "Admin already bootstrapped" },
          { status: 400 }
        );
      }

      // Create admin user
      const adminUsers = await sql`
        INSERT INTO users (display_name, role)
        VALUES (${name}, 'admin')
        RETURNING *
      `;

      const adminUser = adminUsers[0];
      const token = await createSession(adminUser.id);
      const cookieStore = await cookies();
      cookieStore.set(setSessionCookie(token));

      return NextResponse.json({
        user: adminUser,
        redirect: "/",
      });
    }

    // Look up invite code
    const inviteCodes = await sql`
      SELECT * FROM invite_codes
      WHERE code = ${trimmedCode} AND is_active = true AND redeemed_by IS NULL
      LIMIT 1
    `;

    if (inviteCodes.length === 0) {
      return NextResponse.json(
        { error: "Invalid or already used code" },
        { status: 400 }
      );
    }

    const inviteCode = inviteCodes[0];

    // Create user
    const newUsers = await sql`
      INSERT INTO users (display_name, role, invite_code_id)
      VALUES (${name}, 'user', ${inviteCode.id})
      RETURNING *
    `;

    const newUser = newUsers[0];

    // Mark invite code as redeemed
    await sql`
      UPDATE invite_codes
      SET redeemed_by = ${newUser.id}, redeemed_at = NOW(), is_active = false
      WHERE id = ${inviteCode.id}
    `;

    const token = await createSession(newUser.id);
    const cookieStore = await cookies();
    cookieStore.set(setSessionCookie(token));

    return NextResponse.json({
      user: newUser,
      redirect: "/",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
