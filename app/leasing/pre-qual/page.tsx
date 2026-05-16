"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, X, Search, Info, Loader2 } from "lucide-react";
import { submitPreQual } from "@/actions/leasing";

const REGION_MAP: Record<string, string[]> = {
    "Grand Strand Coastal Core": [
        "Myrtle Beach", "North Myrtle Beach", "Surfside Beach", "Garden City",
        "Murrells Inlet", "Carolina Forest", "Red Hill", "Lakewood"
    ],
    "Inland Horry": [
        "Conway", "Bucksport", "Aynor", "Loris", "Green Sea", "Gallivants Ferry"
    ],
    "Georgetown Corridor": ["Georgetown", "Andrews"],
    "Central Pee Dee East": [
        "Hemingway", "Johnsonville", "Nesmith", "Gresham", "Centenary", "Brittons Neck", "Kingstree"
    ],
    "Florence County South/West": ["Lake City", "Coward", "Scranton", "Olanta", "Pamplico"],
    "Marion Area": ["Marion"]
};

export default function PreQualPage() {
    const [formData, setFormData] = useState({
        company: "",
        contact: "",
        email: "",
        phone: "",
        units: "",
        appliances: "",
        years: "",
        start: "",
        locationNotes: "",
        consent: false
    });

    const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
    const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
    const [citySearch, setCitySearch] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const visibleCities = useMemo(() => {
        const cities = Array.from(selectedRegions).flatMap(r => REGION_MAP[r] || []);
        return Array.from(new Set(cities)).sort();
    }, [selectedRegions]);

    const filteredCities = useMemo(() => {
        if (!citySearch) return visibleCities;
        return visibleCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
    }, [visibleCities, citySearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const toggleRegion = (region: string) => {
        const newRegions = new Set(selectedRegions);
        if (newRegions.has(region)) {
            newRegions.delete(region);
            // Also remove cities from this region if they weren't in other selected regions
            const citiesInRegion = REGION_MAP[region] || [];
            const remainingRegions = Array.from(newRegions);
            const otherCities = new Set(remainingRegions.flatMap(r => REGION_MAP[r] || []));

            const newCities = new Set(selectedCities);
            citiesInRegion.forEach(c => {
                if (!otherCities.has(c)) {
                    newCities.delete(c);
                }
            });
            setSelectedCities(newCities);
        } else {
            newRegions.add(region);
        }
        setSelectedRegions(newRegions);
        setError("");
    };

    const toggleCity = (city: string) => {
        const newCities = new Set(selectedCities);
        if (newCities.has(city)) newCities.delete(city);
        else newCities.add(city);
        setSelectedCities(newCities);
    };

    const handleSelectAllRegions = () => {
        setSelectedRegions(new Set(Object.keys(REGION_MAP)));
    };

    const handleClearRegions = () => {
        setSelectedRegions(new Set());
        setSelectedCities(new Set());
    };

    const handleSelectAllCities = () => {
        setSelectedCities(new Set(visibleCities));
    };

    const handleClearCities = () => {
        setSelectedCities(new Set());
    };

    const validate = () => {
        if (!formData.company || !formData.contact || !formData.email || !formData.phone ||
            !formData.units || !formData.appliances || !formData.years ||
            selectedRegions.size === 0 || selectedCities.size === 0 || !formData.consent) {
            return "Please complete all required fields and accept the acknowledgment.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            return "Please enter a valid email address.";
        }
        return "";
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const result = await submitPreQual({
                formData,
                selectedRegions: Array.from(selectedRegions),
                selectedCities: Array.from(selectedCities)
            });

            if (result.success) {
                setIsSubmitted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setError(result.error || "Something went wrong. Please try again.");
            }
        } catch (err) {
            setError("Failed to connect to the server. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-xl border-slate-200">
                    <CardHeader className="bg-white border-b border-slate-100 rounded-t-xl px-8 pt-8 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
                                    Road Runner Appliance — Quick Pre-Qualification
                                </CardTitle>
                                <CardDescription className="text-lg text-slate-500">
                                    60-second non-binding intake for property managers and landlords.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 py-8 space-y-8">
                        {isSubmitted ? (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <Check className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-green-900">Pre-qualification Captured Successfully</h3>
                                        <p className="text-green-700">Underwriting review pending. We will contact you shortly.</p>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Submission Summary</h4>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Underwriting Review Pending
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                        <div>
                                            <Label className="text-slate-500">Company</Label>
                                            <div className="font-semibold text-slate-900">{formData.company}</div>
                                        </div>
                                        <div>
                                            <Label className="text-slate-500">Contact</Label>
                                            <div className="font-semibold text-slate-900">{formData.contact}</div>
                                        </div>
                                        <div>
                                            <Label className="text-slate-500">Email</Label>
                                            <div className="font-semibold text-slate-900">{formData.email}</div>
                                        </div>
                                        <div>
                                            <Label className="text-slate-500">Phone</Label>
                                            <div className="font-semibold text-slate-900">{formData.phone}</div>
                                        </div>
                                        <div>
                                            <Label className="text-slate-500">Units Managed</Label>
                                            <div className="font-semibold text-slate-900">{formData.units}</div>
                                        </div>
                                        <div>
                                            <Label className="text-slate-500">Appliances Needed</Label>
                                            <div className="font-semibold text-slate-900">{formData.appliances}</div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-slate-500">Service Coverage</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(selectedCities).map(city => (
                                                <Badge key={city} variant="secondary" className="bg-slate-100 text-slate-700">
                                                    {city}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => window.location.href = "/"}
                                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                                >
                                    Return to Homepage
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company Name *</Label>
                                        <Input id="company" value={formData.company} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact">Contact Name *</Label>
                                        <Input id="contact" value={formData.contact} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone *</Label>
                                        <Input id="phone" value={formData.phone} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="units">Total Units Managed *</Label>
                                        <Input id="units" type="number" min="0" value={formData.units} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="appliances">Appliances Needed *</Label>
                                        <Input id="appliances" type="number" min="1" value={formData.appliances} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="years">Years in Business *</Label>
                                        <Input id="years" type="number" min="0" value={formData.years} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="start">Preferred Start</Label>
                                        <Input id="start" type="date" value={formData.start} onChange={handleInputChange} />
                                    </div>
                                </div>

                                <Separator />

                                {/* Service Area */}
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <Label className="text-xl font-bold text-slate-900">Service Area Selection *</Label>
                                            <p className="text-sm text-slate-500">Select regions and specific towns/cities.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" onClick={handleSelectAllRegions}>All Regions</Button>
                                            <Button variant="outline" size="sm" onClick={handleClearRegions}>Clear All</Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Regions Column */}
                                        <div className="space-y-4">
                                            <Label className="text-slate-600 font-bold uppercase text-xs tracking-wider">Regions</Label>
                                            <div className="border rounded-xl bg-slate-50/50 p-4 h-64 overflow-y-auto space-y-2">
                                                {Object.keys(REGION_MAP).sort().map(region => (
                                                    <div key={region} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                                                        <Checkbox
                                                            id={`region-${region}`}
                                                            checked={selectedRegions.has(region)}
                                                            onCheckedChange={() => toggleRegion(region)}
                                                        />
                                                        <Label
                                                            htmlFor={`region-${region}`}
                                                            className="cursor-pointer font-medium text-slate-700 flex-1"
                                                        >
                                                            {region}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-white border rounded-lg shadow-sm">
                                                <Label className="text-[10px] text-slate-400 uppercase mb-2 block">Active Selection</Label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedRegions.size === 0 ? (
                                                        <span className="text-xs text-slate-400 italic">No regions selected</span>
                                                    ) : (
                                                        Array.from(selectedRegions).map(r => (
                                                            <Badge key={r} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                                                {r}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cities Column */}
                                        <div className="space-y-4">
                                            <Label className="text-slate-600 font-bold uppercase text-xs tracking-wider">Towns & Cities</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Search towns..."
                                                    className="pl-9"
                                                    value={citySearch}
                                                    onChange={(e) => setCitySearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="border rounded-xl bg-slate-50/50 p-4 h-48 overflow-y-auto space-y-2">
                                                {selectedRegions.size === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                                                        <Info className="h-4 w-4 mb-2 opacity-50" />
                                                        <p className="text-xs italic">Select at least one region to view towns</p>
                                                    </div>
                                                ) : filteredCities.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                                        No cities match your search
                                                    </div>
                                                ) : (
                                                    filteredCities.map(city => (
                                                        <div key={city} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                                                            <Checkbox
                                                                id={`city-${city}`}
                                                                checked={selectedCities.has(city)}
                                                                onCheckedChange={() => toggleCity(city)}
                                                            />
                                                            <Label
                                                                htmlFor={`city-${city}`}
                                                                className="cursor-pointer font-medium text-slate-700 flex-1"
                                                            >
                                                                {city}
                                                            </Label>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                <Button variant="ghost" size="sm" className="h-8 text-sm text-slate-500 hover:text-slate-900" onClick={handleSelectAllCities}>
                                                    All Visible
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 text-sm text-slate-500 hover:text-slate-900" onClick={handleClearCities}>
                                                    Clear Towns
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="locationNotes">Additional Location Notes (optional)</Label>
                                        <Textarea
                                            id="locationNotes"
                                            placeholder="Optional unit counts per town, community names, etc."
                                            value={formData.locationNotes}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="flex items-start space-x-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <Checkbox
                                            id="consent"
                                            checked={formData.consent}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consent: !!checked }))}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="consent" className="text-sm font-bold text-slate-900 cursor-pointer">
                                                I agree this is pre-qualification only (non-binding).
                                            </Label>
                                            <p className="text-xs text-slate-500">
                                                Final terms are only established in executed lease documents.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <X className="h-5 w-5 shrink-0" />
                                        <span className="text-sm font-medium">{error}</span>
                                    </div>
                                ) || (
                                        <div className="bg-slate-50 border border-slate-200 text-slate-500 px-4 py-3 rounded-xl flex items-center gap-3 italic">
                                            <Info className="h-4 w-4 shrink-0" />
                                            <span className="text-xs">Select one or more regions, then choose towns/cities. Selections persist until cleared.</span>
                                        </div>
                                    )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 h-14 text-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : "Submit"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                        className="flex-1 h-14 text-lg text-slate-500 border-slate-200"
                                    >
                                        Clear Form
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-slate-400">
                    Road Runner Appliance pre-qualification screen only. Not a credit approval, commitment, or lease contract.
                </div>
            </div>
        </div>
    );
}
