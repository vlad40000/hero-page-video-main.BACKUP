
import React, { useMemo, useState } from 'react';
import { ApplianceData } from '@/app/tools/fix/types';
import { calculateValuation, CONDITION_OPTIONS, toCents, centsToUsd, parseMoney } from '@/app/tools/fix/services/valuation';
import { CopyIcon, WrenchIcon, TrendingUpIcon, AlertTriangleIcon, ShoppingBag, CalendarClock } from './Icons';
import Link from 'next/link';

interface ValuationCalculatorProps {
    data: ApplianceData;
    isAuditor?: boolean; // New prop for Auditor mode
    overrideQuote?: number; // New prop to pre-fill quote
}

export const ValuationCalculator: React.FC<ValuationCalculatorProps> = ({ data, isAuditor = false, overrideQuote }) => {
    const [condition, setCondition] = useState(CONDITION_OPTIONS[1]); // Default Good
    const [repairQuote, setRepairQuote] = useState<string>(overrideQuote ? overrideQuote.toFixed(2) : '');
    const result = useMemo(() => {
        if (!data) return;
        const p0Cents = toCents(parseMoney(data.identification.originalMSRP));
        const year = data.identification.manufactureYear;
        const month = data.identification.manufactureMonth;

        if (year <= 0 || month <= 0) return null;

        return calculateValuation(
            p0Cents,
            data.identification.brand,
            data.identification.category,
            year,
            month,
            condition,
            []
        );
    }, [data, condition]);

    const copyAuditTrace = () => {
        if (result?.auditTrace) {
            navigator.clipboard.writeText(JSON.stringify(result.auditTrace, null, 2));
        }
    };

    if (data.identification.manufactureYear === 0) return null;

    const currentMarketValueCents = result ? result.finalCents : 0;
    const tradeInValueCents = result ? result.tradeInMaxCents : 0;

    // 50% Rule Threshold
    const thresholdCents = Math.round(currentMarketValueCents * 0.5);

    const quoteCents = repairQuote ? toCents(parseMoney(repairQuote)) : 0;
    const isRepairable = quoteCents > 0 && quoteCents <= thresholdCents;
    const isBorderline = quoteCents > 0 && quoteCents > thresholdCents && quoteCents <= (currentMarketValueCents * 0.7);
    const isReplace = quoteCents > (currentMarketValueCents * 0.7);

    // Auditor Logic: Suggestion based on 50% rule
    // If quote < 50% limit -> Schedule Repair (Repairable)
    // If quote > 50% limit -> Shop Now (Replace)
    const suggestRepair = quoteCents > 0 && quoteCents <= thresholdCents;
    const suggestReplace = quoteCents > 0 && quoteCents > thresholdCents;


    // Meter calculation
    // We want the gauge to show a bit more than the current value so users can see if they exceed it.
    // Let's set max to 120% of Current Value.
    const meterMax = currentMarketValueCents * 1.2;
    // Safety check to avoid division by zero
    const safeMeterMax = meterMax > 0 ? meterMax : 100;

    const quotePercent = Math.min((quoteCents / safeMeterMax) * 100, 100);
    const thresholdPercent = Math.min((thresholdCents / safeMeterMax) * 100, 100);
    const valuePercent = Math.min((currentMarketValueCents / safeMeterMax) * 100, 100);

    // Helper to determine shop route based on category
    const getShopRoute = (category: string): string => {
        const c = category.toLowerCase();
        if (c.includes('laundry center') || (c.includes('washer') && c.includes('dryer'))) return '/washer-dryer-sets'; // Handle combos/sets
        if (c.includes('refrigerator') || c.includes('fridge') || c.includes('freezer')) return '/refrigerators';
        if (c.includes('washer') || c.includes('washing')) return '/washers';
        if (c.includes('dryer')) return '/dryers';
        if (c.includes('stove') || c.includes('range') || c.includes('oven') || c.includes('cooktop')) return '/stoves-ranges';
        if (c.includes('dishwasher')) return '/dishwashers'; // Assuming this route exists based on folder structure
        return '/shop';
    };

    const shopRoute = getShopRoute(data.identification.category || '');

    return (
        <div className="pt-6 border-t border-slate-200 mt-4 space-y-6">

            {/* Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Machine Condition
                    </label>
                    <div className="relative">
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            className="w-full pl-3 pr-8 py-3 rounded-xl border border-slate-200 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 hover:bg-white transition-colors appearance-none"
                        >
                            {CONDITION_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Est. Repair Cost (Optional)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <input
                            type="text"
                            value={repairQuote}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setRepairQuote(val);
                            }}
                            onBlur={() => {
                                if (!repairQuote) return;
                                setRepairQuote(parseMoney(repairQuote).toFixed(2));
                            }}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-3 rounded-xl border border-slate-200 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white placeholder:text-slate-300 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Decision Engine Display */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm overflow-hidden relative">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        {/* Current Market Value - Hidden in Auditor Mode */}
                        {!isAuditor ? (
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <TrendingUpIcon /> Typical Replacement Pricing
                                </p>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">
                                    {result ? centsToUsd(result.finalCents) : '-'}
                                </p>

                            </div>
                        ) : (
                            /* Placeholder to keep layout if needed, or just specific Auditor header?
                               For now, we can show the Max Repair Cost prominently if we want,
                               or just utilize the space.
                            */
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <WrenchIcon /> Suggested Max Repair Cost
                                </p>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">
                                    {centsToUsd(thresholdCents)}
                                </p>
                            </div>
                        )}

                        {quoteCents > 0 && (
                            <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 shadow-sm ${isRepairable ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                isBorderline ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                    'bg-rose-50 border-rose-100 text-rose-700'
                                }`}>
                                {isRepairable ? <WrenchIcon /> : <AlertTriangleIcon />}
                                <span className="font-bold text-sm">
                                    {isRepairable ? 'Repair Recommended' : isBorderline ? 'Borderline Cost' : 'Replace Recommended'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Visual Gauge */}
                    <div className="mt-8 mb-2 relative">

                        {/* Threshold Label (Tooltip Style) */}
                        <div
                            className="absolute bottom-full mb-1.5 -translate-x-1/2 flex flex-col items-center z-20 transition-all duration-300"
                            style={{ left: `${thresholdPercent}%` }}
                        >
                            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                Suggested Max Repair: {centsToUsd(thresholdCents)}
                            </span>
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-800"></div>
                        </div>

                        {/* Total Value Marker - Hide in Auditor Mode if strictly requested, but it provides context.
                            User said "do not show Current Market value IN THIS TOOL UI".
                            I'll hide the explicit label "Current Market Value" above.
                            I'll also hide the "Total Value" marker if isAuditor to be safe.
                         */}
                        {!isAuditor && (
                            <div
                                className="absolute top-0 -translate-y-1/2 -translate-x-1/2 z-10 flex flex-col items-center group"
                                style={{ left: `${valuePercent}%`, top: '-4px' }}
                            >
                                <div className="w-0.5 h-2 bg-slate-300 mb-0.5"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Replacement Range
                                </span>
                            </div>
                        )}

                        {/* Gauge Track */}
                        <div className="relative h-3 bg-slate-200 rounded-full w-full overflow-hidden shadow-inner ring-1 ring-slate-200">
                            {/* Threshold Line (Dashed) */}
                            <div
                                className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400/50 z-10"
                                style={{ left: `${thresholdPercent}%` }}
                            />

                            {/* Value Line (Dashed) -- Hide in Auditor? */}
                            {!isAuditor && (
                                <div
                                    className="absolute top-0 bottom-0 border-l border-slate-300 z-10"
                                    style={{ left: `${valuePercent}%` }}
                                />
                            )}

                            {/* Quote Bar */}
                            {quoteCents > 0 && (
                                <div
                                    className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out ${isRepairable ? 'bg-emerald-500' : isBorderline ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                    style={{ width: `${quotePercent}%` }}
                                />
                            )}
                        </div>

                        {/* Gauge Labels */}
                        <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1.5 px-1">
                            <span>$0</span>
                            {/* Only show max label if it makes sense contextually, or simple 'Cost Scale' */}
                            <span>Cost Analysis</span>
                        </div>
                    </div>


                    {/* Detailed Decision Text */}
                    {quoteCents > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200/60 text-sm leading-relaxed">
                            {isRepairable && (
                                <p className="text-slate-600">
                                    <span className="font-bold text-emerald-600">Good to repair.</span> The estimated cost is low relative to the typical cost of a replacement machine.
                                </p>
                            )}
                            {isBorderline && (
                                <p className="text-slate-600">
                                    <span className="font-bold text-amber-600">Consider Repair with Caution.</span> Proceed with caution. The repair cost is high considering your machine&apos;s age and reported issue. Consider the appliance&apos;s condition and part availability before proceeding with repair.
                                </p>
                            )}
                            {isReplace && (
                                <p className="text-slate-600">
                                    <span className="font-bold text-rose-600">Not cost effective.</span> The repair cost is critically high relative to the machine&apos;s age and typical replacement cost.
                                    Consider replacing.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Auditor Buttons */}
                    {isAuditor && (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {/* Shop Now Button */}
                            <Link
                                href={shopRoute}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${suggestReplace
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Shop Now
                            </Link>

                            {/* Schedule Repair Button */}
                            <Link
                                href="/services#repair"
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${suggestRepair
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <CalendarClock className="w-4 h-4" />
                                Schedule Repair
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end">
                <button
                    onClick={copyAuditTrace}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
                    title="Copy Technical JSON"
                >
                    <CopyIcon />
                    Copy Calculation Trace
                </button>
            </div>
        </div>
    );
};
