import { useState } from "react";

export interface CalculatorState {
    numberOfSets: number;
    machinesPerSet: number;
    scenarioPreset: "conservative" | "base" | "high-failure";
    ownershipView: "cash" | "accrual";
    purchasePricePerMachine: number;
    depreciationMethod: "straight-line" | "macrs";
    monthlyRentPerMachine: number;
    monthlyAdminFeePerTransaction: number;
    deliveryFeePerSet: number;
    installationFeePerSet: number;
    applicationFee: number;
    includeLDW: boolean;
    ldwFeePerMachine: number;
    rescheduleOccurrencesPerYear: number;
    latePaymentOccurrencesPerYear: number;
    otherPenaltyFeesPerYear: number;
    // New Tax Fields
    marginalTaxRate: number; // 0.0 to 0.5
    showAfterTax: boolean;
}

export const SCENARIO_PRESETS = {
    conservative: 360,
    base: 491.37,
    "high-failure": 780,
    custom: 0,
};

const defaultState: CalculatorState = {
    numberOfSets: 10,
    machinesPerSet: 2,
    scenarioPreset: "base",
    ownershipView: "cash",
    purchasePricePerMachine: 800,
    depreciationMethod: "straight-line",
    monthlyRentPerMachine: 29,
    monthlyAdminFeePerTransaction: 5,
    deliveryFeePerSet: 150,
    installationFeePerSet: 100,
    applicationFee: 50,
    includeLDW: false,
    ldwFeePerMachine: 3,
    rescheduleOccurrencesPerYear: 0,
    latePaymentOccurrencesPerYear: 0,
    otherPenaltyFeesPerYear: 0,
    marginalTaxRate: 0.25,
    showAfterTax: false,
};

const FIXED_FEES = {
    deliveryFeePerSet: 150,
    installationFeePerSet: 100,
    applicationFee: 50,
    rescheduleRate: 35,
    latePaymentRate: 7.50,
};

