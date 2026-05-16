
import { syncInventoryToDatabase } from '../lib/inventory-actions';
import { MarketplaceListing, ItemCondition, ItemStatus } from '../lib/inventory-types';

async function test() {
    const item: MarketplaceListing = {
        id: 'test-sync-' + Date.now(),
        title: 'Test Sync Unit',
        brand: 'TestBrand',
        model: 'TestModel',
        category: 'Washers',
        price: 999,
        condition: ItemCondition.EXCELLENT,
        status: ItemStatus.AVAILABLE,
        description: 'Test Description for sync test',
        seoKeywords: ['test'],
        imageUrl: '',
        createdAt: Date.now()
    };

    console.log('Testing sync...');
    try {
        const result = await syncInventoryToDatabase(item);
        console.log('Result:', result);
    } catch (e) {
        console.error('CRITICAL SYNC FAILURE:', e);
    }
}

test();
