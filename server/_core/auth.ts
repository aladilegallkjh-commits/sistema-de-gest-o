import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: number;
  username: string;
  role: string;
};

export type AuthenticatedUser = User;

function getSessionSecret() {
  const secret = process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  userId: number,
  username: string,
  role: string,
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({ userId, username, role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySession(
  cookieValue: string | undefined | null
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });

    const { userId, username, role } = payload as Record<string, unknown>;
    if (!userId || !isNonEmptyString(username) || !isNonEmptyString(role)) {
      return null;
    }

    return { userId: Number(userId), username, role };
  } catch {
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser | null> {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  let sessionToken = cookies[COOKIE_NAME];

  // Fallback: Authorization header (Bearer token)
  if (!sessionToken) {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.slice(7);
    }
  }

  const session = await verifySession(sessionToken);
  if (!session) return null;

  const user = await db.getUserById(session.userId);
  return user ?? null;
}
