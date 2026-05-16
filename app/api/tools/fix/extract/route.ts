import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { extractApplianceInfoFromImage } from '@/app/tools/fix/actions';

export const runtime = 'nodejs';

const BodySchema = z.object({
    base64Image: z.string().min(1),
    mimeType: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { base64Image, mimeType } = BodySchema.parse(json);

        const info = await extractApplianceInfoFromImage(base64Image, mimeType);
        return NextResponse.json(info);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
