import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CalculatorState {
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
    marginalTaxRate: number;
    showAfterTax: boolean;
}

interface HorizonData {
    years: number;
    ownershipCost: number;
    leasingCost: number;
    delta: number;
}

interface SensitivityRow {
    sets: number;
    year1Delta: number;
    year3Delta: number;
    year5Delta: number;
    year10Delta?: number;
}

interface PDFData {
    state: CalculatorState;
    annualOwnershipCost: number;
    annualLeasingCost: number;
    annualDelta: number;
    horizonData: HorizonData[];
    sensitivityData: SensitivityRow[];
    operatingBurden: number;
}

export const generatePDF = async (data: PDFData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Helper to center text
    const centerText = (text: string, y: number, fontSize = 12, style = "normal") => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", style);
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
    };

    // Load Logo
    try {
        const logoUrl = "/images/roadrunnerappliance-logo.png";
        const logoData = await fetch(logoUrl)
            .then(res => res.blob())
            .then(blob => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));

        doc.addImage(logoData, "PNG", 14, 10, 25, 25);
    } catch (error) {
        console.error("Error loading logo:", error);
    }

    // Header Text - Center below branding
    const titleY = 45;

    doc.setTextColor(37, 99, 235); // Blue-600
    centerText("Road Runner Appliance Leasing", titleY, 22, "bold");

    doc.setTextColor(0, 0, 0); // Black
    centerText("Portfolio Appliance Cost Analyzer (Lease vs. Purchase)", titleY + 8, 16, "bold");

    // Contact Info (Right aligned)
    const contactX = pageWidth - 14;
    doc.setFontSize(10);
    doc.setTextColor(100);
    centerText(`Generated: ${new Date().toLocaleDateString()}`, titleY + 14, 10, "normal");

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("843-536-6005", contactX, 18, { align: "right" });
    doc.text("roadrunnerappliance@yahoo.com", contactX, 23, { align: "right" });
    doc.text("123 W. Broad St. Hemingway, SC", contactX, 28, { align: "right" });

    // Reset for body
    doc.setTextColor(0);

    // Section 1: Portfolio Configuration
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Portfolio Configuration", 14, 75);

    autoTable(doc, {
        startY: 80,
        head: [["Parameter", "Value", "Parameter", "Value"]],
        body: [
            ["Scale", `${data.state.numberOfSets} Sets (${data.state.machinesPerSet * data.state.numberOfSets} Machines)`, "Depreciation", data.state.depreciationMethod === "straight-line" ? "Straight-line (10yr)" : "MACRS (5yr)"],
            ["Scenario", data.state.scenarioPreset.charAt(0).toUpperCase() + data.state.scenarioPreset.slice(1), "Effective Tax Rate", `${(data.state.marginalTaxRate * 100).toFixed(0)}%`],
            ["Purchase Basis", "Cash Acquisition", "Tax Effects", data.state.showAfterTax ? "Included (Tax-Adjusted Cost)" : "Excluded (Pre-Tax View)"],
        ],
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 },
    });

    // Section 2: Annual Financial Overview
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Annual Financial Overview", 14, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [["Metric", "Annual Cost"]],
        body: [
            ["Total Cost to Own", formatCurrency(data.annualOwnershipCost)],
            ["Total Cost to Lease", formatCurrency(data.annualLeasingCost)],
            [{ content: "Cost Variance (Lease – Purchase)", styles: { fontStyle: "bold" } }, { content: formatCurrency(data.annualDelta), styles: { fontStyle: "bold", textColor: data.annualDelta < 0 ? [0, 128, 0] : [255, 0, 0] } }],
        ],
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 1: { halign: "right" } },
    });


    // Section 3: Horizon Analysis
    const horizonY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Horizon Comparison (Undiscounted Cash Cost)", 14, horizonY);

    autoTable(doc, {
        startY: horizonY + 5,
        head: [["Holding Period", "Purchase Cost", "Lease Cost", "Variance (Lease – Purchase)"]],
        body: data.horizonData.map(h => [
            `${h.years}-Year`,
            formatCurrency(h.ownershipCost),
            formatCurrency(h.leasingCost),
            { content: formatCurrency(h.delta), styles: { textColor: h.delta < 0 ? [0, 128, 0] : [255, 0, 0] } }
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });

    // Section 4: Sensitivity Analysis
    const sensitivityY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("4. Scale Sensitivity (Portfolio Size)", 14, sensitivityY);

    autoTable(doc, {
        startY: sensitivityY + 5,
        head: [["Portfolio Size", "1-Year Variance", "3-Year Variance", "5-Year Variance"]],
        body: data.sensitivityData.map(row => [
            `${row.sets} Sets`,
            { content: formatCurrency(row.year1Delta), styles: { textColor: row.year1Delta < 0 ? [0, 128, 0] : [255, 0, 0] } },
            { content: formatCurrency(row.year3Delta), styles: { textColor: row.year3Delta < 0 ? [0, 128, 0] : [255, 0, 0] } },
            { content: formatCurrency(row.year5Delta), styles: { textColor: row.year5Delta < 0 ? [0, 128, 0] : [255, 0, 0] } },
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });

    // Disclaimer
    let footerY = (doc as any).lastAutoTable.finalY + 20;
    const pageHeight = doc.internal.pageSize.height;
    const disclaimerHeight = 30; // Approx height for 4 lines of text

    if (footerY + disclaimerHeight > pageHeight) {
        doc.addPage();
        footerY = 20; // Reset to top margin on new page
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text(
        "This calculator is for illustrative planning purposes only. Results are estimates based on user inputs and selected assumptions. Tax treatment, depreciation eligibility, and local property tax rules vary by entity, jurisdiction, and filing position. Consult a qualified CPA or tax advisor before making tax or investment decisions.",
        14,
        footerY,
        { maxWidth: pageWidth - 28 }
    );

    doc.save("deal-analyzer-report.pdf");
};
