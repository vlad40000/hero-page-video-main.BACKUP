"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { PrinterIcon } from '../Icons';

export const LeasingSOP = () => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans text-slate-900 print:bg-white print:p-0">

            {/* ACTION BAR (Hidden on Print) */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-slate-700">Leasing Implementation SOP</h2>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    <PrinterIcon size={18} /> Print / Save PDF
                </button>
            </div>

            {/* DOCUMENT SHEET (A4 / Letter Sized) */}
            <div
                ref={printRef}
                className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-10 min-h-[297mm] print:min-h-0 relative"
            >

                {/* HEADER */}
                <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Leasing Intake to Go-Live</h1>
                        <p className="text-sm font-bold text-slate-500 mt-1">SOP VERSION 1.0 • COMMERCIAL PORTFOLIO PROGRAM</p>
                    </div>
                    <div className="text-right">
                        {/* Logo */}
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <Image
                                src="/road-runner-logo.png"
                                alt="Road Runner"
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                            />
                            <span className="font-bold text-slate-900">Road Runner Appliance</span>
                        </div>
                        <p className="text-xs text-slate-400">Internal Use Only</p>
                    </div>
                </div>

                {/* A) DEAL HEADER */}
                <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-4 border border-slate-200 p-4 rounded bg-slate-50/50 print:bg-transparent print:border-slate-300">
                    <div className="col-span-2">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">A) Deal Header</h3>
                    </div>

                    <div className="space-y-3">
                        <InputRow label="Opportunity ID" />
                        <InputRow label="Customer Sponsor" />
                        <InputRow label="Primary Contact" />
                    </div>
                    <div className="space-y-3">
                        <InputRow label="Target Go-Live" />
                        <InputRow label="Portfolio Type" placeholder="Res / Comm / Mixed" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputRow label="Sites (#)" />
                            <InputRow label="Units (#)" />
                        </div>
                    </div>
                </div>

                {/* B) ROLES */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 px-1">B) Roles & Assignments</h3>
                    <table className="w-full text-xs border border-slate-300">
                        <thead className="bg-slate-100 print:bg-slate-200 font-bold">
                            <tr>
                                <th className="p-2 border border-slate-300 text-left">Role</th>
                                <th className="p-2 border border-slate-300 text-left w-1/3">Name</th>
                                <th className="p-2 border border-slate-300 text-left w-1/4">Email/Phone</th>
                                <th className="p-2 border border-slate-300 text-center w-16">Assign</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['Sales Lead (SL)', 'Solutions Analyst (SA)', 'Finance Analyst (FA)', 'Service Manager (SM)', 'Implementation Mgr (IM)', 'Success Mgr (CSM)'].map(role => (
                                <tr key={role}>
                                    <td className="p-2 border border-slate-300 font-medium">{role}</td>
                                    <td className="p-2 border border-slate-300"></td>
                                    <td className="p-2 border border-slate-300"></td>
                                    <td className="p-2 border border-slate-300 text-center"><input type="checkbox" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* C) ENTRY CRITERIA */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 px-1">C) Entry Gate</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <CheckRow label="Named Customer Sponsor" />
                        <CheckRow label="Portfolio List (Sites/Units)" />
                        <CheckRow label="12mo Spend/Ticket History" />
                        <CheckRow label="Target Go-Live Window" />
                    </div>
                    <div className="mt-3 flex items-center justify-between bg-slate-100 p-2 rounded print:bg-transparent print:border print:border-slate-300">
                        <div className="flex gap-4 text-xs font-bold">
                            <span>Decision:</span>
                            <label><input type="checkbox" /> PASS</label>
                            <label><input type="checkbox" /> FAIL</label>
                        </div>
                        <div className="flex gap-4 text-xs">
                            <span>Approved By: _________________</span>
                            <span>Date: ________</span>
                        </div>
                    </div>
                </div>

                {/* D) STAGE CHECKLIST */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 px-1">D) Stage Execution</h3>

                    <StageBlock title="Step A: Intake & Discovery (Day 0-5)" owner="SL" gate="Gate A (Data Complete)">
                        <CheckItem text="Open opportunity record" />
                        <CheckItem text="Assign SA / FA / SM / IM" />
                        <CheckItem text="Collect inventory + age + failure + spend data" />
                        <CheckItem text="Run discovery call & confirm pain points" />
                    </StageBlock>

                    <StageBlock title="Step B: Portfolio Baseline (Day 3-10)" owner="SA" gate="Gate B (Risk Validated)">
                        <CheckItem text="Normalize inventory by site/class" />
                        <CheckItem text="Assign Risk Tags (Green/Amber/Red)" />
                        <CheckItem text="Compute baseline ticket rate & resolution time" />
                        <CheckItem text="Build Risk Heatmap" />
                    </StageBlock>

                    <StageBlock title="Step C: Financial Model (Day 7-14)" owner="FA" gate="Gate C (Pricing Approved)">
                        <CheckItem text="Build current-state TCO model (CapEx + Volatility)" />
                        <CheckItem text="Build lease-state model (Fixed Opex)" />
                        <CheckItem text="Calculate Capital Preserved & NOI Impact" />
                        <CheckItem text="Prepare Good/Better/Best pricing options" />
                    </StageBlock>

                    <StageBlock title="Step D: Service Design (Day 10-16)" owner="SM" gate="Gate D (SLA Locked)">
                        <CheckItem text="Validate coverage geography & partner capacity" />
                        <CheckItem text="Confirm SLA targets & escalation ladder" />
                        <CheckItem text="Define Repair-vs-Replace thresholds" />
                    </StageBlock>

                    <StageBlock title="Step E: Contracting (Day 14-25)" owner="SL + CSM" gate="Gate E (Signed)">
                        <CheckItem text="Present Impact Case & Recommend Option" />
                        <CheckItem text="Finalize terms, refresh cadence, expansion rules" />
                        <CheckItem text="Execute MSA / SOW / SLA" />
                        <CheckItem text="Confirm billing profile & AP contacts" />
                    </StageBlock>

                    <StageBlock title="Step F: Go-Live (Day 20-40)" owner="IM" gate="Gate F (Live)">
                        <CheckItem text="Publish phased rollout plan" />
                        <CheckItem text="Register/Tag covered units" />
                        <CheckItem text="Activate dispatch workflows" />
                        <CheckItem text="Train customer staff & run test ticket" />
                    </StageBlock>
                </div>

                {/* E) KPI TRACKER */}
                <div className="mb-6 break-inside-avoid">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 px-1">E) 90-Day KPI Tracker</h3>
                    <table className="w-full text-xs border border-slate-300">
                        <thead className="bg-slate-100 font-bold print:bg-slate-200">
                            <tr>
                                <th className="border p-2 text-left">Metric</th>
                                <th className="border p-2 w-16 text-center">Target</th>
                                <th className="border p-2 w-16 text-center">Mo 1</th>
                                <th className="border p-2 w-16 text-center">Mo 2</th>
                                <th className="border p-2 w-16 text-center">Mo 3</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="border p-2">SLA Attainment %</td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td></tr>
                            <tr><td className="border p-2">Mean Time to Resolve</td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td></tr>
                            <tr><td className="border p-2">Cost / Unit / Month</td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td></tr>
                            <tr><td className="border p-2">Capital Preserved</td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td></tr>
                        </tbody>
                    </table>
                </div>

                {/* H) SIGN OFF */}
                <div className="mt-8 border-t-2 border-slate-900 pt-6 break-inside-avoid">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">H) Final Sign-Off</h3>
                    <div className="grid grid-cols-3 gap-8 text-xs">
                        <SignLine label="Sales Lead" />
                        <SignLine label="Finance Lead" />
                        <SignLine label="Service Ops" />
                        <SignLine label="Implementation" />
                        <SignLine label="Success Mgr" />
                        <SignLine label="Customer Sponsor" />
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const InputRow = ({ label, placeholder = "" }: { label: string, placeholder?: string }) => (
    <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-700 whitespace-nowrap w-24">{label}:</span>
        <input
            type="text"
            placeholder={placeholder}
            className="flex-1 border-b border-slate-300 bg-transparent text-sm px-1 focus:outline-none focus:border-blue-500 print:placeholder-transparent"
        />
    </div>
);

const CheckRow = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2">
        <input type="checkbox" className="w-4 h-4 border-slate-300 rounded" />
        <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
);

const StageBlock = ({ title, owner, gate, children }: { title: string, owner: string, gate: string, children: React.ReactNode }) => (
    <div className="mb-4 border border-slate-200 rounded p-3 print:border-slate-300 break-inside-avoid">
        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-blue-900">{title}</h4>
            <span className="text-[10px] font-mono text-slate-500">OWNER: {owner}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
            {children}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{gate}</span>
            <div className="flex gap-2 text-[10px]">
                <label className="flex items-center gap-1"><input type="checkbox" /> Pass</label>
                <label className="flex items-center gap-1"><input type="checkbox" /> Fail</label>
                <span className="ml-2">Initials: _______ Date: _______</span>
            </div>
        </div>
    </div>
);

const CheckItem = ({ text }: { text: string }) => (
    <label className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-0.5 rounded">
        <input type="checkbox" className="mt-0.5 w-3 h-3 border-slate-300 rounded" />
        <span className="text-[10px] text-slate-600 leading-tight">{text}</span>
    </label>
);

const SignLine = ({ label }: { label: string }) => (
    <div>
        <div className="border-b border-slate-400 h-8"></div>
        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{label}</p>
    </div>
);
