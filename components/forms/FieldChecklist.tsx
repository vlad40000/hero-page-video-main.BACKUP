"use client";

import React, { useRef } from 'react';
import { PrinterIcon } from '../Icons';

export const FieldChecklist = () => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans text-slate-900 print:bg-white print:p-0">

            <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-slate-700">Field Activation Checklist</h2>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">
                    <PrinterIcon size={18} /> Print
                </button>
            </div>

            <div ref={printRef} className="max-w-[210mm] mx-auto bg-white border-2 border-slate-900 p-8 min-h-[297mm] relative">

                {/* HEADER */}
                <div className="bg-slate-900 text-white p-4 -mx-8 -mt-8 mb-8 flex justify-between items-center print:bg-slate-900 print:text-white">
                    <div>
                        <h1 className="text-2xl font-black uppercase">Field Activation One-Pager</h1>
                        <p className="text-xs text-blue-200 font-bold tracking-widest">ROAD RUNNER IMPLEMENTATION TEAM</p>
                    </div>
                    <div className="text-right">
                        <div className="border-2 border-white px-2 py-1 text-sm font-bold inline-block">GO-LIVE DATE: ___________</div>
                    </div>
                </div>

                {/* SITE INFO */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="p-4 border border-slate-200 rounded">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Property Details</h3>
                        <div className="space-y-4">
                            <div className="border-b border-dashed border-slate-300 pb-1 text-sm">Name: __________________________</div>
                            <div className="border-b border-dashed border-slate-300 pb-1 text-sm">Address: ________________________</div>
                            <div className="border-b border-dashed border-slate-300 pb-1 text-sm">Site Contact: _____________________</div>
                        </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Scope</h3>
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1 border-b border-dashed border-slate-300 pb-1 text-sm text-center">Total Units: ____</div>
                            <div className="flex-1 border-b border-dashed border-slate-300 pb-1 text-sm text-center">Waves: ____</div>
                        </div>
                        <div className="text-xs font-bold text-slate-500">Access Codes / Gate Info:</div>
                        <div className="h-12 border border-slate-100 bg-slate-50 mt-1"></div>
                    </div>
                </div>

                {/* CHECKLIST */}
                <div className="space-y-6">

                    <Section title="1. Arrival & Staging">
                        <Item text="Check in with Property Manager (Verify Keys/Access)" />
                        <Item text="Locate Staging Area for Spare Inventory" />
                        <Item text="Verify 'Leasing Stock' Inventory Count vs Manifest" />
                    </Section>

                    <Section title="2. Unit Validation (The Walk)">
                        <Item text="Verify Unit Addresses match Master List" />
                        <Item text="Inspect Hookups (Water Valves / Dryer Vents / 220v Outlets)" />
                        <Item text="Flag 'Red Risk' hazards (e.g. leaking valves) immediately" />
                    </Section>

                    <Section title="3. Asset Tagging (Crucial)">
                        <Item text="Apply QR/Bar Code Sticker to Upper Right Rear of Machine" />
                        <Item text="Scan Asset into Dispatch App" />
                        <Item text="Photograph Serial Plate" />
                        <Item text="Photograph Installation Environment" />
                    </Section>

                    <Section title="4. Handoff">
                        <Item text="Test Cycle Run (Fill/Drain/Heat)" />
                        <Item text="Clean Work Area" />
                        <Item text="Leave 'Service Instruction Card' for Tenant" />
                        <Item text="Return Keys to Management Office" />
                    </Section>

                </div>

                {/* EXCEPTIONS */}
                <div className="mt-8 border-t-2 border-slate-200 pt-4">
                    <h3 className="text-sm font-bold text-rose-600 uppercase mb-2">Exceptions / Issues Log</h3>
                    <div className="border border-slate-300 h-32 rounded bg-slate-50"></div>
                </div>

                {/* FOOTER */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="text-[10px] text-slate-400">Road Runner Appliance Co. • Field Ops Form 2B</div>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="border-b border-slate-400 w-32 h-8"></div>
                            <span className="text-[9px] font-bold uppercase">Tech Signature</span>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-slate-400 w-32 h-8"></div>
                            <span className="text-[9px] font-bold uppercase">Site Manager Sign-off</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-1 mb-2 uppercase">{title}</h3>
        <div className="space-y-2 pl-2">
            {children}
        </div>
    </div>
);

const Item = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-slate-300 rounded-sm flex-shrink-0"></div>
        <span className="text-sm font-medium text-slate-700">{text}</span>
    </div>
);
