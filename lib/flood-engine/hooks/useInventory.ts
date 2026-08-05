
import { useState, useEffect, useCallback } from 'react';
import { MarketplaceListing, ItemStatus, InventoryStats } from '@/lib/inventory-types';

const LS_KEY = 'marketplace_flood_inventory';

export const useInventory = () => {
    const [items, setItems] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);

    // ── On mount: warm-start from localStorage, then immediately fetch from DB ──
    useEffect(() => {
        // 1. Load localStorage as a fast warm start so the UI isn't blank
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setItems(parsed.map((item: any) => ({
                        ...item,
                        id: item.id || crypto.randomUUID(),
                        status: item.status || ItemStatus.AVAILABLE,
                    })));
                }
            } catch { /* ignore parse errors */ }
        }

        // 2. Immediately fetch from DB as authoritative source
        // Dynamic import avoids bundling 'server-only' into the client
        import('@/lib/inventory-actions').then(({ getInventoryForEmployee }) => {
            getInventoryForEmployee()
                .then(dbItems => {
                    if (Array.isArray(dbItems) && dbItems.length > 0) {
                        setItems(dbItems);
                    }
                })
                .catch(err => console.error('[useInventory] DB load failed:', err))
                .finally(() => setLoading(false));
        }).catch(err => {
            console.error('[useInventory] Failed to import inventory-actions:', err);
            setLoading(false);
        });
    }, []);

    // Persist to localStorage as a cache whenever items change
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(LS_KEY, JSON.stringify(items));
        }
    }, [items, loading]);

    const addItem = useCallback((item: MarketplaceListing) => {
        // Prevent duplicate on model+serial
        if (item.model && item.serial) {
            setItems(prev => {
                const idx = prev.findIndex(i =>
                    i.model?.toLowerCase() === item.model?.toLowerCase() &&
                    i.serial?.toLowerCase() === item.serial?.toLowerCase()
                );
                if (idx !== -1) {
                    const next = [...prev];
                    next[idx] = { ...next[idx], ...item, id: next[idx].id };
                    return next;
                }
                return [{ ...item, id: item.id || crypto.randomUUID(), createdAt: item.createdAt || Date.now(), status: item.status || ItemStatus.AVAILABLE }, ...prev];
            });
            return;
        }
        setItems(prev => [{ ...item, id: item.id || crypto.randomUUID(), createdAt: item.createdAt || Date.now(), status: item.status || ItemStatus.AVAILABLE }, ...prev]);
    }, []);

    const updateItem = useCallback((id: string, updates: Partial<MarketplaceListing>) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, []);

    const bulkUpdateItems = useCallback((updatesArray: { id: string, updates: Partial<MarketplaceListing> }[]) => {
        setItems(prev => {
            const map = new Map(updatesArray.map(u => [u.id, u.updates]));
            return prev.map(item => {
                const u = map.get(item.id);
                return u ? { ...item, ...u } : item;
            });
        });
    }, []);

    const deleteItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const markAsListed = useCallback((id: string) => {
        updateItem(id, { status: ItemStatus.LISTED, lastListedAt: Date.now() });
    }, [updateItem]);

    const bulkAddItems = useCallback((newItems: MarketplaceListing[]) => {
        setItems(prev => {
            const existingSerials = new Set(prev.map(i => i.serial?.toLowerCase()).filter(Boolean));
            const unique = newItems.filter(i => !i.serial || !existingSerials.has(i.serial.toLowerCase()));
            return [...unique, ...prev];
        });
    }, []);

    const refreshFromDatabase = useCallback(async (fetcher: () => Promise<MarketplaceListing[]>) => {
        setLoading(true);
        try {
            const dbItems = await fetcher();
            if (Array.isArray(dbItems) && dbItems.length > 0) {
                setItems(dbItems);
            }
        } catch (e) {
            console.error('[useInventory] refreshFromDatabase failed:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const stats: InventoryStats = {
        totalUnits: items.length,
        availableCount: items.filter(i => i.status === ItemStatus.AVAILABLE).length,
        listedCount: items.filter(i => i.status === ItemStatus.LISTED).length,
        totalValue: items.reduce((acc, i) => acc + (i.price || 0), 0),
    };

    return { items, stats, loading, addItem, updateItem, bulkUpdateItems, deleteItem, markAsListed, setItems, bulkAddItems, refreshFromDatabase };
};
