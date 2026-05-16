import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AdvancedAssumptionsAccordion } from "./AdvancedAssumptionsAccordion";
import { useDealAnalyzer } from "../hooks/useDealAnalyzer";

interface Props {
    analyzer: ReturnType<typeof useDealAnalyzer>;
}

export function StepLease({ analyzer }: Props) {
    const { state, updateState } = analyzer;

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">Lease Proposal Terms</CardTitle>
                <CardDescription>
                    Enter the costs from your leasing vendor quote.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="monthlyRent">Monthly Rent per Machine</Label>
                        <Input
                            id="monthlyRent"
                            type="number"
                            value={state.monthlyRentPerMachine}
                            onChange={(e) => updateState({ monthlyRentPerMachine: Number.parseFloat(e.target.value) || 0 })}
                            step="0.01"
                            className="text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monthlyAdmin">Monthly Admin/Account Fee</Label>
                        <Input
                            id="monthlyAdmin"
                            type="number"
                            value={state.monthlyAdminFeePerTransaction}
                            onChange={(e) => updateState({ monthlyAdminFeePerTransaction: Number.parseFloat(e.target.value) || 0 })}
                            step="0.01"
                            className="text-lg"
                        />
                        <p className="text-xs text-slate-500">Total monthly fee for the entire account (not per machine).</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="ldw"
                            checked={state.includeLDW}
                            onCheckedChange={(checked) => updateState({ includeLDW: Boolean(checked) })}
                        />
                        <Label htmlFor="ldw" className="cursor-pointer font-medium">
                            Include Liability Damage Waiver (LDW)
                        </Label>
                    </div>
                    {state.includeLDW && (
                        <div className="ml-6 space-y-2 max-w-xs">
                            <Label htmlFor="ldwFee">LDW Fee per Machine (monthly)</Label>
                            <Input
                                id="ldwFee"
                                type="number"
                                value={state.ldwFeePerMachine}
                                onChange={(e) => updateState({ ldwFeePerMachine: Number.parseFloat(e.target.value) || 0 })}
                                step="0.01"
                            />
                        </div>
                    )}
                </div>

                <AdvancedAssumptionsAccordion title="One-time Fees & Penalties">
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1 bg-slate-100 p-3 rounded-md border border-slate-200">
                                <Label className="text-xs text-slate-500 uppercase">Delivery Fee</Label>
                                <div className="text-lg font-bold text-slate-700">$150.00</div>
                                <p className="text-[10px] text-slate-400 italic">Locked (Per Set)</p>
                            </div>
                            <div className="space-y-1 bg-slate-100 p-3 rounded-md border border-slate-200">
                                <Label className="text-xs text-slate-500 uppercase">Installation Fee</Label>
                                <div className="text-lg font-bold text-slate-700">$100.00</div>
                                <p className="text-[10px] text-slate-400 italic">Locked (Per Set)</p>
                            </div>
                            <div className="space-y-1 bg-slate-100 p-3 rounded-md border border-slate-200">
                                <Label className="text-xs text-slate-500 uppercase">Application Fee</Label>
                                <div className="text-lg font-bold text-slate-700">$50.00</div>
                                <p className="text-[10px] text-slate-400 italic">Locked (Portfolio)</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rescheduleOccurrences">Number of Reschedules (Annual)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="rescheduleOccurrences"
                                        type="number"
                                        value={state.rescheduleOccurrencesPerYear}
                                        onChange={(e) => updateState({ rescheduleOccurrencesPerYear: Number.parseInt(e.target.value, 10) || 0 })}
                                        min="0"
                                    />
                                    <span className="text-sm text-slate-500 whitespace-nowrap">@ $35.00 ea</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="latePaymentOccurrences">Number of Late Payments (Annual)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="latePaymentOccurrences"
                                        type="number"
                                        value={state.latePaymentOccurrencesPerYear}
                                        onChange={(e) => updateState({ latePaymentOccurrencesPerYear: Number.parseInt(e.target.value, 10) || 0 })}
                                        min="0"
                                    />
                                    <span className="text-sm text-slate-500 whitespace-nowrap">@ $7.50 ea</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </AdvancedAssumptionsAccordion>
            </CardContent>
        </Card>
    );
}
