import { NextRequest, NextResponse } from 'next/server';
import { syncInventoryToDatabase } from '@/lib/inventory-actions';
import { MarketplaceListing } from '@/lib/inventory-types';

/**
 * SECURE INVENTORY SYNC ENDPOINT
 * 
 * This endpoint allows external tools to sync inventory directly to the website.
 * It includes security checks and data sanitization to prevent 500 errors.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify Authorization
        const authHeader = request.headers.get('authorization');
        const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-for-dev-only-change-in-prod';

        // Support both "Bearer key" and "key" formats
        const providedKey = authHeader?.replace('Bearer ', '');

        if (!providedKey || providedKey !== AUTH_SECRET) {
            console.error('[API-SYNC] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse and Validate Payload
        const body = await request.json();

        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // 3. Perform Sync
        // (The syncInventoryToDatabase action now includes the sanitizeItem filter)
        const result = await syncInventoryToDatabase(body as MarketplaceListing);

        if (!result.success) {
            console.error('[API-SYNC] Sync failed:', result.error);
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

        console.log(`[API-SYNC] Successfully synced unit: ${result.slug}`);
        return NextResponse.json({
            success: true,
            message: `Unit synced successfully: ${result.slug}`,
            operation: result.operation
        });

    } catch (error) {
        console.error('[API-SYNC] Critical error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 });
    }
}

/**
 * Handle OPTIONS for CORS if needed from external domains
 */
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
