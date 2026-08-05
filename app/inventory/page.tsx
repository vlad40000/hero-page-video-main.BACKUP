'use client';

import React from 'react';
import Dashboard from './_components/Dashboard';
import InventoryTable from './_components/InventoryTable';
import PartsCatalogInventory from './_components/PartsCatalogInventory';
import BulkGenerator from './_components/BulkGenerator';
import SidecarView from './_components/SidecarView';
import { useInventoryContext } from './layout';
import { ItemStatus } from '@/lib/inventory-types';

export default function SellerDashboardPage() {
    const {
        items,
        stats,
        view,
        setView,
        openAddModal,
        openEditModal,
        deleteItem,
        bulkUpdateItems,
        updateItemStatus,
        statusSyncingIds
    } = useInventoryContext();

    switch (view) {
        case 'inventory':
            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-slate-900">Inventory Stock</h1>
                        <button
                            onClick={openAddModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
                        >
                            Add New Unit
                        </button>
                    </div>
                    <InventoryTable
                        items={items}
                        onEdit={openEditModal}
                        onDelete={deleteItem}
                        onStatusChange={updateItemStatus}
                        statusSyncingIds={statusSyncingIds}
                    />
                </div>
            );
        case 'partsCatalog':
            return <PartsCatalogInventory />;
        case 'generator':
            return <BulkGenerator availableItems={items} onGenerated={bulkUpdateItems} />;
        case 'sidecar':
            return <SidecarView items={items} onMarkAsListed={(id) => updateItemStatus(id, ItemStatus.LISTED)} />;
        default:
            return (
                <Dashboard
                    stats={stats}
                    recentItems={items}
                    onStartGenerator={() => setView('generator')}
                    onOpenAddModal={openAddModal}
                />
            );
    }
}
