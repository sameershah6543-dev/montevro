import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "@/generated/prisma/client";

export const SESSION_COOKIE = "mv_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = { userId: string; role: Role; name: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: { id: string; role: Role; name: string }) {
  const token = await new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.sub!, role: payload.role as Role, name: payload.name as string };
  } catch {
    return null;
  }
}

export async function getSession() {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Re-checks the role against the database so demoted/deleted users lose access immediately. */
export async function requireUser(next = "/account") {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  const user = await db.user.findUnique({ where: { id: s.userId } });
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return user;
}

export function isAdminRole(role?: Role | null) {
  return role === "ADMIN" || role === "STAFF";
}
