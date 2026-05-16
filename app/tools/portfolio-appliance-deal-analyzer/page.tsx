"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Calculator } from "lucide-react";
import { CalculatorWizard } from "./components/CalculatorWizard";

export default function PortfolioApplianceDealAnalyzerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                            <Calculator className="size-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Appliance Portfolio Analyzer</h1>
                            <p className="text-slate-500 text-sm">Lease vs. Buy Decision Tool</p>
                        </div>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                                <HelpCircle className="h-4 w-4" />
                                How it works
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>How to Use the Deal Analyzer</DialogTitle>
                                <DialogDescription>
                                    A step-by-step guide to calculating the true cost of your appliance fleet.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-blue-900">1. Configure Your Fleet</h3>
                                    <p className="text-sm text-slate-600">
                                        Enter the number of units/sets you manage. The calculator scales all costs based on this volume.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-blue-900">2. Select a Scenario</h3>
                                    <p className="text-sm text-slate-600">
                                        <strong>Operating Burden</strong> represents the hidden costs of ownership (parts, labor, coordination).
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-slate-600 ml-2">
                                        <li><strong>Conservative:</strong> New machines, low failure rates.</li>
                                        <li><strong>Base:</strong> Average industry failure rates (~8-10% annually).</li>
                                        <li><strong>High-Failure:</strong> Aging fleet or rough tenant usage.</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-blue-900">3. Choose Ownership View</h3>
                                    <p className="text-sm text-slate-600">
                                        Toggle between <strong>Cash Flow</strong> (actual money out) and <strong>Accrual</strong> (accounting view including depreciation) to see different financial perspectives.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-blue-900">4. Tax Shield Analysis</h3>
                                    <p className="text-sm text-slate-600">
                                        Use the &quot;Financial Assumptions&quot; card to set your tax rate. Toggle <strong>Show After-Tax Cost</strong> to see how leasing (100% tax deductible OPEX) compares to buying (Depreciation).
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-blue-900">5. Interpret Results</h3>
                                    <p className="text-sm text-slate-600">
                                        Check the <strong>Cumulative Project Cost Comparison</strong> cards to see the break-even point. Use the <strong>Sensitivity Analysis</strong> at the bottom to stress-test your assumptions.
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Main Wizard */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                    <CalculatorWizard />
                </div>
            </div>
        </div>
    );
}
