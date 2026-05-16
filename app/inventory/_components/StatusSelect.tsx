'use client';

import React from 'react';
import { ItemStatus } from '@/lib/inventory-types';

interface StatusSelectProps {
    value: ItemStatus;
    onChange: (status: ItemStatus) => void;
    disabled?: boolean;
}

export default function StatusSelect({ value, onChange, disabled = false }: StatusSelectProps) {
    return (
        <select
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value as ItemStatus)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold uppercase tracking-wide text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
        >
            <option value={ItemStatus.AVAILABLE}>Available</option>
            <option value={ItemStatus.LISTED}>Listed</option>
            <option value={ItemStatus.SOLD}>Sold</option>
        </select>
    );
}
