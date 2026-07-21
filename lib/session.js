import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserById } from '../functions/queries.js';

const COOKIE_NAME = 'nexus_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  // SESSION_SECRET is preferred. DATABASE_URL keeps existing deployments working
  // until a dedicated secret is configured in the hosting environment.
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret) {
    throw new Error('SESSION_SECRET não foi configurado.');
  }
  return secret;
}

function sign(encodedPayload) {
  return createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    userId: Number(userId),
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  if (typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expectedSignature = Buffer.from(sign(payload));
  const receivedSignature = Buffer.from(signature);
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isInteger(parsed.userId) || parsed.userId <= 0 || parsed.expiresAt <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createSession(userId) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = readToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) {
    if (cookieStore.has(COOKIE_NAME)) cookieStore.delete(COOKIE_NAME);
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  return { id: Number(user.id), name: user.name, access: Number(user.access) };
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) redirect('/');
  return user;
}

export async function requireAdmin() {
  const user = await requireSessionUser();
  if (user.access !== 1) redirect('/grr');
  return user;
}
