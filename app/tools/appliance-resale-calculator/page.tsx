"use client";

import { useMemo, useState } from "react";
import { Calculator, Plus, Trash2, Info, Activity, Table, Database, FileDigit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    calculateValuation,
    BRANDS,
    CONDITIONS,
    type PartInput,
} from "./valuation";

const BRAND_KEYS = Object.keys(BRANDS);
const CONDITION_KEYS = Object.keys(CONDITIONS);

export default function ApplianceResaleCalculatorPage() {
    // --- State ---
    const [p0, setP0] = useState<number>(800);
    const [brand, setBrand] = useState<string>("Whirlpool");
    const [condition, setCondition] = useState<string>("Good");
    const [ageMonths, setAgeMonths] = useState<number>(60); // 5 years
    const [parts, setParts] = useState<PartInput[]>([
        { id: "1", name: "Pump", cost: 100, recovery: 0.4 }
    ]);
    const result = useMemo(
        () => calculateValuation(p0, brand, condition, ageMonths, parts),
        [p0, brand, condition, ageMonths, parts]
    );

    // --- Inputs Handling ---
    const addPart = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setParts([...parts, { id: newId, name: "New Part", cost: 0, recovery: 0.4 }]);
    };

    const removePart = (id: string) => {
        setParts(parts.filter(p => p.id !== id));
    };

    const updatePart = (id: string, field: keyof PartInput, value: any) => {
        setParts(parts.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // --- Formatting ---
    const formatCurrency = (cents: number) => {
        return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
    };

    const formatBps = (bps: number) => {
        return (bps / 100).toFixed(2) + "%";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Header */}
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-3">
                            <Calculator className="size-8 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Appliance Resale Calculator</h1>
                    </div>
                    <p className="text-slate-600">Deterministic valuation engine with &quot;Glass Box&quot; transparency</p>
                    <Badge variant="outline" className="mt-2 bg-slate-50 font-mono text-xs text-slate-500">
                        v1.0.1 Deterministic Engine
                    </Badge>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">

                    {/* LEFT COLUMN: Input & Result */}
                    <div className="space-y-6 lg:col-span-5">
                        <Card className="border-t-4 border-blue-600 shadow-md">
                            <CardHeader>
                                <CardTitle>Calculator Inputs</CardTitle>
                                <CardDescription>Enter appliance details below</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                {/* Core Params */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Brand</Label>
                                        <Select value={brand} onValueChange={setBrand}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BRAND_KEYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="condition">Condition</Label>
                                        <Select value={condition} onValueChange={setCondition}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CONDITION_KEYS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="p0">Original MSRP ($)</Label>
                                    <Input
                                        id="p0"
                                        type="number"
                                        value={p0}
                                        onChange={(e) => setP0(Number(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="age">Age (Months)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="age"
                                            type="number"
                                            value={ageMonths}
                                            onChange={(e) => setAgeMonths(Number(e.target.value))}
                                        />
                                        <span className="text-sm text-slate-500 font-mono whitespace-nowrap">
                                            {(ageMonths / 12).toFixed(1)} Years
                                        </span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Parts Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Major Replacements</Label>
                                        <Button size="sm" variant="ghost" onClick={addPart} className="h-8 gap-1 text-blue-600">
                                            <Plus className="size-3" /> Add Part
                                        </Button>
                                    </div>

                                    {parts.map((part, idx) => (
                                        <div key={part.id} className="flex items-end gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">Part Name</Label>
                                                <Input
                                                    value={part.name}
                                                    onChange={e => updatePart(part.id, 'name', e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="w-20 space-y-1">
                                                <Label className="text-xs">Cost ($)</Label>
                                                <Input
                                                    type="number"
                                                    value={part.cost}
                                                    onChange={e => updatePart(part.id, 'cost', Number(e.target.value))}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="w-24 space-y-1">
                                                <Label className="text-xs">Recov. %</Label>
                                                <Select
                                                    value={String(part.recovery)}
                                                    onValueChange={v => updatePart(part.id, 'recovery', Number(v))}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0.1">10%</SelectItem>
                                                        <SelectItem value="0.2">20%</SelectItem>
                                                        <SelectItem value="0.3">30%</SelectItem>
                                                        <SelectItem value="0.4">40%</SelectItem>
                                                        <SelectItem value="0.5">50%</SelectItem>
                                                        <SelectItem value="0.6">60%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="size-8 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => removePart(part.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                            </CardContent>
                        </Card>

                        {/* Result Card Big */}
                        {result && (
                            <Card className="overflow-hidden border-2 border-emerald-500 bg-emerald-50/50 shadow-lg">
                                <CardContent className="p-6 text-center">
                                    <div className="text-sm font-medium uppercase tracking-widest text-emerald-600 mb-1">
                                        Estimated Resale Value
                                    </div>
                                    <div className="text-5xl font-black text-emerald-700 tracking-tight">
                                        {formatCurrency(result.finalValue)}
                                    </div>
                                    <div className="mt-4 flex justify-center gap-6 text-sm text-emerald-800/80">
                                        <div>
                                            <span className="block font-bold">{formatBps(result.dEffBps)}</span>
                                            <span className="text-xs text-emerald-600">Depreciation/Yr</span>
                                        </div>
                                        <div>
                                            <span className="block font-bold">{formatCurrency(result.salvageValue)}</span>
                                            <span className="text-xs text-emerald-600">Salvage Floor</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Glass Box Visualization */}
                    <div className="space-y-6 lg:col-span-7">
                        <Tabs defaultValue="audit" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="audit" className="gap-2"><Activity className="size-4" /> Audit</TabsTrigger>
                                <TabsTrigger value="algorithm" className="gap-2"><FileDigit className="size-4" /> Algo</TabsTrigger>
                                <TabsTrigger value="tables" className="gap-2"><Table className="size-4" /> Data</TabsTrigger>
                                <TabsTrigger value="internals" className="gap-2"><Database className="size-4" /> State</TabsTrigger>
                            </TabsList>

                            {/* AUDIT TRACE */}
                            <TabsContent value="audit" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Activity className="size-4 text-blue-500" /> Calculation Audit Trace
                                        </CardTitle>
                                        <CardDescription>Step-by-step execution log from the engine</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100 font-mono text-sm">
                                            {result?.audit.logs.map((log, i) => (
                                                <div key={i} className="flex gap-4 p-3 hover:bg-slate-50">
                                                    <div className="w-8 shrink-0 text-slate-400 font-bold">{i + 1}</div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="font-semibold text-slate-700">{log.step}</span>
                                                            <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">{log.result}</span>
                                                        </div>
                                                        <div className="text-slate-500">{log.formula}</div>
                                                        {log.note && <div className="text-xs text-slate-400 italic">{`// ${log.note}`}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ALGORITHM EXPLANATION */}
                            <TabsContent value="algorithm" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Valuation Algorithm</CardTitle>
                                        <CardDescription>How the numbers are crunched</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm leading-relaxed">
                                            <div className="mb-2 font-bold text-slate-700">{"// 1. Effective Rate"}</div>
                                            <div>d_eff = d_brand + d_condition - m_brand</div>

                                            <div className="my-2 font-bold text-slate-700">{"// 2. Compound Depreciation"}</div>
                                            <div>factor = (1 - d_eff)^years</div>
                                            <div>base_value = MSRP * factor</div>

                                            <div className="my-2 font-bold text-slate-700">{"// 3. Add Replacements"}</div>
                                            <div>addbacks = Σ (part_cost * recovery_rate)</div>

                                            <div className="my-2 font-bold text-slate-700">{"// 4. Final Floor Check"}</div>
                                            <div>final = MAX(base + addbacks, salvage_floor)</div>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Calculations are performed in integer cents to ensure precision.
                                            The Effective Depreciation Rate is clamped between 0% and 50% per year.
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* LOOKUP TABLES */}
                            <TabsContent value="tables" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Lookup Tables</CardTitle>
                                        <CardDescription>Basis points (bps) configuration. 100 bps = 1%</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="mb-2 font-semibold text-sm">Brand Parameters</h4>
                                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-left">
                                                        <tr className="border-b border-slate-200">
                                                            <th className="p-2 font-medium">Brand</th>
                                                            <th className="p-2 font-medium">Base Depr. (d)</th>
                                                            <th className="p-2 font-medium">Maint. Bonus (m)</th>
                                                            <th className="p-2 font-medium">Salvage (s)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {Object.entries(BRANDS).map(([k, v]) => (
                                                            <tr key={k} className={brand === k ? "bg-blue-50" : ""}>
                                                                <td className="p-2 font-medium">{k}</td>
                                                                <td className="p-2 text-slate-600">{v.d} bps</td>
                                                                <td className="p-2 text-slate-600">{v.m} bps</td>
                                                                <td className="p-2 text-slate-600">{v.s} bps</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="mb-2 font-semibold text-sm">Condition Penalties</h4>
                                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-left">
                                                        <tr className="border-b border-slate-200">
                                                            <th className="p-2 font-medium">Condition</th>
                                                            <th className="p-2 font-medium">Penalty (d_cond)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {Object.entries(CONDITIONS).map(([k, v]) => (
                                                            <tr key={k} className={condition === k ? "bg-blue-50" : ""}>
                                                                <td className="p-2 font-medium">{k}</td>
                                                                <td className="p-2 text-slate-600">{v} bps</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* RAW STATE */}
                            <TabsContent value="internals" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Live System State</CardTitle>
                                        <CardDescription>Current JSON payload</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-400">
                                            {JSON.stringify({
                                                inputs: { p0, brand, condition, ageMonths, parts },
                                                result
                                            }, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
