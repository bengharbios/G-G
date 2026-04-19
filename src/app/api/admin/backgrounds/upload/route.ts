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

function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimeType] || 'webp';
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

async function uploadToBlobStorage(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blob = await put(`backgrounds/${filename}`, buffer, {
    access: 'public',
    contentType,
  });
  return blob.url;
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
      // Base64 JSON upload approach
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

    // Generate unique filenames
    const ext = getExtFromMime(mimeType);
    const uniqueId = randomUUID().slice(0, 8);
    const filename = `${uniqueId}_${Date.now()}.${ext}`;
    const thumbFilename = `thumb_${uniqueId}_${Date.now()}.webp`;

    // Upload original image to Vercel Blob
    let imageUrl: string;
    try {
      imageUrl = await uploadToBlobStorage(buffer, filename, mimeType);
    } catch (blobError) {
      console.error('Blob upload failed:', blobError);
      return NextResponse.json({
        error: 'فشل في رفع الملف إلى التخزين السحابي',
        details: blobError instanceof Error ? blobError.message : String(blobError),
      }, { status: 500 });
    }

    // Generate and upload thumbnail
    let thumbnailUrl: string | null = null;
    const thumbBuffer = await generateThumbnail(buffer);
    if (thumbBuffer) {
      try {
        thumbnailUrl = await uploadToBlobStorage(thumbBuffer, thumbFilename, 'image/webp');
      } catch (thumbUploadErr) {
        console.error('Thumbnail blob upload failed:', thumbUploadErr);
        // Thumbnail is optional, don't fail the upload
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      filename,
      originalName,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload background error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'فشل في رفع الملف', details: message }, { status: 500 });
  }
}
