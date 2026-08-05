
'use client';

import { useInventoryContext } from '../layout';
import ItemCard from '../_components/ItemCard';
import InventoryTable from '../_components/InventoryTable';
import { Package, Plus, LayoutGrid, List, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ItemStatus, ItemCondition } from '@/lib/inventory-types';
import { formatUsd } from '@/lib/money';

export default function InventoryPage() {
    const { items, deleteItem, openEditModal, openAddModal, updateItemStatus, statusSyncingIds } = useInventoryContext();
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // --- DERIVED STATE: FILTERS & METRICS ---

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [items, searchQuery, filterStatus, filterCategory]);

    const metrics = useMemo(() => {
        const totalUnits = items.length;
        const available = items.filter(i => i.status === ItemStatus.AVAILABLE).length;
        const listed = items.filter(i => i.status === ItemStatus.LISTED).length;
        const sold = items.filter(i => i.status === ItemStatus.SOLD).length;

        // Sum total list value
        const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);

        return { totalUnits, available, listed, sold, totalValue };
    }, [items]);

    const uniqueCategories = useMemo(() => {
        const cats = new Set(items.map(i => i.category));
        return Array.from(cats).sort();
    }, [items]);

    return (
        <div className="space-y-6">

            {/* 1. SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <SummaryCard label="Total Units" value={metrics.totalUnits} />
                <SummaryCard label="Available" value={metrics.available} color="text-green-600" />
                <SummaryCard label="Pending/Listed" value={metrics.listed} color="text-blue-600" />
                <SummaryCard label="Sold" value={metrics.sold} color="text-slate-500" />
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total List Value</div>
                    <div className="text-2xl font-bold text-slate-900">
                        {formatUsd(metrics.totalValue)}
                    </div>
                </div>
            </div>

            {/* 2. CONTROLS ROW */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

                {/* SEARCH & FILTERS */}
                <div className="flex flex-1 flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value={ItemStatus.AVAILABLE}>Available</option>
                        <option value={ItemStatus.LISTED}>Listed</option>
                        <option value={ItemStatus.SOLD}>Sold</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white capitalize"
                    >
                        <option value="all">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* VIEW TOGGLE */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Table View"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* 3. CONTENT AREA */}
            <div className="min-h-[400px]">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                        <Package className="text-slate-300 mb-4 opacity-50" size={64} />
                        <p className="text-xl font-medium text-slate-600">No items found.</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search query.</p>
                        <button
                            onClick={openAddModal}
                            className="mt-6 text-indigo-600 font-bold hover:underline flex items-center gap-2"
                        >
                            <Plus size={16} /> Add a new unit
                        </button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'table' ? (
                            <InventoryTable
                                items={filteredItems}
                                onEdit={openEditModal}
                                onDelete={deleteItem}
                                onStatusChange={updateItemStatus}
                                statusSyncingIds={statusSyncingIds}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredItems.map(item => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        onDelete={deleteItem}
                                        onEdit={openEditModal}
                                        onStatusChange={updateItemStatus}
                                        statusSyncing={statusSyncingIds.has(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, color = 'text-slate-900' }: { label: string, value: number, color?: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>
                {value}
            </div>
        </div>
    );
}
