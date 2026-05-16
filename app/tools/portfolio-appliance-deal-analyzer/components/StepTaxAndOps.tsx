import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SCENARIO_PRESETS, useDealAnalyzer } from "../hooks/useDealAnalyzer";
import { CalculatorState } from "../hooks/useDealAnalyzer";

interface Props {
    analyzer: ReturnType<typeof useDealAnalyzer>;
}

export function StepTaxAndOps({ analyzer }: Props) {
    const { state, updateState, getOperatingBurden } = analyzer;

    const formatCurrency = (val: number) =>
        val.toLocaleString("en-US", { style: "currency", currency: "USD" });


    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">Operating & Tax Strategy</CardTitle>
                <CardDescription>
                    Define maintenance expectations and tax impact.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">

                {/* Operating Section */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="scenarioPreset" className="text-lg font-semibold">O&M Intensity Scenario</Label>
                        <p className="text-sm text-slate-500">Select the maintenance expectation for this portfolio.</p>
                        <Select
                            value={state.scenarioPreset}
                            onValueChange={(value: CalculatorState["scenarioPreset"]) => updateState({ scenarioPreset: value })}
                        >
                            <SelectTrigger id="scenarioPreset" className="h-12 text-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="conservative">Conservative - New buildings, light use</SelectItem>
                                <SelectItem value="base">Base - Industry Standard</SelectItem>
                                <SelectItem value="high-failure">High-Failure - Older units, heavy use</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tax Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Tax Shield Analysis</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showAfterTax"
                            checked={state.showAfterTax}
                            onCheckedChange={(checked) => updateState({ showAfterTax: Boolean(checked) })}
                        />
                        <Label htmlFor="showAfterTax" className="cursor-pointer font-bold text-blue-700 text-base">
                            Apply Effective Tax Rate Analysis
                        </Label>
                    </div>

                    {state.showAfterTax && (
                        <div className="space-y-4 pl-6 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label htmlFor="taxRate">Marginal Tax Rate</Label>
                                    <span className="font-bold font-mono">{(state.marginalTaxRate * 100).toFixed(0)}%</span>
                                </div>
                                <Input
                                    id="taxRate"
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={state.marginalTaxRate * 100}
                                    onChange={(e) => updateState({ marginalTaxRate: Number(e.target.value) / 100 })}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-slate-500">
                                    Higher tax rates generally favor leasing because lease payments are 100% OPEX deductible, whereas purchase deductions (depreciation) are spread out.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
