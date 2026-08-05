'use client';

import React, { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { LoadingLogo } from '@/components/LoadingLogo';
import { ValuationCalculator } from './ValuationCalculator';
import { DiagnosisResult } from './DiagnosisResult';
import { ApplianceData, AppStatus, DiagnosticResult } from '../types';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Camera,
    CheckCircle2,
    ClipboardCheck,
    Flame,
    Phone,
    Refrigerator,
    Search,
    Stethoscope,
    Upload,
    WashingMachine,
    Wind,
} from 'lucide-react';

const SHOP_PHONE = '843-536-6005';
const SHOP_PHONE_HREF = `tel:${SHOP_PHONE}`;

const APPLIANCE_TYPES = [
    { value: 'Washer', label: 'Washer', icon: WashingMachine },
    { value: 'Dryer', label: 'Dryer', icon: Wind },
    { value: 'Washer/Dryer Combo', label: 'Combo', icon: WashingMachine },
    { value: 'Refrigerator', label: 'Refrigerator', icon: Refrigerator },
    { value: 'Stove', label: 'Stove / Range', icon: Flame },
] as const;

const COMMON_PROBLEMS: Record<string, string[]> = {
    Washer: ["Won't drain", 'Loud during spin', 'Leaking water', "Won't start", 'Excessive vibration', 'Error code displayed'],
    Dryer: ['Not heating', 'Takes too long to dry', 'Loud noise', "Won't start", 'Drum not spinning', 'Burning smell'],
    'Washer/Dryer Combo': ["Won't drain", 'Not drying', 'Error code', 'Leaking', "Won't start", 'Loud noise'],
    Refrigerator: ['Not cooling', 'Leaking water', 'Strange noise', 'Ice maker broken', 'Fridge warm, freezer OK', 'Runs constantly'],
    Stove: ["Burner won't ignite", 'Oven not heating', 'Uneven heat', 'Wrong temperature', 'Door stuck', 'Gas smell'],
};

