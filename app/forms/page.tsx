'use client';

import React from 'react';
import { ArrowRight, ClipboardList, Download, FileText, ListChecks, UploadCloud } from 'lucide-react';
import { LeasingSOP } from '@/components/forms/LeasingSOP';
import { FieldChecklist } from '@/components/forms/FieldChecklist';

export default function FormsHub() {
    const [activeForm, setActiveForm] = React.useState<string | null>(null);

    const categories = [
        {
            title: "New Customer & Leasing",
            items: [
                { name: "Residential Lease Application", size: "1.2 MB", type: "PDF" },
                { name: "Credit Check Authorization", size: "850 KB", type: "PDF" },
                { name: "Landlord Guarantor Form", size: "450 KB", type: "DOCX" },
            ]
        },
        {
            title: "Corporate & Wholesale",
            items: [
                { name: "Reseller Tax Exemption (ST-120)", size: "2.4 MB", type: "PDF" },
                { name: "Net-30 Credit Application", size: "1.8 MB", type: "PDF" },
                { name: "Bulk Purchase Manifest", size: "LIVE", type: "XLS" },
            ]
        },
        {
            title: "Service & Warranty",
            items: [
                { name: "Damage Claim Form", size: "900 KB", type: "PDF" },
                { name: "Extended Warranty Terms", size: "3.5 MB", type: "PDF" },
                { name: "Repair Authorization", size: "500 KB", type: "PDF" },
            ]
        }
    ];

    const operationalForms = [
        {
            name: "Leasing Implementation SOP",
            description: "Master document for Solutions Engineer and Finance teams",
            component: "leasing-sop",
            icon: ClipboardList
        },
        {
            name: "Field Activation Checklist",
            description: "One-pager for Implementation Managers at job sites",
            component: "field-checklist",
            icon: ListChecks
        }
    ];

    // If a form is active, show it
    if (activeForm === 'leasing-sop') return <LeasingSOP />;
    if (activeForm === 'field-checklist') return <FieldChecklist />;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-slate-900 text-white py-20 px-6 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm text-blue-400">
                    <FileText size={32} />
                </div>
                <h1 className="text-4xl font-black mb-4">Document Hub</h1>
                <p className="text-slate-400 max-w-lg mx-auto text-lg">
                    Central repository for leasing agreements, tax exemption certificates, and corporate credit applications.
                </p>
            </div>

            <main className="max-w-5xl mx-auto px-6 -mt-12 pb-24">

                {/* OPERATIONAL FORMS (NEW) */}
                <div className="mb-12">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Operational Forms</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {operationalForms.map((form, idx) => {
                            const FormIcon = form.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveForm(form.component)}
                                    className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-100 text-left group"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                                        <FormIcon size={32} strokeWidth={2.25} />
                                    </div>
                                    <h3 className="text-xl font-black mb-2">{form.name}</h3>
                                    <p className="text-blue-100 text-sm mb-4">{form.description}</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-blue-200 group-hover:text-white transition-colors">
                                        Open Form
                                        <ArrowRight size={16} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* DOCUMENT CATEGORIES */}
                <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Document Library</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <h3 className="text-lg font-black text-slate-900 mb-6">{cat.title}</h3>
                                <ul className="space-y-4">
                                    {cat.items.map((item, i) => (
                                        <li key={i} className="group cursor-pointer">
                                            <div className="flex items-start justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{item.type} • {item.size}</p>
                                                </div>
                                                <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                                                    <Download size={18} />
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Upload Section */}
                <div className="mt-12 bg-blue-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-600/20">
                    <div>
                        <h3 className="text-xl font-black mb-1">Need to submit a document?</h3>
                        <p className="text-blue-100 text-sm font-medium">Upload signed lease agreements or tax forms securely.</p>
                    </div>
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
                        <UploadCloud size={18} />
                        Upload Securely
                    </button>
                </div>
            </main>
        </div>
    );
}
