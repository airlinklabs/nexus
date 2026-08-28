import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../env.js';

const SECRET = new TextEncoder().encode(env.API_SECRET);
const ALGORITHM = 'HS256';
const TTL = '7d';

export type SessionPayload = {
  readonly userId: string;
  readonly username: string;
  readonly avatar: string | null;
  readonly accessToken: string;
};

export function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
