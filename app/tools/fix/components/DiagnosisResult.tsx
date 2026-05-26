import React from 'react';
import { PhoneCall } from 'lucide-react';
import { DiagnosticResult } from '../types';

interface DiagnosisResultProps {
    results: DiagnosticResult[];
    onSelect: (totalCost: number) => void;
    onBack: () => void;
}

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ results, onSelect, onBack }) => {
    const callPhoneHref = 'tel:843-536-6005';

    const isPriced = (result: DiagnosticResult) =>
        Boolean(result.partPriceVerified) &&
        Number.isFinite(result.partPrice) &&
        result.partPrice > 0;

    const calculateTotal = (part: number, labor: number) => {
        const serviceCall = 100;
        const laborCost = labor * 75;
        return Math.round((part + serviceCall + laborCost) * 100) / 100;
    };

    const availabilityLabel = (value?: string | null) => {
        if (!value) return '';
        if (/^in\s*stock$/i.test(value) || /^pia$/i.test(value)) return 'Available for Order';
        return value;
    };

    const verificationLabel = (status?: string) => {
        if (status === 'model_part_verified') return 'In stock';
        if (status === 'targeted_part_search_verified') return 'Call to confirm fit';
        if (status === 'price_only_unverified_fitment') return 'Call to confirm';
        if (status === 'unpriced_pending_quote') return 'Call for parts price';
        return 'Needs verification';
    };

    const verificationClassName = (status?: string) => {
        if (status === 'model_part_verified') return 'bg-emerald-100 text-emerald-700';
        if (status === 'targeted_part_search_verified') return 'bg-blue-100 text-blue-700';
        if (status === 'price_only_unverified_fitment') return 'bg-amber-100 text-amber-700';
        if (status === 'unpriced_pending_quote') return 'bg-amber-100 text-amber-700';
        return 'bg-slate-100 text-slate-600';
    };

    if (results.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Diagnostic Results</h3>
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                        Back to Symptoms
                    </button>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                    We could not generate a diagnostic estimate from the supplier catalogs for this model and symptom. Road Runner can still review the model, serial, and symptom human-to-human before quoting parts or repair.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Diagnostic Results</h3>
                <button
                    onClick={onBack}
                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                    Back to Symptoms
                </button>
            </div>

            <p className="text-sm text-slate-600">
                Based on your appliance model and description, here are the most likely issues.
                Select the one that matches your situation to see the financial impact.
            </p>

            <div className="grid gap-4">
                {results.map((result, index) => {
                    const priced = isPriced(result);
                    const totalCost = priced ? calculateTotal(result.partPrice, result.laborHours) : 0;
                    const handleClick = () => { if (priced) onSelect(totalCost); };

                    return (
                        <div
                            key={index}
                            className={`border border-slate-200 rounded-xl p-5 transition-all bg-white group ${priced ? 'hover:border-blue-400 hover:shadow-md cursor-pointer' : ''}`}
                            onClick={handleClick}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className={`font-bold text-lg text-slate-800 transition-colors ${priced ? 'group-hover:text-blue-600' : ''}`}>
                                        {result.issue}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.probability === 'High' ? 'bg-red-100 text-red-700' :
                                            result.probability === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {result.probability} Probability
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${verificationClassName(result.verificationStatus)}`}>
                                            {verificationLabel(result.verificationStatus)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {priced ? (
                                        <>
                                            <div className="text-2xl font-black text-slate-800">
                                                ${totalCost.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium">Est. Total Repair</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-sm font-bold text-slate-700">Call for total</div>
                                            <div className="text-xs text-slate-400 font-medium">Parts price pending</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                {result.description}
                            </p>

                            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1 border border-slate-100">
                                <div className="flex justify-between gap-3">
                                    <span>Part ({result.partName}):</span>
                                    <span className="font-medium">
                                        {priced ? `$${result.partPrice.toFixed(2)}` : 'Call for current price'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span>Availability:</span>
                                    <span className="font-medium text-right">
                                        {availabilityLabel(result.partAvailability) || 'Call to confirm'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Service Call (Flat Rate):</span>
                                    <span className="font-medium">$100.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estimated Labor:</span>
                                    <span className="font-medium">${(result.laborHours * 75).toFixed(2)}</span>
                                </div>
                                {result.contextWarnings && result.contextWarnings.length > 0 && (
                                    <div className="pt-2 mt-2 border-t border-slate-200 text-[11px] text-amber-700 space-y-1">
                                        {result.contextWarnings.slice(0, 2).map((warning, warningIndex) => (
                                            <div key={warningIndex}>- {warning}</div>
                                        ))}
                                    </div>
                                )}
                                <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
                                    <a
                                        href={callPhoneHref}
                                        onClick={(event) => event.stopPropagation()}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        <PhoneCall className="h-4 w-4" aria-hidden="true" />
                                        Order Part
                                    </a>
                                    <a
                                        href={callPhoneHref}
                                        onClick={(event) => event.stopPropagation()}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        <PhoneCall className="h-4 w-4" aria-hidden="true" />
                                        Schedule Service
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-xl flex gap-3 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <p>
                    <strong>Note:</strong> Part pricing is shown only when verified through an authorized supplier catalog. Final part fitment and sale are confirmed human-to-human by Road Runner before ordering.
                </p>
            </div>
        </div>
    );
};
