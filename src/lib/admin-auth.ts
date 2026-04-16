import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'g-g-admin-secret-key-2024'
);

interface AdminPayload {
  username: string;
  exp: number;
}

export async function createAdminToken(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(JWT_SECRET);
  return token;
}

export async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const admin = payload as unknown as AdminPayload;
    return { valid: true, username: admin.username };
  } catch {
    return { valid: false };
  }
}

export async function getAdminFromRequest(
  request: NextRequest
): Promise<{ authorized: boolean; username?: string }> {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  try {
    const result = await verifyAdminToken(token);
    return {
      authorized: result.valid,
      username: result.username,
    };
  } catch {
    return { authorized: false };
  }
}
