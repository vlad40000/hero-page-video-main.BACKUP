import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

/**
 * SECURE CLOUD UPLOAD ENDPOINT
 * 
 * This route takes a raw file and uploads it to Vercel Blob storage.
 * It returns a permanent public URL that can be safely stored in the DB.
 */
export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'image.jpg';

    try {
        if (!request.body) {
            return NextResponse.json({ error: 'No body provided' }, { status: 400 });
        }

        // 1. Content-Type Validation
        const contentType = request.headers.get('content-type') || '';
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'];
        if (!allowedTypes.some(t => contentType.includes(t))) {
            console.warn(`[UPLOAD-GUARD] Blocked invalid content-type: ${contentType}`);
            // We allow octet-stream for raw binary uploads, but check filename extension
            if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
                return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and WEBP allowed.' }, { status: 400 });
            }
        }

        // 2. Size Validation (4.5MB limit for Vercel/Next.js body parsing safely)
        const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
        if (contentLength > 4.5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Max 4.5MB allowed.' }, { status: 413 });
        }

        // 3. Upload to Vercel Blob (Explict Token Sanitization for Environment Stability)
        const rawToken = process.env.BLOB_READ_WRITE_TOKEN;
        const token = rawToken?.replace(/^["']|["']$/g, '');

        console.log(`[BLOB-DIAGNOSTIC] Token present: ${!!rawToken}, Length: ${rawToken?.length}, Prefix: ${rawToken?.substring(0, 10)}...`);

        const arrayBuffer = await request.arrayBuffer();

        const blob = await put(filename, arrayBuffer, {
            access: 'public',
            token: token
        });

        console.log(`[BLOB-UPLOAD] Success: ${blob.url} (${arrayBuffer.byteLength} bytes)`);
        return NextResponse.json(blob);
    } catch (error) {
        console.error('[BLOB-UPLOAD] Failure:', error);
        return NextResponse.json(
            {
                error: 'Upload failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN
            },
            { status: 500 }
        );
    }
}
