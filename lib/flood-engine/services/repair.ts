export interface RepairScenario {
    technicalTerm: string;
    estimatedCostCents: number;
    probability: number;
}

export function getRepairScenarios(category: string): RepairScenario[] {
    // Stub data based on category
    return [
        { technicalTerm: "Control Board Failure", estimatedCostCents: 25000, probability: 0.15 },
        { technicalTerm: "Motor Replacement", estimatedCostCents: 18000, probability: 0.10 },
        { technicalTerm: "Sensor Malfunction", estimatedCostCents: 12000, probability: 0.20 }
    ];
}

export function calculateRepairEstimate(category: string, symptom: string): { totalCents: number } | null {
    // Stub calculation
    return { totalCents: 15000 };
}
