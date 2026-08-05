import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDealAnalyzer } from "../hooks/useDealAnalyzer";

interface Props {
    analyzer: ReturnType<typeof useDealAnalyzer>;
}

export function StepPortfolio({ analyzer }: Props) {
    const { state, updateState, totalMachines } = analyzer;

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">Portfolio Configuration</CardTitle>
                <CardDescription>
                    Define the size of your appliance fleet.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="numberOfSets">Number of Washer/Dryer Sets</Label>
                        <div className="text-sm font-medium text-slate-400 italic mb-1">(2 Machines per set)</div>
                        <Input
                            id="numberOfSets"
                            type="number"
                            value={state.numberOfSets}
                            onChange={(e) => updateState({ numberOfSets: Number.parseInt(e.target.value, 10) || 0 })}
                            min="1"
                            className="text-lg"
                        />
                        <p className="text-xs text-slate-500">Total number of units or apartments you are managing.</p>
                    </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-600">Total Machines in Fleet</div>
                            <div className="text-2xl font-bold text-slate-900">{totalMachines}</div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            Auto-calculated
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
