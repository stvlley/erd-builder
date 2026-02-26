import { cookies } from "next/headers";
import { db } from "./db";
import { User } from "@/types/auth";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "erd-session";
const SESSION_DURATION_DAYS = 30;

export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sql = db();

  const sessions = await sql`
    SELECT * FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
    LIMIT 1
  `;
  if (sessions.length === 0) return null;

  const users = await sql`
    SELECT * FROM users WHERE id = ${sessions[0].user_id} LIMIT 1
  `;
  if (users.length === 0) return null;

  return { user: users[0] as User };
}

export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const sql = db();

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `;

  await sql`
    UPDATE users SET last_login_at = NOW() WHERE id = ${userId}
  `;

  return token;
}

export function setSessionCookie(token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function destroySession(token: string) {
  const sql = db();
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