const ANALYSIS_LABELS = [
    'Identifying appliance specifications',
    'Searching parts catalogs',
    'Calculating repair costs',
    'Generating recommendation',
];

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
        const img = new window.Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            } else if (height > maxWidth) {
                width *= maxWidth / height;
                height = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
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

function ProgressBar({ currentStep }: { currentStep: number }) {
    const labels = ['Appliance', 'Identify', 'Symptoms', 'Results'];
    const capped = Math.min(currentStep, labels.length - 1);

    return (
        <div className="mx-auto flex max-w-md items-center px-3">
            {labels.map((label, index) => {
                const done = capped > index;
                const current = capped === index;
                return (
                    <React.Fragment key={label}>
                        {index > 0 && (
                            <div
                                className={`h-0.5 flex-1 transition-colors ${done || current ? 'bg-blue-600' : 'bg-slate-200'}`}
                            />
                        )}
                        <div className="flex min-w-14 flex-col items-center gap-1">
                            <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all ${
                                    done || current
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-200 bg-white text-slate-400'
                                }`}
                            >
                                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                            </div>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                    done || current ? 'text-blue-600' : 'text-slate-400'
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function AnalysisLoader({ applianceType }: { applianceType: string }) {
    const [completed, setCompleted] = useState(0);

    useEffect(() => {
        const timers = ANALYSIS_LABELS.map((_, index) => setTimeout(() => setCompleted(index + 1), (index + 1) * 900));
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="fix-step-enter flex min-h-[440px] flex-col items-center justify-center px-6 py-12 text-center">
            <LoadingLogo size={112} label="Analyzing appliance" className="mb-7" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Analyzing your {applianceType || 'appliance'}</h2>
            <p className="mt-2 text-sm text-slate-500">This usually takes about 15 seconds...</p>
            <div className="mx-auto mt-8 w-full max-w-sm text-left">
                {ANALYSIS_LABELS.map((label, index) => {
                    const done = completed > index;
                    const active = completed === index;
                    return (
                        <div
                            key={label}
                            className={`flex items-center gap-3 py-2.5 transition-opacity ${done || active ? 'opacity-100' : 'opacity-35'}`}
                        >
                            <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                    done ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                            >
                                {done ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                ) : active ? (
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                                ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                )}
                            </div>
                            <span className={`text-sm ${done || active ? 'font-semibold text-slate-900' : 'font-medium text-slate-400'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AuditorInterface() {
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [applianceType, setApplianceType] = useState('');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [symptom, setSymptom] = useState('');
    const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoStatus, setPhotoStatus] = useState<'idle' | 'reading' | 'success' | 'partial' | 'error'>('idle');
    const [auditData, setAuditData] = useState<ApplianceData | null>(null);
    const [diagnosisResults, setDiagnosisResults] = useState<DiagnosticResult[]>([]);
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [auditError, setAuditError] = useState<string | null>(null);
    const [selectedRepairCost, setSelectedRepairCost] = useState<number>(0);

    const cameraInputRef = useRef<HTMLInputElement>(null);
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

    const handleAuditSubmit = async (event?: React.FormEvent) => {
        if (event) event.preventDefault();
        if (!model.trim()) {
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

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setStatus(AppStatus.LOADING);
        setPhotoStatus('reading');
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const rawBase64 = reader.result as string;
                setPhotoPreview(rawBase64);

                try {
                    const resizedDataUrl = await resizeImage(rawBase64);
                    const base64 = resizedDataUrl.split(',')[1];

                    const info = await postJson<{ model: string; serial: string }>('/api/tools/fix/extract', {
                        base64Image: base64,
                        mimeType: 'image/jpeg',
                    });

                    if (!info.model) {
                        setPhotoStatus('error');
                        setError('Could not read the rating plate. Please type the model number below.');
                        setStatus(AppStatus.IDLE);
                        setStep(1);
                        return;
                    }

                    const extractedModel = info.model.trim().toUpperCase();
                    const extractedSerial = (info.serial || '').trim().toUpperCase();
                    setModel(extractedModel);
                    setSerial(extractedSerial);
                    setPhotoStatus(extractedSerial ? 'success' : 'partial');
                    setStep(2);
                    setStatus(AppStatus.IDLE);

                    void runIdentityPrewarm({
                        model: extractedModel,
                        serial: extractedSerial,
                        productType: applianceType || undefined,
                    });
                } catch (err) {
                    setPhotoStatus('error');
                    setError('Failed to process image: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    setStatus(AppStatus.IDLE);
                    setStep(1);
                }
            };
            reader.readAsDataURL(file);
        } catch {
            setPhotoStatus('error');
            setError('Error reading file');
            setStatus(AppStatus.IDLE);
        }
    };

    const handleDiagnosisSubmit = async () => {
        const combinedSymptom = [...selectedProblems, symptom.trim()].filter(Boolean).join('. ');
        if (!combinedSymptom) {
            setError('Please describe the problem.');
            return;
        }

        setSymptom(combinedSymptom);
        setStatus(AppStatus.LOADING);
        setError(null);

        try {
            const { results } = await postJson<{ results: DiagnosticResult[] }>('/api/tools/fix/diagnose', {
                model,
                serial,
                symptom: combinedSymptom,
                brand: auditData?.identification?.brand || undefined,
                productType: auditData?.identification?.category || applianceType || undefined,
            });
            setDiagnosisResults(results);
            setStatus(AppStatus.IDLE);
            setStep(3);
        } catch (err) {
            console.error(err);
            setError('Failed to generate diagnosis. Please try again.');
            setStatus(AppStatus.ERROR);
        }
    };

    const handleIssueSelect = (cost: number) => {
        if (!auditData) {
            setError('Appliance valuation is still preparing. The diagnosis estimate is ready, but the repair-vs-replace step needs the appliance audit.');
            return;
        }
        setSelectedRepairCost(cost);
        setStep(4);
    };

    const handleStartOver = () => {
        setStep(0);
        setApplianceType('');
        setModel('');
        setSerial('');
        setSymptom('');
        setSelectedProblems([]);
        setPhotoPreview(null);
        setPhotoStatus('idle');
        setAuditData(null);
        setDiagnosisResults([]);
        setStatus(AppStatus.IDLE);
        setError(null);
        setAuditStatus('idle');
        setAuditError(null);
        setSelectedRepairCost(0);
    };

    const toggleProblem = (problem: string) => {
        setSelectedProblems((current) =>
            current.includes(problem) ? current.filter((item) => item !== problem) : [...current, problem]
        );
    };

    const activeProblems = COMMON_PROBLEMS[applianceType] || [];
    const hasSymptomInput = selectedProblems.length > 0 || symptom.trim().length > 0;

    return (
        <div className="mx-auto max-w-[720px]">
            <div className="sticky top-0 z-40 -mx-4 mb-5 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-white sm:rounded-2xl sm:border">
                <Link
                    href="/"
                    aria-label="Return to Road Runner Appliance home"
                    className="flex items-center gap-2.5 rounded-lg transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    <NextImage src="/road-runner-logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
                    <span className="text-sm font-bold">Road Runner Appliance</span>
                </Link>
                <a
                    href={SHOP_PHONE_HREF}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                    <Phone className="h-3.5 w-3.5" />
                    Call Now
                </a>
            </div>

            {step < 4 && (
                <div className="mb-7 rounded-2xl border border-slate-200 bg-white px-2 py-4 shadow-sm">
                    <ProgressBar currentStep={status === AppStatus.LOADING ? 3 : step} />
                </div>
            )}

            <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                {status === AppStatus.LOADING && <AnalysisLoader applianceType={applianceType} />}

                {step === 0 && status !== AppStatus.LOADING && (
                    <div className="fix-step-enter px-5 py-8 text-center md:px-8 md:py-10">
                        <div className="mb-9">
                            <h1 className="text-4xl font-black leading-none tracking-tight text-slate-900 md:text-5xl">
                                Fix It or Ditch It?
                            </h1>
                            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 md:text-base">
                                AI-powered repair estimates. Find out if your appliance is worth fixing in under 2 minutes.
                            </p>
                        </div>

                        <h2 className="mb-5 text-lg font-bold text-slate-900">What type of appliance needs help?</h2>
                        <div className="mx-auto mb-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                            {APPLIANCE_TYPES.map((type) => {
                                const Icon = type.icon;
                                const selected = applianceType === type.value;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setApplianceType(type.value)}
                                        className={`fix-card-hover flex flex-col items-center gap-3 rounded-2xl border-2 p-5 font-semibold transition ${
                                            selected
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 bg-white text-slate-800 hover:bg-blue-50/30'
                                        }`}
                                    >
                                        <Icon className={`h-11 w-11 ${selected ? 'text-blue-600' : 'text-slate-500'}`} />
                                        <span className="text-sm">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            disabled={!applianceType}
                            className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            Continue <ArrowRight className="h-5 w-5" />
                        </button>

                        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                            {['Free to use', 'No signup', '2 min estimate'].map((item) => (
                                <span key={item} className="inline-flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-blue-600" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {step === 1 && status !== AppStatus.LOADING && (
                    <div className="fix-step-enter mx-auto max-w-xl px-5 py-7 md:px-8">
                        <button onClick={() => setStep(0)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>

                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Identify your appliance</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Snap a photo of the rating plate, upload an image, or type the model number below.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                className="fix-card-hover flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-5 text-center"
                            >
                                <Camera className="h-8 w-8 text-blue-600" />
                                <span className="text-sm font-bold text-slate-900">Take Photo</span>
                                <span className="text-xs text-slate-500">Open camera</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="fix-card-hover flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-5 text-center"
                            >
                                <Upload className="h-8 w-8 text-blue-600" />
                                <span className="text-sm font-bold text-slate-900">Upload File</span>
                                <span className="text-xs text-slate-500">Browse images</span>
                            </button>
                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>

                        {photoPreview && (
                            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3">
                                <NextImage
                                    src={photoPreview}
                                    alt="Rating plate preview"
                                    width={80}
                                    height={80}
                                    unoptimized
                                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    {photoStatus === 'reading' && (
                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                                            <LoadingLogo size={20} label="Reading rating plate" />
                                            Reading rating plate...
                                        </div>
                                    )}
                                    {photoStatus === 'success' && (
                                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Model and serial extracted
                                        </div>
                                    )}
                                    {photoStatus === 'partial' && (
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                                                <CheckCircle2 className="h-5 w-5" />
                                                Model extracted
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">Serial not found. You can add it below.</p>
                                        </div>
                                    )}
                                    {photoStatus === 'error' && (
                                        <div>
                                            <p className="text-sm font-semibold text-red-700">Could not read plate</p>
                                            <p className="mt-1 text-xs text-slate-500">Please type the model number below.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {photoPreview ? 'Confirm or edit' : 'Or enter manually'}
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <form onSubmit={handleAuditSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-800">
                                    Model Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(event) => setModel(event.target.value)}
                                    placeholder="e.g. WFW9620HW"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-800">
                                    Serial Number <span className="font-normal text-slate-400">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={serial}
                                    onChange={(event) => setSerial(event.target.value)}
                                    placeholder="Helps determine manufacture date"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!model.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                <Search className="h-5 w-5" />
                                Continue
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && status !== AppStatus.LOADING && (
                    <div className="fix-step-enter mx-auto max-w-xl px-5 py-7 md:px-8">
                        <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>

                        <h2 className="text-3xl font-black tracking-tight text-slate-900">What&apos;s going wrong?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Select common issues and/or describe the problem in your own words.</p>

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            {auditData ? (
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                    <div>
                                        <p className="font-bold text-slate-900">{auditData.identification.brand} {auditData.identification.category}</p>
                                        <p className="mt-1 font-mono text-sm text-slate-600">Model: {model}</p>
                                        <p className="mt-1 text-xs text-slate-500">Mfg Date: {auditData.identification.manufactureMonth}/{auditData.identification.manufactureYear}</p>
                                    </div>
                                </div>
                            ) : auditStatus === 'error' ? (
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                                    <div>
                                        <p className="font-bold text-slate-900">Model ready for diagnosis</p>
                                        <p className="mt-1 text-xs text-slate-500">{auditError}</p>
                                        <p className="mt-1 font-mono text-sm text-slate-600">Model: {model}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <LoadingLogo size={24} label="Verifying appliance" />
                                    <div>
                                        <p className="font-bold text-slate-900">Verifying {model || 'appliance'}...</p>
                                        <p className="mt-1 text-xs text-slate-500">Looking up appliance specs and parts.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {activeProblems.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {activeProblems.map((problem) => {
                                    const selected = selectedProblems.includes(problem);
                                    return (
                                        <button
                                            key={problem}
                                            type="button"
                                            onClick={() => toggleProblem(problem)}
                                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                                selected
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                                            }`}
                                        >
                                            {selected ? '✓ ' : ''}{problem}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6">
                            <label className="mb-1.5 block text-sm font-bold text-slate-800">Additional details</label>
                            <textarea
                                value={symptom}
                                onChange={(event) => setSymptom(event.target.value)}
                                placeholder="Describe when it happens, any noises, error codes, leaks, or smells..."
                                className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleDiagnosisSubmit}
                            disabled={!hasSymptomInput}
                            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <Stethoscope className="h-5 w-5" />
                            Analyze Issues & Costs <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {step === 3 && status !== AppStatus.LOADING && (
                    <div className="fix-step-enter px-5 py-7 md:px-8">
                        <DiagnosisResult
                            results={diagnosisResults}
                            onSelect={handleIssueSelect}
                            onBack={() => setStep(2)}
                        />
                        <div className="mt-6 rounded-2xl bg-slate-950 p-7 text-center text-white">
                            <p className="text-lg font-black">Need Service or Parts?</p>
                            <p className="mt-2 text-sm text-slate-400">Road Runner Appliance, Hemingway, SC and surrounding areas</p>
                            <a
                                href={SHOP_PHONE_HREF}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
                            >
                                <Phone className="h-4 w-4" />
                                Call {SHOP_PHONE}
                            </a>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button onClick={handleStartOver} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                                <ArrowLeft className="h-4 w-4" /> Start Over
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && auditData && (
                    <div className="fix-step-enter px-5 py-7 md:px-8">
                        <button onClick={() => setStep(3)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
                            <ArrowLeft className="h-4 w-4" /> Back to Results
                        </button>
                        <ValuationCalculator
                            data={auditData}
                            isAuditor={true}
                            overrideQuote={selectedRepairCost}
                        />
                    </div>
                )}
            </section>

            <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="mx-auto mt-5 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-600 shadow-sm ring-1 ring-slate-200 transition hover:text-blue-700"
            >
                <ClipboardCheck className="h-3.5 w-3.5" />
                How To Use
            </button>
        </div>
    );
}
