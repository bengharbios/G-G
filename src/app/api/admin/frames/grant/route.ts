import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { grantFrameToUser, getFrameById } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await validateToken(token);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { userId, subscriptionId, frameId, obtainedFrom, obtainedNote } = body;

    if (!userId || !frameId) {
      return NextResponse.json({ error: 'معرف المستخدم والإطار مطلوبان' }, { status: 400 });
    }

    const frame = await getFrameById(frameId);
    if (!frame) {
      return NextResponse.json({ error: 'الإطار غير موجود' }, { status: 404 });
    }

    const userFrame = await grantFrameToUser({
      userId,
      subscriptionId,
      frameId,
      obtainedFrom: obtainedFrom || 'admin',
      obtainedNote: obtainedNote || '',
    });

    if (!userFrame) {
      return NextResponse.json({ error: 'المستخدم يمتلك هذا الإطار بالفعل' }, { status: 409 });
    }

    return NextResponse.json({ success: true, userFrame });
  } catch (error) {
    console.error('Grant frame error:', error);
    return NextResponse.json({ error: 'فشل في منح الإطار' }, { status: 500 });
  }
}
