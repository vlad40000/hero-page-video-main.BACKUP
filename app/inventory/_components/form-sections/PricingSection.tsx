
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Calculator, ArrowRight } from 'lucide-react';
import { InventoryFormValues } from '../inventory-schema';
import { cn } from '@/lib/utils';
import { formatUsd } from '@/lib/money';

interface PricingSectionProps {
    suggestedPrice: number | null;
    onApplySuggestedPrice: (price: number) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
    suggestedPrice,
    onApplySuggestedPrice
}) => {
    const { register, formState: { errors } } = useFormContext<InventoryFormValues>();

    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator size={16} className="text-blue-600" />
                Value Calculator
            </h3>

            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MSRP ($)</label>
                    <input
                        type="number"
                        {...register('originalPrice')}
                        placeholder="e.g. 999"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-sm font-medium"
                    />
                </div>
                <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age (Months)</label>
                    <input
                        type="number"
                        {...register('ageMonths')}
                        placeholder="e.g. 36"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-sm font-medium"
                    />
                </div>
            </div>

            {suggestedPrice !== null && (
                <div className="flex items-center justify-between bg-blue-100/50 p-3 rounded-xl border border-blue-100">
                    <div className="text-xs text-blue-800 font-medium">
                        Recommended: <span className="font-bold text-lg">{formatUsd(suggestedPrice)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onApplySuggestedPrice(suggestedPrice)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Apply <ArrowRight size={12} />
                    </button>
                </div>
            )}

            <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Final Listing Price ($)</label>
                <input
                    required
                    type="number"
                    {...register('price')}
                    placeholder="399"
                    className={cn(
                        "w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-lg text-blue-600",
                        errors.price && "border-red-300 focus:border-red-500"
                    )}
                />
                {errors.price && <span className="text-[10px] text-red-500 mt-1 block">{errors.price.message}</span>}
            </div>
        </div>
    );
};
