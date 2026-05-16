import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { diagnoseAppliance } from '@/app/tools/fix/actions';

export const runtime = 'nodejs';

const BodySchema = z.object({
    model: z.string().min(1),
    serial: z.string().optional(),
    symptom: z.string().min(1),
    brand: z.string().optional().nullable(),
    productType: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { model, serial, symptom, brand, productType } = BodySchema.parse(json);

        const results = await diagnoseAppliance(model, symptom, serial || '', { brand, productType });
        return NextResponse.json({ results });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
