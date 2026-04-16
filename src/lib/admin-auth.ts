import { NextRequest } from 'next/server';
import { validateAdminSession } from '@/lib/turso';

export async function getAdminFromRequest(
  request: NextRequest
): Promise<{ authorized: boolean; username?: string }> {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  try {
    const result = await validateAdminSession(token);
    return {
      authorized: result.valid,
      username: result.username,
    };
  } catch {
    return { authorized: false };
  }
}
