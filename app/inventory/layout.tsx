
'use client';

import React, { useState, createContext, useContext } from 'react';
import Sidebar from './_components/Sidebar';
import InventoryForm from './_components/InventoryForm';
import ConnectModal from './_components/ConnectModal';
import { useInventory } from '@/lib/flood-engine/hooks/useInventory';
import { MarketplaceListing, AppView, ItemStatus } from '@/lib/inventory-types';
import { Plus, RefreshCw, Database, Search, Menu } from 'lucide-react';
import { getInventoryForEmployee, resetAndSyncFullInventory, syncInventoryToDatabase, logToServer, deleteInventoryFromDatabase } from '@/lib/inventory-actions';
import { generateSlug } from '@/lib/inventory-utils';
import { toast } from 'sonner';

// Create a context to share the hook logic and UI handlers across pages
interface InventoryContextType extends ReturnType<typeof useInventory> {
    view: AppView;
    setView: (view: AppView) => void;
    openEditModal: (item: MarketplaceListing) => void;
    openAddModal: () => void;
    updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
    statusSyncingIds: Set<string>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const useInventoryContext = () => {
    const context = useContext(InventoryContext);
    if (!context) throw new Error('useInventoryContext must be used within InventoryProvider');
    return context;
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const inventory = useInventory();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MarketplaceListing | undefined>(undefined);
    const [view, setView] = useState<AppView>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // For mobile sidebar
    const [statusSyncingIds, setStatusSyncingIds] = useState<Set<string>>(new Set());

    const handleOpenAdd = () => {
        setEditingItem(undefined);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item: MarketplaceListing) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        const itemToDelete = inventory.items.find(i => i.id === id);
        if (!itemToDelete) return;

        // Optimistic UI: remove immediately
        inventory.deleteItem(id);

        const slug = itemToDelete.websiteParams?.slug;
        if (!slug) {
            // No slug means it was never saved to DB — local-only delete is fine
            toast.success('Item removed.');
            return;
        }

        try {
            const result = await deleteInventoryFromDatabase(slug);
            if (result.success) {
                toast.success('Item deleted from database.');
            } else {
                throw new Error(result.error || 'DB delete failed');
            }
        } catch (error) {
            // Rollback: re-add the item if DB delete failed
            inventory.addItem(itemToDelete);
            toast.error(`Could not delete from database: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleSyncFromDB = async () => {
        await inventory.refreshFromDatabase(getInventoryForEmployee);
    };

    const handleUpdateItemStatus = async (id: string, status: ItemStatus) => {
        const existingItem = inventory.items.find((item) => item.id === id);
        if (!existingItem || existingItem.status === status) return;

        const previousStatus = existingItem.status;
        const updatedItem: MarketplaceListing = {
            ...existingItem,
            status,
            lastListedAt: status === ItemStatus.LISTED ? Date.now() : existingItem.lastListedAt,
        };

        setStatusSyncingIds((prev) => new Set(prev).add(id));
        inventory.updateItem(id, updatedItem);

        try {
            const result = await syncInventoryToDatabase(updatedItem);
            if (!result.success) {
                throw new Error(result.error || 'Status sync failed');
            }
            toast.success(`Status changed to ${status}.`);
            await inventory.refreshFromDatabase(getInventoryForEmployee);
        } catch (error) {
            inventory.updateItem(id, { status: previousStatus });
            toast.error(`Could not update status: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setStatusSyncingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleFullReset = async () => {
        const confirmation = prompt('Type RESET to confirm clearing and re-syncing the entire database from the dashboard. This cannot be undone.');
        if (confirmation !== 'RESET') {
            if (confirmation !== null) toast.error('Confirmation text did not match. Reset cancelled.');
            return;
        }
        const result = await resetAndSyncFullInventory(inventory.items);
        if (result.success) {
            toast.success(`Successfully reset and synced ${result.syncedCount} items.`);
        } else {
            toast.error(`Reset failed: ${result.error}`);
        }
    };

    const contextValue: InventoryContextType = {
        ...inventory,
        view,
        setView,
        deleteItem: handleDelete,
        openEditModal: handleOpenEdit,
        openAddModal: handleOpenAdd,
        updateItemStatus: handleUpdateItemStatus,
        statusSyncingIds,
    };

    return (
        <InventoryContext.Provider value={contextValue}>
            <div className="min-h-screen bg-slate-50/50 font-sans">
                {/* 1. SIDEBAR (Desktop & Mobile Drawer) */}
                <Sidebar
                    currentView={view}
                    onViewChange={setView}
                    onOpenAddModal={handleOpenAdd}
                    onOpenConnectModal={() => setIsConnectOpen(true)}
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                />

                {/* 2. MAIN CONTENT AREA (Offset by Sidebar width) */}
                <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">

                    {/* 3. TOPBAR */}
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
                        <div className="flex flex-1 items-center gap-4">
                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Menu size={24} />
                            </button>

                            <form className="relative flex-1 md:max-w-md hidden md:flex">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Global Search..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </form>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSyncFromDB}
                                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                title="Fetch current live database items"
                            >
                                <RefreshCw size={16} className={inventory.loading ? 'animate-spin' : ''} />
                                <span className="hidden lg:inline">Sync DB</span>
                            </button>

                            <button
                                onClick={handleFullReset}
                                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Master Reset Sync"
                            >
                                <Database size={16} />
                            </button>

                            <button
                                onClick={() => setIsConnectOpen(true)}
                                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Open Connect Modal"
                            >
                                Connect
                            </button>

                            <button
                                onClick={handleOpenAdd}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">Add Unit</span>
                            </button>
                        </div>
                    </header>

                    {/* 4. CONTENT */}
                    <main className="flex-1 p-4 md:p-6 overflow-hidden">
                        {children}
                    </main>
                </div>

                {/* MODALS */}
                {isFormOpen && (
                    <InventoryForm
                        initialData={editingItem}
                        items={inventory.items}
                        onClose={() => setIsFormOpen(false)}
                        onSubmit={async (data) => {
                            // ── STEP 1: Resolve slug ───────────────────────────────────────────
                            // For an existing item, the slug is ALWAYS taken from the stored item.
                            // We NEVER regenerate it — that's what was causing duplicate DB rows.
                            const existingSlug = editingItem?.websiteParams?.slug;
                            const slug = existingSlug || generateSlug(
                                data.brand || 'appliance',
                                data.model || data.title || 'unit',
                                data.serial,
                            );

                            // ── STEP 2: Build the item to sync ────────────────────────────────
                            const itemToSync: MarketplaceListing = {
                                ...(editingItem || {}),   // carry DB id, status, createdAt etc.
                                ...data,
                                id: editingItem?.id || crypto.randomUUID(),
                                createdAt: editingItem?.createdAt || Date.now(),
                                // Preserve existing status — don't default to 'available'
                                status: data.status || editingItem?.status || 'available' as any,
                                condition: data.condition || editingItem?.condition || 'good' as any,
                                websiteParams: {
                                    slug,
                                    metaTitle: data.websiteParams?.metaTitle || `Used ${data.brand} ${data.model} | Roadrunner Appliance`,
                                    metaDescription: data.websiteParams?.metaDescription || data.description || '',
                                }
                            } as MarketplaceListing;

                            await logToServer('[onSubmit] Sending to DB', {
                                id: itemToSync.id, slug, status: itemToSync.status, isEdit: !!editingItem
                            });

                            // ── STEP 3: Sync to database ──────────────────────────────────────
                            const result = await syncInventoryToDatabase(itemToSync);

                            if (!result.success) {
                                throw new Error(result.error || 'Database sync failed. Please try again.');
                            }

                            await logToServer('[onSubmit] DB sync OK', {
                                operation: result.operation, dbId: result.id, slug: result.slug
                            });

                            // ── STEP 4: Refresh local state from DB ───────────────────────────
                            await inventory.refreshFromDatabase(getInventoryForEmployee);
                            setIsFormOpen(false);
                        }}



                    />
                )}

                {isConnectOpen && (
                    <ConnectModal
                        items={inventory.items}
                        onClose={() => setIsConnectOpen(false)}
                    />
                )}
            </div>
        </InventoryContext.Provider>
    );
}
