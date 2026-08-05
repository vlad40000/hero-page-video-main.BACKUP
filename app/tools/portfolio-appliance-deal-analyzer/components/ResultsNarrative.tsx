import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDealAnalyzer } from "../hooks/useDealAnalyzer";
import { TrendingDown, TrendingUp, ShoppingCart, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
    analyzer: ReturnType<typeof useDealAnalyzer>;
}

export function ResultsNarrative({ analyzer }: Props) {
    const { horizonData, annualDelta, annualOwnershipCost, annualLeasingCost } = analyzer;

    const formatCurrency = (val: number) =>
        Math.abs(val).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });

    const fiveYearData = horizonData.find(h => h.years === 5) || horizonData[2];
    const winner = fiveYearData.delta < 0 ? "Lease" : "Purchase";
    const alternative = winner === "Purchase" ? "Lease" : "Purchase";
    const savings = Math.abs(fiveYearData.delta);

    return (
        <div className="space-y-6">
            {/* Top Headline */}
            <div className={`p-6 rounded-xl border-l-8 ${winner === "Purchase" ? "bg-blue-50 border-blue-600" : "bg-green-50 border-green-600"} shadow-sm`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900">
                            Recommendation: <span className={winner === "Purchase" ? "text-blue-700" : "text-green-700"}>{winner}</span>
                        </h2>
                        <p className="text-lg text-slate-700">
                            Over a 5-year horizon, {winner.toLowerCase()} is projected to save you <span className="font-bold text-slate-900">{formatCurrency(savings)}</span> compared to {alternative.toLowerCase()}.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/shop" className="w-full sm:w-auto">
                            <Button
                                className={`gap-2 h-12 px-6 w-full ${winner === "Purchase" ? "bg-blue-600 hover:bg-blue-700 text-white" : "variant-outline"}`}
                                variant={winner === "Purchase" ? "default" : "outline"}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Shop Now
                            </Button>
                        </Link>
                        <Link href="/leasing/pre-qual" className="w-full sm:w-auto">
                            <Button
                                className={`gap-2 h-12 px-6 w-full ${winner === "Lease" ? "bg-green-600 hover:bg-green-700 text-white" : "variant-outline"}`}
                                variant={winner === "Lease" ? "default" : "outline"}
                            >
                                <FileEdit className="h-4 w-4" />
                                Apply for Leasing
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Horizon Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {horizonData.map((h) => (
                    <Card key={h.years} className={`border-t-4 ${h.delta < 0 ? "border-t-green-500" : "border-t-blue-500"}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between">
                                {h.years}-Year Horizon
                                {h.delta < 0 ? <TrendingDown className="h-5 w-5 text-green-600" /> : <TrendingUp className="h-5 w-5 text-blue-600" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Purchase Cost:</span>
                                    <span className="font-medium">{formatCurrency(h.ownershipCost)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Lease Cost:</span>
                                    <span className="font-medium">{formatCurrency(h.leasingCost)}</span>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-100">
                                <div className="text-xs text-slate-500 uppercase tracking-wide">Projected Savings</div>
                                <div className={`text-2xl font-bold ${h.delta < 0 ? "text-green-700" : "text-blue-700"}`}>
                                    {formatCurrency(h.delta)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Why this result? */}
            <Card>
                <CardHeader>
                    <CardTitle>Why is this the result?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-slate-600">
                        The break-even analysis compares the upfront capital expenditure of purchasing against the recurring monthly fees of leasing.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                        <li>
                            <strong>Annual Cost of Ownership:</strong> {formatCurrency(annualOwnershipCost)} (Year 1)
                        </li>
                        <li>
                            <strong>Annual Cost of Leasing:</strong> {formatCurrency(annualLeasingCost)} (Year 1)
                        </li>
                        <li>
                            <strong>Key Driver:</strong> {
                                Math.abs(annualDelta) < 1000
                                    ? "Costs are very close. Decision should be based on operational preference."
                                    : annualDelta < 0
                                        ? "High purchase price and O&M costs make leasing cheaper."
                                        : "Recurring lease fees exceed the cost of ownership over time."
                            }
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
