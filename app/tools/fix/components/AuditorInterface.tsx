'use client';

import React, { useState, useRef } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { ValuationCalculator } from './ValuationCalculator';
import { DiagnosisResult } from './DiagnosisResult';
import { ApplianceData, AppStatus, DiagnosticResult } from '../types';
import { Loader2, Camera, Search, AlertCircle, UploadCloud, ArrowLeft, ArrowRight, CheckCircle2, Stethoscope, ClipboardCheck, WashingMachine, Wind, Refrigerator, Flame } from 'lucide-react';

const APPLIANCE_TYPES = [
    { value: 'Washer', label: 'Washer', icon: WashingMachine },
    { value: 'Dryer', label: 'Dryer', icon: Wind },
    { value: 'Washer/Dryer Combo', label: 'Washer/Dryer Combo', icon: WashingMachine },
    { value: 'Refrigerator', label: 'Refrigerator', icon: Refrigerator },
    { value: 'Stove', label: 'Stove', icon: Flame },
] as const;

async function postJson<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
    return data as T;
}

async function resizeImage(base64Str: string, maxWidth = 1024): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for better compression
        };
    });
}

type IdentityPrewarmInput = {
    model: string;
    serial?: string;
    brand?: string;
    productType?: string;
};

async function prewarmPartsCatalog(input: IdentityPrewarmInput): Promise<void> {
    const modelNumber = input.model.trim();
    if (!modelNumber) return;

    const response = await fetch('/api/tools/parts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'start',
            modelNumber,
            serialNumber: input.serial?.trim() || undefined,
            brand: input.brand || undefined,
            productType: input.productType || undefined,
            exhaustiveMode: false,
        }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data && data.error) || `Parts prewarm failed (${response.status})`);
    }
}

