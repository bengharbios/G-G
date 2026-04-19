import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await validateToken(token);
  } catch {
    return null;
  }
}

async function generateThumbnail(buffer: Buffer): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    return await sharp(buffer)
      .resize(300, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE = 10 * 1024 * 1024;

    let buffer: Buffer;
    let originalName: string;
    let mimeType: string;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { file: base64Data, name, type } = body;

      if (!base64Data || !type) {
        return NextResponse.json({ error: 'بيانات الملف مطلوبة' }, { status: 400 });
      }
      if (!allowedTypes.includes(type)) {
        return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ: JPEG, PNG, WebP, GIF' }, { status: 400 });
      }

      buffer = Buffer.from(base64Data, 'base64');
      originalName = name || 'upload';
      mimeType = type;
    } else {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (formError) {
        console.error('FormData parsing failed:', formError);
        return NextResponse.json({
          error: 'فشل في قراءة البيانات المرسلة',
          details: formError instanceof Error ? formError.message : String(formError),
        }, { status: 400 });
      }

      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ: JPEG, PNG, WebP, GIF' }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalName = file.name;
      mimeType = file.type;
    }

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' }, { status: 400 });
    }

    // Compress original image with sharp for smaller storage
    let processedBuffer: Buffer;
    try {
      const sharp = (await import('sharp')).default;
      processedBuffer = await sharp(buffer)
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      processedBuffer = buffer;
    }

    // Convert to data URLs (stored directly in database - no external storage needed)
    const imageUrl = `data:image/webp;base64,${processedBuffer.toString('base64')}`;

    // Generate thumbnail
    let thumbnailUrl: string | null = null;
    const thumbBuffer = await generateThumbnail(buffer);
    if (thumbBuffer) {
      thumbnailUrl = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      filename: `${randomUUID().slice(0, 8)}.webp`,
      originalName,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload background error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'فشل في رفع الملف', details: message }, { status: 500 });
  }
}
