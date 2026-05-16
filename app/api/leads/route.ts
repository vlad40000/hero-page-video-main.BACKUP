import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  intentType: z.enum(['REPAIR', 'BUY', 'SELL', 'TRIAGE']),
  applianceCategory: z.string().optional(),
  brand: z.string().optional(),
  symptoms: z.string().optional(),
  metadata: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = LeadSchema.parse(body);

    const result = await db.insert(leads).values({
      ...validatedData,
      status: 'NEW',
    }).returning();

    return NextResponse.json({ success: true, leadId: result[0].id });
  } catch (error) {
    console.error('Lead capture error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
