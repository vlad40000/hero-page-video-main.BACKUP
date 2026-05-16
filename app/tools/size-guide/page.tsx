import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Ruler, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Appliance Size Guide | Roadrunner Appliance",
  description:
    "How to measure for refrigerators, washers, dryers, and ranges. Standard appliance dimensions and measuring tips.",
};

const appliances = [
  {
    name: "Refrigerators",
    tips: [
      "Measure the width, depth, and height of the space",
      "Leave 1 inch on each side for air circulation",
      "Account for door swing clearance",
      "Measure doorways and hallways for delivery access",
    ],
    sizes: [
      { type: "Top Freezer", width: '28-32"', height: '61-66"', depth: '28-34"' },
      { type: "Bottom Freezer", width: '29-32"', height: '67-70"', depth: '33-36"' },
      { type: "Side-by-Side", width: '32-36"', height: '65-71"', depth: '29-35"' },
      { type: "French Door", width: '29-36"', height: '68-70"', depth: '29-36"' },
      { type: "Compact", width: '17-24"', height: '32-34"', depth: '18-26"' },
    ],
  },
  {
    name: "Washers",
    tips: [
      "Measure width, depth, and height including any hose connections",
      "Leave 1 inch on each side and 4 inches behind for hoses",
      "Check that water and drain connections are accessible",
      "Consider stacking if space is limited",
    ],
    sizes: [
      { type: "Top Load", width: '27-28"', height: '42-44"', depth: '27-28"' },
      { type: "Front Load", width: '27"', height: '38-39"', depth: '30-34"' },
      { type: "Compact", width: '24"', height: '33-34"', depth: '24"' },
    ],
  },
  {
    name: "Dryers",
    tips: [
      "Match dryer size to your washer for best results",
      "Electric dryers need a 240V outlet",
      "Gas dryers need a gas line connection",
      "Ensure proper ventilation to the outside",
    ],
    sizes: [
      { type: "Standard", width: '27-29"', height: '42-44"', depth: '28-32"' },
      { type: "Compact", width: '24"', height: '33-34"', depth: '24"' },
    ],
  },
  {
    name: "Ranges",
    tips: [
      "Standard range cutout is 30 inches wide",
      "Measure from countertop to countertop",
      "Check gas or electric connection type",
      "Ensure proper ventilation above the range",
    ],
    sizes: [
      { type: "Standard", width: '30"', height: '36-36.5"', depth: '25-27"' },
      { type: "Wide", width: '36"', height: '36-36.5"', depth: '25-27"' },
      { type: "Compact", width: '20-24"', height: '36"', depth: '24-25"' },
    ],
  },
];

export default function SizeGuidePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/tools"
            className="inline-flex items-center text-primary-foreground/70 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Tools
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <Ruler className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Appliance Size Guide
            </h1>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Use this guide to measure your space and find the right size
            appliance. All dimensions are approximate and may vary by brand
            and model.
          </p>
        </div>
      </div>

      {/* Measuring Tips */}
      <section className="py-8 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
            <AlertCircle className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                Before You Measure
              </h2>
              <p className="text-sm text-muted-foreground">
                Always measure the space where the appliance will go AND the
                doorways, hallways, and stairs it needs to pass through during
                delivery. Call us at 843-536-6005 if you need help determining
                the right size.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appliance Sections */}
      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {appliances.map((appliance) => (
            <div key={appliance.name}>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {appliance.name}
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border border-border">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">
                      Measuring Tips
                    </h3>
                    <ul className="space-y-3">
                      {appliance.tips.map((tip) => (
                        <li
                          key={tip}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border border-border">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">
                      Standard Sizes
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-medium text-foreground">
                              Type
                            </th>
                            <th className="text-left py-2 font-medium text-foreground">
                              Width
                            </th>
                            <th className="text-left py-2 font-medium text-foreground">
                              Height
                            </th>
                            <th className="text-left py-2 font-medium text-foreground">
                              Depth
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {appliance.sizes.map((size) => (
                            <tr
                              key={size.type}
                              className="border-b border-border last:border-0"
                            >
                              <td className="py-2 text-foreground">
                                {size.type}
                              </td>
                              <td className="py-2 text-muted-foreground">
                                {size.width}
                              </td>
                              <td className="py-2 text-muted-foreground">
                                {size.height}
                              </td>
                              <td className="py-2 text-muted-foreground">
                                {size.depth}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Need Help Finding the Right Size?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Give us a call and we can help you find an appliance that fits
            your space perfectly.
          </p>
          <a
            href="tel:843-536-6005"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Call 843-536-6005
          </a>
        </div>
      </section>
    </>
  );
}
