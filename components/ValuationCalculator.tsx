import React, { useMemo, useState } from 'react';
import { ApplianceData } from '../types';
import { calculateResaleValue, PricingResult } from '../lib/flood-engine/services/pricingEngine';
import { calculateRepairEstimate, getRepairScenarios, RepairScenario } from '../lib/flood-engine/services/repair';
import { CheckIcon, AlertTriangleIcon, ShoppingCartIcon, CalendarIcon, ChevronDownIcon } from './Icons';
import { BookingForm } from './BookingForm';

interface ValuationCalculatorProps {
    data: ApplianceData;
    selectedSymptom?: string;
    onShopNew?: () => void;
}

export const ValuationCalculator: React.FC<ValuationCalculatorProps> = ({
    data,
    selectedSymptom,
    onShopNew = () => console.log("Shop New Clicked")
}) => {
    // 4. Constants
    const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];

    const [condition, setCondition] = useState(CONDITION_OPTIONS[1]);
    const [showBooking, setShowBooking] = useState(false);
    const [showRiskReport, setShowRiskReport] = useState(false); // Toggle for "Tell Me More"

    // Derive ageMonths from data (safe calculation)
    const mfgYear = data?.identification?.manufactureYear || new Date().getFullYear();
    const mfgMonth = data?.identification?.manufactureMonth || 1;
    const now = new Date();
    const manufacturedDate = new Date(mfgYear, mfgMonth - 1);
    const ageMonths = Math.max(0, (now.getFullYear() - manufacturedDate.getFullYear()) * 12 + (now.getMonth() - manufacturedDate.getMonth()));
    const ageYears = Math.floor(ageMonths / 12);

    const result = useMemo<PricingResult | null>(() => {
        if (!data) return null;
        const p0Value = parseFloat(data.identification.originalMSRP.replace(/[^0-9.]/g, ''));
        const p0 = isNaN(p0Value) ? 0 : p0Value;

        return calculateResaleValue({
            p0,
            brand: data.identification.brand,
            condition,
            ageMonths,
            category: data.identification.category
        });
    }, [data, condition, ageMonths]);

    const riskScenarios = useMemo<RepairScenario[]>(() => {
        if (!data) return [];
        const risks = getRepairScenarios(data.identification.category);
        return [...risks]
            .sort((a: RepairScenario, b: RepairScenario) => b.estimatedCostCents - a.estimatedCostCents)
            .slice(0, 3);
    }, [data]);

    const systemEstimate = useMemo(() => {
        if (!data || !selectedSymptom) return null;
        const estimate = calculateRepairEstimate(data.identification.category, selectedSymptom);
        return estimate?.totalCents ?? null;
    }, [data, selectedSymptom]);

    if (!result || !systemEstimate) return null;

    const finalCents = Math.round(result.finalPrice * 100);
    const thresholdCents = Math.round(finalCents * 0.5);
    const isViable = systemEstimate <= thresholdCents;

    // Helper needed for UI
    const centsToUsd = (c: number) => "$" + (c / 100).toFixed(0);

    return (
        <>
            {/* BOOKING MODAL */}
            {showBooking && (
                <BookingForm
                    onClose={() => setShowBooking(false)}
                    context={{
                        brand: data.identification.brand,
                        category: data.identification.category,
                        model: data.identification.model || "Unknown",
                        serial: data.identification.serial || "Unknown",
                        symptom: selectedSymptom,
                        verdict: isViable ? "Repair" : "Replace",
                        age: ageYears
                    }}
                />
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* CONDITION TOGGLE */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex bg-slate-100 p-1 rounded-full">
                        {CONDITION_OPTIONS.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => setCondition(opt)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${condition === opt
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* VERDICT CARD */}
                <div className={`rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500 ${isViable ? 'bg-white text-slate-900 border border-slate-100' : 'bg-slate-900 text-white'}`}>

                    {/* Status Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isViable ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            {isViable ? <CheckIcon size={32} /> : <AlertTriangleIcon size={32} />}
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black mb-2 tracking-tight">
                            {isViable ? "Repair Recommended" : "Replacement Advised"}
                        </h2>

                        {/* THE EXPLANATION BOX */}
                        <div className={`p-5 rounded-2xl text-left mt-6 ${isViable ? 'bg-emerald-50 border border-emerald-100' : 'bg-white/5 border border-white/10'}`}>
                            <p className={`text-sm leading-relaxed font-medium ${isViable ? 'text-slate-600' : 'text-slate-300'}`}>
                                {isViable ? (
                                    `Based on the age (${ageYears} yrs) and condition, this unit has retained enough value to justify the repair cost.`
                                ) : (
                                    `The estimated repair cost exceeds 50% of the unit's remaining value. At ${ageYears} years old, statistical failure rates increase significantly.`
                                )}
                            </p>

                            {/* "TELL ME MORE" TOGGLE (Only for Replace Verdicts) */}
                            {!isViable && (
                                <button
                                    onClick={() => setShowRiskReport(!showRiskReport)}
                                    className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {showRiskReport ? "Hide Analysis" : "Why? View Risk Report"} <ChevronDownIcon className={`transform transition-transform ${showRiskReport ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>

                        {/* EXPANDABLE RISK REPORT */}
                        {showRiskReport && !isViable && (
                            <div className="mt-4 bg-black/20 rounded-xl p-5 text-left border border-white/5 animate-in slide-in-from-top-2">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Common Major Failures (Age {ageYears}+)</p>
                                <div className="space-y-3">
                                    {riskScenarios.map((risk, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                <span className="text-slate-200 font-medium">{risk.technicalTerm}</span>
                                            </div>
                                            <span className="font-mono text-rose-400">{centsToUsd(risk.estimatedCostCents)}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
                                    *These are typical repairs for {data.identification.category}s of this vintage. Fixing the current issue does not prevent these future failures.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="grid gap-3 md:grid-cols-2">
                        {isViable ? (
                            // REPAIR FLOW
                            <>
                                <button
                                    onClick={() => setShowBooking(true)}
                                    className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <CalendarIcon />
                                    BOOK SERVICE
                                </button>
                                <button
                                    onClick={onShopNew}
                                    className="py-4 bg-white border-2 border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <ShoppingCartIcon />
                                    SHOP UNITS
                                </button>
                            </>
                        ) : (
                            // REPLACE FLOW
                            <>
                                <button
                                    onClick={onShopNew}
                                    className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <ShoppingCartIcon />
                                    SHOP NEW UNITS
                                </button>
                                <button
                                    onClick={() => setShowBooking(true)}
                                    className="py-4 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <CalendarIcon />
                                    REPAIR ANYWAY
                                </button>
                            </>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
                        <div className={`h-px w-8 ${isViable ? 'bg-slate-400' : 'bg-white'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isViable ? 'text-slate-400' : 'text-white'}`}>Professional Market Audit</span>
                        <div className={`h-px w-8 ${isViable ? 'bg-slate-400' : 'bg-white'}`} />
                    </div>

                </div>
            </div>
        </>
    );
};