export default function AuditorInterface() {
    // State Machine
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [applianceType, setApplianceType] = useState('');

    // Data State
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [symptom, setSymptom] = useState('');

    // API Data
    const [auditData, setAuditData] = useState<ApplianceData | null>(null);
    const [diagnosisResults, setDiagnosisResults] = useState<DiagnosticResult[]>([]);

    // UI State
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [auditError, setAuditError] = useState<string | null>(null);
    const [imageProcessing, setImageProcessing] = useState(false);
    const [selectedRepairCost, setSelectedRepairCost] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const runIdentityPrewarm = async (input: IdentityPrewarmInput) => {
        const cleanModel = input.model.trim().toUpperCase();
        const cleanSerial = input.serial?.trim().toUpperCase() || '';
        if (!cleanModel) return;

        setAuditData(null);
        setAuditStatus('loading');
        setAuditError(null);

        const [auditResult, partsResult] = await Promise.allSettled([
            postJson<ApplianceData>('/api/tools/fix/audit', {
                model: cleanModel,
                serial: cleanSerial,
            }),
            prewarmPartsCatalog({
                ...input,
                model: cleanModel,
                serial: cleanSerial,
            }),
        ]);

        if (partsResult.status === 'rejected') {
            console.warn('[Fix Tool] Parts catalog prewarm failed', partsResult.reason);
        }

        if (auditResult.status === 'fulfilled') {
            setAuditData(auditResult.value);
            setAuditStatus('ready');
            return;
        }

        console.warn('[Fix Tool] Appliance audit prewarm failed', auditResult.reason);
        setAuditStatus('error');
        setAuditError('Specs lookup is unavailable. Diagnosis can still continue from the model and serial number.');
    };

    // STEP 1: Identification
    const handleAuditSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!model) {
            setError('Model number is required');
            return;
        }

        const cleanModel = model.trim().toUpperCase();
        const cleanSerial = serial.trim().toUpperCase();
        setError(null);
        setModel(cleanModel);
        setSerial(cleanSerial);
        setStep(2);
        setStatus(AppStatus.IDLE);

        void runIdentityPrewarm({
            model: cleanModel,
            serial: cleanSerial,
            productType: applianceType || undefined,
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageProcessing(true);
        setStatus(AppStatus.LOADING); // Show full loader
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const rawBase64 = reader.result as string;

                try {
                    // Resize image client-side to prevent 413 Payload Too Large
                    const resizedDataUrl = await resizeImage(rawBase64);
                    const base64 = resizedDataUrl.split(',')[1];

                    // 1. Extract Info (Fast)
                    const info = await postJson<{ model: string; serial: string }>('/api/tools/fix/extract', {
                        base64Image: base64,
                        mimeType: 'image/jpeg',
                    });

                    if (info.model) {
                        const extractedModel = info.model.trim().toUpperCase();
                        const extractedSerial = (info.serial || '').trim().toUpperCase();
                        setModel(extractedModel);
                        setSerial(extractedSerial);

                        // Move to Step 2 IMMEDIATELY so user can start typing their symptom
                        setStep(2);
                        setStatus(AppStatus.IDLE); // Stop the first blocker

                        // Audit and catalog seeding run together after identity is known.
                        void runIdentityPrewarm({
                            model: extractedModel,
                            serial: extractedSerial,
                            productType: applianceType || undefined,
                        });
                    } else {
                        setError('Could not extract details from image. Please enter manually.');
                        setStatus(AppStatus.IDLE);
                    }
                } catch (err) {
                    setError('Failed to process image: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    setStatus(AppStatus.IDLE);
                } finally {
                    setImageProcessing(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Error reading file');
            setImageProcessing(false);
            setStatus(AppStatus.IDLE);
        }
    };

    // Custom Loader Component
    const FullPageLoader = ({ message, submessage }: { message?: string, submessage?: string }) => (
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center mb-8 h-24 w-24">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <NextImage
                    src="/road-runner-logo.png"
                    alt="Loading"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain relative z-10"
                />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{message || 'Analyzing Appliance'}</h3>
            <p className="text-slate-500 animate-pulse">{submessage || 'Decoding model specifications...'}</p>
        </div>
    );

    // STEP 2: Diagnosis
    const handleDiagnosisSubmit = async () => {
        if (!symptom.trim()) {
            setError('Please describe the problem.');
            return;
        }

        setStatus(AppStatus.LOADING);
        setError(null);

        try {
            const { results } = await postJson<{ results: DiagnosticResult[] }>('/api/tools/fix/diagnose', {
                model,
                serial,
                symptom,
                brand: auditData?.identification?.brand || undefined,
                productType: auditData?.identification?.category || applianceType || undefined,
            });
            setDiagnosisResults(results);
            setStatus(AppStatus.IDLE);
            setStep(3); // Move to Step 3
        } catch (err) {
            console.error(err);
            setError('Failed to generate diagnosis. Please try again.');
            setStatus(AppStatus.ERROR);
        }
    };

    // STEP 3: Selection
    const handleIssueSelect = (cost: number) => {
        if (!auditData) {
            setError('Appliance valuation is still preparing. The diagnosis estimate is ready, but the repair-vs-replace step needs the appliance audit.');
            return;
        }
        setSelectedRepairCost(cost);
        setStep(4); // Move to Step 4
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header / Title */}
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                    Fix It or Ditch It?
                </h1>
                <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-4">
                    Appliance Repair Cost Estimator
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                    Gain professional-grade insights into your appliance issues. Our AI analyzes symptoms to provide parts and labor estimates, helping you make a data-driven repair vs. replace decision.
                </p>
            </div>

            {/* Wizard Progress & Quick Link */}
            <div className="flex items-center justify-between mb-8 max-w-sm mx-auto">
                <button
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
                >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    How To Use
                </button>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s <= step + 1 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                {status === AppStatus.LOADING && (
                    <FullPageLoader
                        message={step === 2 ? "Running Deep Diagnosis" : "Identifying Appliance"}
                        submessage={step === 2 ? "Searching retail part catalogs and labor rates..." : "Scanning rating plate and decoding model specs..."}
                    />
                )}

                {/* STEP 0: APPLIANCE TYPE + SYMPTOM INTAKE */}
                {step === 0 && status !== AppStatus.LOADING && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">What type of appliance?</h2>
                            <p className="text-slate-500 text-sm">
                                This lets us target the right parts catalog and diagnosis knowledge from the start.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
                            {APPLIANCE_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setApplianceType(type.value)}
                                        className={`group flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${
                                            applianceType === type.value
                                                ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                                        }`}
                                    >
                                        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                                            applianceType === type.value
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                                        }`}>
                                            {Icon && <Icon className="h-6 w-6" />}
                                        </div>
                                        <span className="text-sm font-semibold">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="max-w-lg mx-auto space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    What is the problem?{' '}
                                    <span className="text-slate-400 font-normal">(optional — you can add more detail in the next step)</span>
                                </label>
                                <textarea
                                    value={symptom}
                                    onChange={(e) => setSymptom(e.target.value)}
                                    placeholder="E.g., not draining, making a loud noise during spin cycle, not cooling, clicking but won&apos;t start..."
                                    className="w-full p-4 rounded-xl border border-slate-200 min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 transition-all placeholder:text-slate-300"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => { setError(null); setStep(1); }}
                                disabled={!applianceType}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="h-5 w-5" />
                                Continue: Identify Your Appliance
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 1: IDENTIFY */}
                {step === 1 && status !== AppStatus.LOADING && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6 pb-6 border-b border-slate-100 flex items-center gap-4">
                            <button onClick={() => setStep(0)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </button>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl font-bold text-slate-900">Step 2: Identify Your Appliance</h2>
                                    {applianceType && (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{applianceType}</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">Enter the model/serial or upload a photo of the rating plate.</p>
                            </div>
                        </div>

                        {/* Image Upload Quick Action */}
                        <div className="mb-8 flex justify-center">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    cursor-pointer group flex flex-col items-center justify-center w-full max-w-md p-6 
                                    border-2 border-dashed rounded-xl transition-all
                                    border-slate-300 hover:border-primary hover:bg-slate-50
                                `}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />

                                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Camera className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">Upload Rating Plate Photo</span>
                                <span className="text-xs text-slate-400 mt-1">AI instant detection</span>
                            </button>
                        </div>

                        <div className="relative flex items-center gap-4 mb-8">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Or Enter Manually</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <form onSubmit={handleAuditSubmit} className="space-y-4 max-w-lg mx-auto">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Model Number <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="e.g. WFW9620HW"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                                <input
                                    type="text"
                                    value={serial}
                                    onChange={(e) => setSerial(e.target.value)}
                                    placeholder="Optional, needed for exact date"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono text-sm"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!model}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                            >
                                <Search className="h-5 w-5" />
                                Next: Identify Issue
                            </button>
                        </form>
                    </div>
                )}

                {/* STEP 2: VERIFY & SYMPTOM */}
                {step === 2 && status !== AppStatus.LOADING && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6 pb-6 border-b border-slate-100 flex items-center gap-4">
                            <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Step 2: Describe the Problem</h2>
                                <p className="text-sm text-slate-500">We identified your appliance. Now, what&apos;s wrong with it?</p>
                            </div>
                        </div>

                        {/* Appliance Info Card */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-8 flex items-start gap-4">
                            {auditData ? (
                                <>
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{auditData.identification.brand} {auditData.identification.category}</h3>
                                        <div className="text-sm text-slate-600 font-mono mt-1">Model: {model}</div>
                                        <div className="text-sm text-slate-500 mt-1">Mfg Date: {auditData.identification.manufactureMonth}/{auditData.identification.manufactureYear}</div>
                                    </div>
                                </>
                            ) : auditStatus === 'error' ? (
                                <div className="flex items-center gap-3 w-full">
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800">Model ready for diagnosis</h3>
                                        <p className="text-xs text-slate-500">{auditError}</p>
                                        <div className="text-sm text-slate-600 font-mono mt-1">Model: {model}</div>
                                        {serial ? <div className="text-sm text-slate-500 font-mono mt-1">Serial: {serial}</div> : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 w-full">
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800">Verifying {model || 'Appliance'}...</h3>
                                        <p className="text-xs text-slate-500">Searching specs and preloading the model-specific parts catalog.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="max-w-xl mx-auto space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    What is the appliance doing?
                                </label>
                                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                    Describe noises (clicking, grinding), leaks, error codes, and exactly when the problem happens (e.g., &quot;during spin cycle&quot;).
                                </p>
                                <textarea
                                    value={symptom}
                                    onChange={(e) => setSymptom(e.target.value)}
                                    placeholder="E.g., Refrigerator is making a clicking sound and not cooling. I noticed a small leak underneath this morning."
                                    className="w-full p-4 rounded-xl border border-slate-200 min-h-[140px] focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 transition-all placeholder:text-slate-300"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleDiagnosisSubmit}
                                disabled={!symptom.trim()}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                            >
                                <>
                                    <Stethoscope className="h-5 w-5" />
                                    Analyze Issues & Costs
                                </>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: DIAGNOSIS RESULTS */}
                {step === 3 && status !== AppStatus.LOADING && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6 pb-6 border-b border-slate-100 flex items-center gap-4">
                            <button onClick={() => setStep(2)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Step 3: Diagnosis Results</h2>
                                <p className="text-sm text-slate-500">Select the issue that best matches your situation.</p>
                            </div>
                        </div>

                        <DiagnosisResult
                            results={diagnosisResults}
                            onSelect={handleIssueSelect}
                            onBack={() => setStep(2)}
                        />
                    </div>
                )}

                {/* STEP 4: ASSESSMENT */}
                {step === 4 && auditData && (
                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6 pb-6 border-b border-slate-100 flex items-center gap-4">
                            <button onClick={() => setStep(3)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Step 4: Decision Assessment</h2>
                                <p className="text-sm text-slate-500">Comparing repair cost against typical replacement pricing.</p>
                            </div>
                        </div>

                        <ValuationCalculator
                            data={auditData}
                            isAuditor={true}
                            overrideQuote={selectedRepairCost}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
