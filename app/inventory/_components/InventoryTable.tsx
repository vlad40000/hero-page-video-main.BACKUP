'use client';

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { MarketplaceListing, ItemCondition, ItemStatus } from '@/lib/inventory-types';
import { Edit, Trash2, Tag, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { getDisplayUrl } from '@/lib/utils';
import { productPath } from '@/lib/routes';
import { formatUsd } from '@/lib/money';
import StatusSelect from './StatusSelect';

interface InventoryTableProps {
    items: MarketplaceListing[];
    onEdit: (item: MarketplaceListing) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ItemStatus) => void;
    statusSyncingIds?: Set<string>;
}

export default function InventoryTable({ items, onEdit, onDelete, onStatusChange, statusSyncingIds }: InventoryTableProps) {

    // Helper for Status Badge styling
    const getStatusBadge = (status: ItemStatus) => {
        switch (status) {
            case ItemStatus.AVAILABLE:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle size={12} />
                        Available
                    </span>
                );
            case ItemStatus.SOLD:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        <CheckCircle size={12} />
                        Sold
                    </span>
                );
            case ItemStatus.LISTED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        <Tag size={12} />
                        Listed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        {status}
                    </span>
                );
        }
    };

    // Helper for Condition Badge styling (Optional, text for now)
    const getConditionLabel = (condition: ItemCondition) => {
        return <span className="capitalize text-slate-600">{condition.replace('-', ' ')}</span>;
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                <AlertCircle size={40} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No inventory items found matching your filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Image</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Item Details</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Category</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Price</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Condition</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 text-right whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-3 align-middle w-16">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                        {item.imageUrl ? (
                                            <img
                                                src={getDisplayUrl(item.imageUrl)}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-slate-300">
                                                <Tag size={16} />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <div className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]" title={item.title}>
                                        {item.brand} {item.model}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5" title={item.serial || 'No Serial'}>
                                        {item.serial || 'S/N: N/A'}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-middle capitalize">
                                    {item.category}
                                </td>
                                <td className="px-4 py-3 align-middle font-medium text-slate-900">
                                    {formatUsd(item.price)}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                    <div className="flex flex-col gap-2">
                                        {getStatusBadge(item.status)}
                                        <StatusSelect
                                            value={item.status}
                                            onChange={(status) => onStatusChange(item.id, status)}
                                            disabled={statusSyncingIds?.has(item.id)}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-xs">
                                    {getConditionLabel(item.condition)}
                                </td>
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                            title="Edit Item"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {item.websiteParams?.slug && (
                                            <a
                                                href={productPath(item.websiteParams.slug)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="View live product"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this item?')) {
                                                    onDelete(item.id);
                                                }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Delete Item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>Showing {items.length} items</span>
                <span>Sorted by Date (Newest)</span>
            </div>
        </div>
    );
}
