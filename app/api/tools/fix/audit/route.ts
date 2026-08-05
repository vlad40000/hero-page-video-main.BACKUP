import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auditAppliance } from '@/app/tools/fix/actions';

export const runtime = 'nodejs';

const BodySchema = z.object({
    model: z.string().min(1),
    serial: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { model, serial } = BodySchema.parse(json);

        const data = await auditAppliance(model, serial);
        return NextResponse.json(data);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
