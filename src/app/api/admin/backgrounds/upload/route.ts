import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
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

function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimeType] || 'webp';
}

async function saveUploadedFile(buffer: Buffer, originalName: string, mimeType: string) {
  const ext = getExtFromMime(mimeType);
  const uniqueId = randomUUID().slice(0, 8);
  const filename = `${uniqueId}_${Date.now()}.${ext}`;

  // Ensure directories exist
  const bgDir = join(process.cwd(), 'public', 'backgrounds');
  const thumbDir = join(bgDir, 'thumbnails');
  await mkdir(bgDir, { recursive: true });
  await mkdir(thumbDir, { recursive: true });

  // Save original file
  const filePath = join(bgDir, filename);
  await writeFile(filePath, buffer);

  // Generate thumbnail using sharp
  let thumbnailUrl: string | null = null;
  try {
    const sharp = (await import('sharp')).default;
    const thumbFilename = `thumb_${filename.replace(/\.[^.]+$/, '.webp')}`;
    const thumbPath = join(thumbDir, thumbFilename);

    await sharp(filePath)
      .resize(300, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    thumbnailUrl = `/backgrounds/thumbnails/${thumbFilename}`;
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    // Don't fail the whole upload - thumbnail is optional
  }

  const imageUrl = `/backgrounds/${filename}`;

  return { imageUrl, thumbnailUrl, filename, originalName, size: buffer.length };
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

    // Check if this is a base64 JSON upload or multipart form upload
    if (contentType.includes('application/json')) {
      // Base64 JSON upload approach
      const body = await request.json();
      const { file: base64Data, name, type: mimeType } = body;

      if (!base64Data || !mimeType) {
        return NextResponse.json({ error: 'بيانات الملف مطلوبة' }, { status: 400 });
      }

      if (!allowedTypes.includes(mimeType)) {
        return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ: JPEG, PNG, WebP, GIF' }, { status: 400 });
      }

      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > MAX_SIZE) {
        return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' }, { status: 400 });
      }

      const result = await saveUploadedFile(buffer, name || 'upload', mimeType);
      return NextResponse.json({ success: true, ...result });
    }

    // Multipart form data upload
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

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' }, { status: 400 });
    }

    // Read file buffer
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } catch (bufferError) {
      console.error('File buffer read failed:', bufferError);
      return NextResponse.json({ error: 'فشل في قراءة الملف' }, { status: 400 });
    }

    const result = await saveUploadedFile(buffer, file.name, file.type);
    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error('Upload background error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'فشل في رفع الملف', details: message }, { status: 500 });
  }
}
