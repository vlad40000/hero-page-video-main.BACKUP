
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { ItemStatus, MarketplaceListing } from '@/lib/inventory-types';
import { Trash2, Pencil, ShieldCheck, ExternalLink } from 'lucide-react';
import { getDisplayUrl } from '@/lib/utils';
import { productPath } from '@/lib/routes';
import { formatUsd } from '@/lib/money';
import StatusSelect from './StatusSelect';

interface ItemCardProps {
    item: MarketplaceListing;
    onDelete?: (id: string) => void;
    onEdit?: (item: MarketplaceListing) => void;
    onLaunch?: (item: MarketplaceListing) => void;
    onStatusChange?: (id: string, status: ItemStatus) => void;
    statusSyncing?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onDelete, onEdit, onLaunch, onStatusChange, statusSyncing }) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="relative h-48 bg-slate-50">
                <img src={getDisplayUrl(item.imageUrl) || ''} className="w-full h-full object-contain" alt={item.title} />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === ItemStatus.LISTED ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white shadow-lg'
                    }`}>
                    {item.status}
                </div>
                {item.sources && item.sources.length > 0 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white flex items-center gap-1" title="Specs Verified via Search">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-bold">Verified</span>
                    </div>
                )}
            </div>
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{item.title}</h3>
                    <span className="font-bold text-blue-600">{formatUsd(item.price)}</span>
                </div>
                <p className="text-slate-400 text-xs font-bold mb-4">{item.brand} • {item.model}</p>
                <div className="flex gap-2 text-[10px] text-slate-500 font-bold uppercase mb-6 tracking-wider">
                    <span className="bg-slate-50 px-2 py-1 rounded">{item.category}</span>
                    <span className="bg-slate-50 px-2 py-1 rounded">{item.condition}</span>
                </div>
                {onStatusChange && (
                    <div className="mb-4">
                        <StatusSelect
                            value={item.status}
                            onChange={(status) => onStatusChange(item.id, status)}
                            disabled={statusSyncing}
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    {onDelete && (
                        <button
                            onClick={() => onDelete(item.id)}
                            className="px-3 py-3 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors"
                            title="Delete Item"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item)}
                            className="flex-1 py-3 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Pencil size={14} /> Edit
                        </button>
                    )}
                    {item.websiteParams?.slug && (
                        <a
                            href={productPath(item.websiteParams.slug)}
                            className="px-3 py-3 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
                            title="View Live Product"
                        >
                            <ExternalLink size={18} />
                        </a>
                    )}
                    {onLaunch && (
                        <button
                            onClick={() => onLaunch(item)}
                            className="flex-1 py-3 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-50"
                        >
                            Launch
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemCard;