export function useDealAnalyzer() {
    const [state, setState] = useState<CalculatorState>(defaultState);

    const updateState = (updates: Partial<CalculatorState>) => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const resetDefaults = () => {
        setState(defaultState);
    };

    const totalMachines = state.numberOfSets * state.machinesPerSet;

    const getOperatingBurden = () => {
        return SCENARIO_PRESETS[state.scenarioPreset];
    };

    const calculateOwnershipCosts = (years: number) => {
        const upfrontCost = state.purchasePricePerMachine * totalMachines;
        const annualOperatingBurden = getOperatingBurden() * state.numberOfSets;

        let totalDepreciation = 0;
        if (state.depreciationMethod === "straight-line") {
            const usefulLife = 10;
            const annualDepreciation = upfrontCost / usefulLife;
            totalDepreciation = annualDepreciation * Math.min(years, usefulLife);
        } else {
            // MACRS 5-Year
            const rates = [0.2, 0.32, 0.192, 0.1152, 0.1152, 0.0576];
            for (let i = 0; i < Math.min(years, rates.length); i += 1) {
                totalDepreciation += upfrontCost * rates[i];
            }
        }

        const totalOperatingCost = annualOperatingBurden * years;

        const deductibleExpenses = totalDepreciation + totalOperatingCost;
        const taxSavings = state.showAfterTax ? deductibleExpenses * state.marginalTaxRate : 0;

        if (state.ownershipView === "cash") {
            return upfrontCost + totalOperatingCost - taxSavings;
        }

        return totalDepreciation + totalOperatingCost - taxSavings;
    };

    const calculateLeasingCosts = (years: number) => {
        const monthlyRent = state.monthlyRentPerMachine * totalMachines;
        const monthlyAdmin = state.monthlyAdminFeePerTransaction;
        const monthlyLDW = state.includeLDW ? state.ldwFeePerMachine * totalMachines : 0;

        const totalMonthlyFees = monthlyRent + monthlyAdmin + monthlyLDW;
        const totalRentCost = totalMonthlyFees * 12 * years;

        const setupFees =
            (FIXED_FEES.deliveryFeePerSet + FIXED_FEES.installationFeePerSet) * state.numberOfSets + FIXED_FEES.applicationFee;

        const totalPenaltyFees =
            (state.rescheduleOccurrencesPerYear * FIXED_FEES.rescheduleRate +
                state.latePaymentOccurrencesPerYear * FIXED_FEES.latePaymentRate +
                state.otherPenaltyFeesPerYear) * years;

        const totalCost = totalRentCost + setupFees + totalPenaltyFees;

        // Lease payments are 100% tax deductible (OPEX)
        const taxSavings = state.showAfterTax ? totalCost * state.marginalTaxRate : 0;

        return totalCost - taxSavings;
    };

    const annualOwnershipCost = calculateOwnershipCosts(1);
    const annualLeasingCost = calculateLeasingCosts(1);
    const annualDelta = annualLeasingCost - annualOwnershipCost;

    const recurringAnnualOwnershipCost =
        getOperatingBurden() * state.numberOfSets +
        (state.ownershipView === "accrual" ? (state.purchasePricePerMachine * totalMachines) / 10 : 0);
    const recurringAnnualLeasingCost =
        (state.monthlyRentPerMachine * totalMachines +
            state.monthlyAdminFeePerTransaction +
            (state.includeLDW ? state.ldwFeePerMachine * totalMachines : 0)) *
        12 +
        (state.rescheduleOccurrencesPerYear * FIXED_FEES.rescheduleRate) +
        (state.latePaymentOccurrencesPerYear * FIXED_FEES.latePaymentRate) +
        state.otherPenaltyFeesPerYear;

    const horizonYears = [1, 3, 5];
    const horizonData = horizonYears.map((years) => ({
        years,
        ownershipCost: calculateOwnershipCosts(years),
        leasingCost: calculateLeasingCosts(years),
        delta: calculateLeasingCosts(years) - calculateOwnershipCosts(years),
    }));

    const sensitivitySizes = [10, 20, 50, 100];
    const sensitivityData = sensitivitySizes.map((sets) => {
        const machines = sets * state.machinesPerSet;

        const calcOwnership = (years: number) => {
            const upfrontCost = state.purchasePricePerMachine * machines;
            const annualOperatingBurden = getOperatingBurden() * sets;

            let totalDepreciation = 0;
            if (state.depreciationMethod === "straight-line") {
                const usefulLife = 10;
                const annualDepreciation = upfrontCost / usefulLife;
                totalDepreciation = annualDepreciation * Math.min(years, usefulLife);
            } else {
                const rates = [0.2, 0.32, 0.192, 0.1152, 0.1152, 0.0576];
                for (let i = 0; i < Math.min(years, rates.length); i += 1) {
                    totalDepreciation += upfrontCost * rates[i];
                }
            }

            const totalOperatingCost = annualOperatingBurden * years;

            const deductibleExpenses = totalDepreciation + totalOperatingCost;
            const taxSavings = state.showAfterTax ? deductibleExpenses * state.marginalTaxRate : 0;

            if (state.ownershipView === "cash") {
                return upfrontCost + totalOperatingCost - taxSavings;
            }
            return totalDepreciation + totalOperatingCost - taxSavings;
        };

        const calcLeasing = (years: number) => {
            const monthlyRent = state.monthlyRentPerMachine * machines;
            const monthlyAdmin = state.monthlyAdminFeePerTransaction;
            const monthlyLDW = state.includeLDW ? state.ldwFeePerMachine * machines : 0;

            const totalMonthlyFees = monthlyRent + monthlyAdmin + monthlyLDW;
            const totalRentCost = totalMonthlyFees * 12 * years;

            const setupFees = (FIXED_FEES.deliveryFeePerSet + FIXED_FEES.installationFeePerSet) * sets + FIXED_FEES.applicationFee;
            const totalPenaltyFees =
                (state.rescheduleOccurrencesPerYear * FIXED_FEES.rescheduleRate +
                    state.latePaymentOccurrencesPerYear * FIXED_FEES.latePaymentRate +
                    state.otherPenaltyFeesPerYear) * years;

            const totalCost = totalRentCost + setupFees + totalPenaltyFees;
            const taxSavings = state.showAfterTax ? totalCost * state.marginalTaxRate : 0;

            return totalCost - taxSavings;
        };

        return {
            sets,
            year1Delta: calcLeasing(1) - calcOwnership(1),
            year3Delta: calcLeasing(3) - calcOwnership(3),
            year5Delta: calcLeasing(5) - calcOwnership(5),
            // year10Delta: calcLeasing(10) - calcOwnership(10), // Hidden
        };
    });

    return {
        state,
        updateState,
        resetDefaults,
        totalMachines,
        getOperatingBurden,
        calculateOwnershipCosts,
        calculateLeasingCosts,
        annualOwnershipCost,
        annualLeasingCost,
        annualDelta,
        horizonData,
        sensitivityData,
    };
}
