import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { syncInventoryToDatabase } from '@/lib/inventory-persistence';
import { MarketplaceListing } from '@/lib/inventory-types';

function cleanSecret(value: string | undefined): string {
    return value?.trim().replace(/^["']|["']$/g, '') ?? '';
}

function secretsMatch(candidate: string, expected: string): boolean {
    const candidateDigest = createHash('sha256').update(candidate).digest();
    const expectedDigest = createHash('sha256').update(expected).digest();
    return timingSafeEqual(candidateDigest, expectedDigest);
}

/**
 * Secure inventory sync endpoint for trusted external inventory tools.
 */
export async function POST(request: NextRequest) {
    try {
        const expectedSecret = cleanSecret(process.env.AUTH_SECRET);
        if (expectedSecret.length < 32) {
            console.error('[API-SYNC] AUTH_SECRET is missing or too short.');
            return NextResponse.json({ error: 'Inventory sync is not configured.' }, { status: 503 });
        }

        const authHeader = request.headers.get('authorization') ?? '';
        const providedKey = authHeader.replace(/^Bearer\s+/i, '').trim();

        if (!providedKey || !secretsMatch(providedKey, expectedSecret)) {
            console.error('[API-SYNC] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const result = await syncInventoryToDatabase(body as MarketplaceListing);
        if (!result.success) {
            console.error('[API-SYNC] Sync failed:', result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        console.log(`[API-SYNC] Successfully synced unit: ${result.slug}`);
        return NextResponse.json({
            success: true,
            message: `Unit synced successfully: ${result.slug}`,
            operation: result.operation,
        });
    } catch (error) {
        console.error('[API-SYNC] Critical error:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : 'Unknown',
            },
            { status: 500 },
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
