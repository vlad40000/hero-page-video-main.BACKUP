
/* eslint-disable @next/next/no-img-element */

import React, { useRef } from 'react';
import { Camera, ImageIcon, Loader2, ScanLine, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn, getDisplayUrl } from '@/lib/utils';
import { ItemCondition } from '@/lib/inventory-types';

interface ImageUploadSectionProps {
    productImage: string | null;
    nameplateImage: string | null;
    isAnalyzingProduct: boolean;
    isAnalyzingNameplate: boolean;
    photoAnalysisResult: { isMatch: boolean; reasoning: string; conditionReasoning: string } | null;
    onProductImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNameplateImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
    productImage,
    nameplateImage,
    isAnalyzingProduct,
    isAnalyzingNameplate,
    photoAnalysisResult,
    onProductImageUpload,
    onNameplateImageUpload,
}) => {
    const productInputRef = useRef<HTMLInputElement>(null);
    const nameplateInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {/* Product Image */}
                <div
                    onClick={() => !isAnalyzingProduct && productInputRef.current?.click()}
                    className={cn(
                        "relative aspect-square border-2 border-dashed rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden active:scale-95",
                        productImage ? 'border-blue-400' : 'border-slate-200 hover:border-blue-300 bg-slate-50',
                        isAnalyzingProduct && 'cursor-not-allowed'
                    )}
                >
                    {productImage ? (
                        <>
                            <img
                                src={getDisplayUrl(productImage)}
                                alt="Listing appliance"
                                className={cn("w-full h-full object-contain", isAnalyzingProduct && "opacity-50")}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                {isAnalyzingProduct ? (
                                    <div className="flex flex-col items-center bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm">
                                        <Loader2 className="animate-spin text-blue-600 mb-1" size={20} />
                                        <span className="text-[10px] font-bold text-blue-800">Assessing...</span>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                                        <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                                <ImageIcon className="text-slate-400" size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 text-center px-2">Listing Photo</span>
                            <span className="text-[10px] text-slate-400 text-center">Main image</span>
                        </>
                    )}
                    <input
                        type="file"
                        ref={productInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={onProductImageUpload}
                    />
                </div>

                {/* Nameplate Image */}
                <div
                    onClick={() => !isAnalyzingNameplate && nameplateInputRef.current?.click()}
                    className={cn(
                        "relative aspect-square border-2 border-dashed rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden active:scale-95",
                        nameplateImage ? 'border-indigo-400' : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30',
                        isAnalyzingNameplate && 'cursor-not-allowed opacity-80'
                    )}
                >
                    {nameplateImage ? (
                        <>
                            <img
                                src={getDisplayUrl(nameplateImage)}
                                alt="Appliance nameplate"
                                className="w-full h-full object-contain opacity-60"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                {isAnalyzingNameplate ? (
                                    <div className="flex flex-col items-center bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm">
                                        <Loader2 className="animate-spin text-indigo-600 mb-1" size={20} />
                                        <span className="text-[10px] font-bold text-indigo-800">Reading...</span>
                                    </div>
                                ) : (
                                    <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg">
                                        <ScanLine size={16} />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-indigo-100 p-3 rounded-full shadow-sm mb-2">
                                <ScanLine className="text-indigo-600" size={20} />
                            </div>
                            <span className="text-xs font-bold text-indigo-900 text-center px-2">Scan Nameplate</span>
                            <span className="text-[10px] text-indigo-600/70 text-center">Auto-fill</span>
                        </>
                    )}
                    <input
                        type="file"
                        ref={nameplateInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={onNameplateImageUpload}
                    />
                </div>
            </div>

            {/* Analysis Result */}
            {photoAnalysisResult && (
                <div className={cn(
                    "p-4 rounded-xl border flex gap-3",
                    photoAnalysisResult.isMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                )}>
                    <div className="shrink-0">
                        {photoAnalysisResult.isMatch ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertTriangle className="text-amber-500" size={20} />}
                    </div>
                    <div className="space-y-1">
                        <p className={cn(
                            "text-xs font-bold uppercase tracking-wide",
                            photoAnalysisResult.isMatch ? 'text-emerald-700' : 'text-amber-700'
                        )}>
                            {photoAnalysisResult.isMatch ? 'Verified Match' : 'Potential Mismatch'}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {photoAnalysisResult.reasoning} <span className="font-semibold">{photoAnalysisResult.conditionReasoning}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
