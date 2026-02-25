import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, getSessionCookieName } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;

    if (token) {
      await destroySession(token);
    }

    cookieStore.delete(getSessionCookieName());

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
