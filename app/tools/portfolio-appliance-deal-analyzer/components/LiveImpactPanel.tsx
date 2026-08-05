import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useDealAnalyzer } from "../hooks/useDealAnalyzer";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Props {
    analyzer: ReturnType<typeof useDealAnalyzer>;
}

export function LiveImpactPanel({ analyzer }: Props) {
    const { annualOwnershipCost, annualLeasingCost, annualDelta } = analyzer;

    const formatCurrency = (val: number) =>
        Math.abs(val).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const isLeaseCheaper = annualDelta < 0;
    const winnerColor = isLeaseCheaper ? "text-green-600" : "text-blue-600";
    const winnerBg = isLeaseCheaper ? "bg-green-50" : "bg-blue-50";

    return (
        <Card className="border shadow-lg overflow-hidden">
            <div className={`${winnerBg} p-4 border-b`}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Current Workflow
                </div>
                <div className="flex items-center gap-2">
                    <CardTitle className={`text-xl ${winnerColor}`}>
                        {isLeaseCheaper ? "Lease Wins" : "Purchase Wins"}
                    </CardTitle>
                    {isLeaseCheaper ? <ArrowDown className="text-green-600 h-5 w-5" /> : <ArrowUp className="text-blue-600 h-5 w-5" />}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                    by <span className="font-bold">{formatCurrency(annualDelta)}</span> / year
                </div>
            </div>
            <CardContent className="p-4 space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Yr 1 Purchase Cost</span>
                        <span className="font-medium">{formatCurrency(annualOwnershipCost)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min((annualOwnershipCost / (annualOwnershipCost + annualLeasingCost)) * 100 * 2, 100)}%` }}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Yr 1 Lease Cost</span>
                        <span className="font-medium">{formatCurrency(annualLeasingCost)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min((annualLeasingCost / (annualOwnershipCost + annualLeasingCost)) * 100 * 2, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-[10px] text-slate-400 text-center">
                        *Estimates update live as you type
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
