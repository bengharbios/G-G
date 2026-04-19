import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'webp';
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
    }

    const imageUrl = `/backgrounds/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      filename,
      originalName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload background error:', error);
    return NextResponse.json({ error: 'فشل في رفع الملف' }, { status: 500 });
  }
}
