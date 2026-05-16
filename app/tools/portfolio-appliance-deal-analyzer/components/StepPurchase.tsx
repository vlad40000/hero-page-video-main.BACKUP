import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AdvancedAssumptionsAccordion } from "./AdvancedAssumptionsAccordion";
import { useDealAnalyzer } from "../hooks/useDealAnalyzer";
import { CalculatorState } from "../hooks/useDealAnalyzer";

interface Props {
    analyzer: ReturnType<typeof useDealAnalyzer>;
}

export function StepPurchase({ analyzer }: Props) {
    const { state, updateState } = analyzer;

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">Purchase Assumptions</CardTitle>
                <CardDescription>
                    Estimate the costs of buying and owning the fleet.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice">Purchase Price per Machine</Label>
                        <Input
                            id="purchasePrice"
                            type="number"
                            value={state.purchasePricePerMachine}
                            onChange={(e) => updateState({ purchasePricePerMachine: Number.parseFloat(e.target.value) || 0 })}
                            step="0.01"
                            className="text-lg"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="space-y-3">
                        <Label className="text-lg font-semibold">Depreciation Method (Tax Strategy)</Label>
                        <RadioGroup
                            value={state.depreciationMethod}
                            onValueChange={(value: CalculatorState["depreciationMethod"]) => updateState({ depreciationMethod: value })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="straight-line" id="straight-line" />
                                <Label htmlFor="straight-line" className="cursor-pointer font-normal">
                                    Straight-line (10yr)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="macrs" id="macrs" />
                                <Label htmlFor="macrs" className="cursor-pointer font-normal">
                                    MACRS (5yr) - Standard Recovery
                                </Label>
                            </div>
                        </RadioGroup>
                        <p className="text-xs text-slate-500">
                            MACRS accelerates tax savings into the early years, whereas Straight-line spreads them evenly.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
