'use client';

import BulkGenerator from '../_components/BulkGenerator';
import { useInventoryContext } from '../layout';
import { ItemStatus } from '@/lib/inventory-types';
import { useRouter } from 'next/navigation';

export default function GeneratorPage() {
    const { items, bulkUpdateItems } = useInventoryContext();
    const router = useRouter();
    const availableItems = items.filter((item) => item.status !== ItemStatus.SOLD);

    return (
        <BulkGenerator
            availableItems={availableItems}
            onGenerated={(updates) => {
                bulkUpdateItems(updates);
                router.push('/inventory');
            }}
        />
    );
}
