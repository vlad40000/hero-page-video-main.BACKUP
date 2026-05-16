import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StepPortfolio } from "./StepPortfolio";
import { StepLease } from "./StepLease";
import { StepPurchase } from "./StepPurchase";
import { StepTaxAndOps } from "./StepTaxAndOps";
import { ResultsNarrative } from "./ResultsNarrative";
import { useDealAnalyzer } from "../hooks/useDealAnalyzer";
import { LiveImpactPanel } from "./LiveImpactPanel";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generatePDF } from "@/lib/generate-pdf";
import { toast } from "sonner";

const STEPS = [
    { id: "portfolio", title: "Portfolio Snapshot" },
    { id: "lease", title: "Lease Terms" },
    { id: "purchase", title: "Purchase Terms" },
    { id: "ops", title: "Operating + Tax" },
    { id: "results", title: "Results" },
];

export function CalculatorWizard() {
    const analyzer = useDealAnalyzer();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const {
                state,
                annualOwnershipCost,
                annualLeasingCost,
                annualDelta,
                horizonData,
                sensitivityData,
                getOperatingBurden
            } = analyzer;

            await generatePDF({
                state,
                annualOwnershipCost,
                annualLeasingCost,
                annualDelta,
                horizonData: horizonData.map(h => ({ ...h, years: h.years })),
                sensitivityData,
                operatingBurden: getOperatingBurden(),
            });
            toast.success("Report downloaded successfully");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <StepPortfolio analyzer={analyzer} />;
            case 1:
                return <StepLease analyzer={analyzer} />;
            case 2:
                return <StepPurchase analyzer={analyzer} />;
            case 3:
                return <StepTaxAndOps analyzer={analyzer} />;
            case 4:
                return <ResultsNarrative analyzer={analyzer} />;
            default:
                return null;
        }
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>Step {currentStep + 1} of {STEPS.length}</span>
                        <span>{STEPS[currentStep].title}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Content */}
                <div className="min-h-[300px]">
                    {renderStep()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t border-slate-200">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    {currentStep < STEPS.length - 1 ? (
                        <Button onClick={handleNext} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleDownloadPDF} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Download className="h-4 w-4" />
                            Download PDF Report
                        </Button>
                    )}
                </div>
            </div>

            {/* Desktop Sticky Panel */}
            <div className="hidden lg:block w-80 shrink-0">
                <div className="sticky top-6">
                    <LiveImpactPanel analyzer={analyzer} />
                </div>
            </div>

            {/* Mobile Sticky Panel (Simulated) */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                {/* Could be a floating action button or collapsed view */}
            </div>
        </div>
    );
}
