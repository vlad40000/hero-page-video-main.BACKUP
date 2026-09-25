/* eslint-disable @next/next/no-img-element */

import React, { useRef } from 'react';
import { ImageIcon, ScanLine, CheckCircle, AlertTriangle } from 'lucide-react';
import { LoadingLogo } from '@/components/LoadingLogo';
import { cn, getDisplayUrl } from '@/lib/utils';

interface ImageUploadSectionProps {
    productImage: string | null;
    nameplateImage: string | null;
    washerNameplateImage: string | null;
    dryerNameplateImage: string | null;
    isMatchedSet: boolean;
    isAnalyzingProduct: boolean;
    isAnalyzingNameplate: boolean;
    isAnalyzingWasherNameplate: boolean;
    isAnalyzingDryerNameplate: boolean;
    photoAnalysisResult: { isMatch: boolean; reasoning: string; conditionReasoning: string } | null;
    onProductImageUpload: (e: React.ChangeEvent<HTMLInputElement>, overwriteCurrent?: boolean) => void;
    onNameplateImageUpload: (e: React.ChangeEvent<HTMLInputElement>, overwriteCurrent?: boolean) => void;
    onWasherNameplateUpload: (e: React.ChangeEvent<HTMLInputElement>, overwriteCurrent?: boolean) => void;
    onDryerNameplateUpload: (e: React.ChangeEvent<HTMLInputElement>, overwriteCurrent?: boolean) => void;
}

function NameplateUploadCard({
    label,
    image,
    isAnalyzing,
    onChange,
}: {
    label: string;
    image: string | null;
    isAnalyzing: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>, overwriteCurrent?: boolean) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const overwriteRef = useRef(false);

    const chooseFile = (overwriteCurrent: boolean) => {
        if (isAnalyzing) return;
        overwriteRef.current = overwriteCurrent;
        inputRef.current?.click();
    };

    return (
        <div
            onClick={() => !image && chooseFile(false)}
            className={cn(
                'relative aspect-square border-2 border-dashed rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden active:scale-95',
                image ? 'border-indigo-400' : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30',
                isAnalyzing && 'cursor-not-allowed opacity-80'
            )}
        >
            {image ? (
                <>
                    <img src={getDisplayUrl(image)} alt={`${label} nameplate`} className="w-full h-full object-contain opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm">
                                <LoadingLogo size={28} label="Reading nameplate" className="mb-1" />
                                <span className="text-[10px] font-bold text-indigo-800">Reading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={(event) => { event.stopPropagation(); chooseFile(true); }}
                                    className="rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-bold text-white shadow-lg hover:bg-indigo-700"
                                >
                                    Replace current
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => { event.stopPropagation(); chooseFile(false); }}
                                    className="rounded-lg bg-white/95 px-3 py-2 text-[10px] font-bold text-indigo-700 shadow hover:bg-white"
                                >
                                    Upload as new
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-indigo-100 p-3 rounded-full shadow-sm mb-2"><ScanLine className="text-indigo-600" size={20} /></div>
                    <span className="text-xs font-bold text-indigo-900 text-center px-2">{label}</span>
                    <span className="text-[10px] text-indigo-600/70 text-center">Scan nameplate</span>
                </>
            )}
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={(event) => onChange(event, overwriteRef.current)}
            />
        </div>
    );
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
    productImage,
    nameplateImage,
    washerNameplateImage,
    dryerNameplateImage,
    isMatchedSet,
    isAnalyzingProduct,
    isAnalyzingNameplate,
    isAnalyzingWasherNameplate,
    isAnalyzingDryerNameplate,
    photoAnalysisResult,
    onProductImageUpload,
    onNameplateImageUpload,
    onWasherNameplateUpload,
    onDryerNameplateUpload,
}) => {
    const productInputRef = useRef<HTMLInputElement>(null);
    const productOverwriteRef = useRef(false);

    const chooseProductFile = (overwriteCurrent: boolean) => {
        if (isAnalyzingProduct) return;
        productOverwriteRef.current = overwriteCurrent;
        productInputRef.current?.click();
    };

    const productCard = (
        <div
            onClick={() => !productImage && chooseProductFile(false)}
            className={cn(
                'relative aspect-square border-2 border-dashed rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden active:scale-95',
                productImage ? 'border-blue-400' : 'border-slate-200 hover:border-blue-300 bg-slate-50',
                isAnalyzingProduct && 'cursor-not-allowed'
            )}
        >
            {productImage ? (
                <>
                    <img src={getDisplayUrl(productImage)} alt="Listing appliance" className={cn('w-full h-full object-contain', isAnalyzingProduct && 'opacity-50')} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isAnalyzingProduct ? (
                            <div className="flex flex-col items-center bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm">
                                <LoadingLogo size={28} label="Assessing listing photo" className="mb-1" />
                                <span className="text-[10px] font-bold text-blue-800">Assessing...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={(event) => { event.stopPropagation(); chooseProductFile(true); }}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white shadow-lg hover:bg-blue-700"
                                >
                                    Replace current
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => { event.stopPropagation(); chooseProductFile(false); }}
                                    className="rounded-lg bg-white/95 px-3 py-2 text-[10px] font-bold text-blue-700 shadow hover:bg-white"
                                >
                                    Upload as new
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2"><ImageIcon className="text-slate-400" size={20} /></div>
                    <span className="text-xs font-bold text-slate-600 text-center px-2">{isMatchedSet ? 'Set Listing Photo' : 'Listing Photo'}</span>
                    <span className="text-[10px] text-slate-400 text-center">Main website image</span>
                </>
            )}
            <input
                type="file"
                ref={productInputRef}
                className="hidden"
                accept="image/*"
                onChange={(event) => onProductImageUpload(event, productOverwriteRef.current)}
            />
        </div>
    );

    return (
        <div className="space-y-6">
            {isMatchedSet ? (
                <div className="space-y-3">
                    <div className="mx-auto max-w-[240px]">{productCard}</div>
                    <div className="grid grid-cols-2 gap-3">
                        <NameplateUploadCard label="Washer" image={washerNameplateImage} isAnalyzing={isAnalyzingWasherNameplate} onChange={onWasherNameplateUpload} />
                        <NameplateUploadCard label="Dryer" image={dryerNameplateImage} isAnalyzing={isAnalyzingDryerNameplate} onChange={onDryerNameplateUpload} />
                    </div>
                    <p className="text-center text-[10px] font-medium text-slate-400">Scan both nameplates. They will save as one Washer & Dryer Set listing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {productCard}
                    <NameplateUploadCard label="Appliance" image={nameplateImage} isAnalyzing={isAnalyzingNameplate} onChange={onNameplateImageUpload} />
                </div>
            )}

            {photoAnalysisResult && (
                <div className={cn('p-4 rounded-xl border flex gap-3', photoAnalysisResult.isMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100')}>
                    <div className="shrink-0">
                        {photoAnalysisResult.isMatch ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertTriangle className="text-amber-500" size={20} />}
                    </div>
                    <div className="space-y-1">
                        <p className={cn('text-xs font-bold uppercase tracking-wide', photoAnalysisResult.isMatch ? 'text-emerald-700' : 'text-amber-700')}>
                            {photoAnalysisResult.isMatch ? 'Verified Match' : 'Potential Mismatch'}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">{photoAnalysisResult.reasoning} <span className="font-semibold">{photoAnalysisResult.conditionReasoning}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};
