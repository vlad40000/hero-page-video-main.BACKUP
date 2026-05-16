import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Thermometer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Refrigerator Temperature Guide | Roadrunner Appliance",
  description:
    "Learn the ideal temperature settings for your refrigerator and freezer. Keep food fresh and safe.",
};

export default function TempGuidePage() {
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
              <Thermometer className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Refrigerator Temperature Guide
            </h1>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Proper temperature settings keep your food fresh longer and
            prevent bacterial growth. Use this guide to set your refrigerator
            and freezer to the optimal temperatures.
          </p>
        </div>
      </div>

      {/* Ideal Temperatures */}
      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Ideal Temperature Settings
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary">37°F</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Refrigerator
                </h3>
                <p className="text-muted-foreground mb-4">
                  Keep your refrigerator between 35°F and 38°F
                </p>
                <p className="text-sm text-muted-foreground">
                  The ideal temperature is 37°F (3°C). This keeps food cold
                  enough to slow bacterial growth without freezing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 bg-secondary/5">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-secondary-foreground">
                    0°F
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Freezer
                </h3>
                <p className="text-muted-foreground mb-4">
                  Keep your freezer at 0°F or below
                </p>
                <p className="text-sm text-muted-foreground">
                  The ideal temperature is 0°F (-18°C). This ensures food
                  stays frozen solid and maintains quality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 md:py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Temperature Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Do This
                </h3>
                <ul className="space-y-3">
                  {[
                    "Use an appliance thermometer to check actual temperature",
                    "Wait 24 hours after adjusting settings to check temperature",
                    "Keep the fridge at least 3/4 full for best efficiency",
                    "Allow hot food to cool before refrigerating",
                    "Check door seals regularly for proper closure",
                    "Clean condenser coils every 6-12 months",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Avoid This
                </h3>
                <ul className="space-y-3">
                  {[
                    "Setting temperature too cold (wastes energy, freezes food)",
                    "Setting temperature too warm (above 40°F is danger zone)",
                    "Blocking air vents with food items",
                    "Opening the door too frequently or for too long",
                    "Overpacking the fridge (restricts air flow)",
                    "Placing the fridge next to heat sources",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    The Danger Zone: 40°F - 140°F
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Bacteria grow rapidly between 40°F and 140°F. Food left in
                    this temperature range for more than 2 hours should be
                    discarded. If your refrigerator is above 40°F, adjust the
                    settings immediately or call for service.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-card rounded-lg px-4 py-2 border border-border">
                      <span className="text-sm text-muted-foreground">
                        Safe Zone:
                      </span>
                      <span className="ml-2 font-semibold text-foreground">
                        Below 40°F
                      </span>
                    </div>
                    <div className="bg-card rounded-lg px-4 py-2 border border-border">
                      <span className="text-sm text-muted-foreground">
                        Danger Zone:
                      </span>
                      <span className="ml-2 font-semibold text-destructive">
                        40°F - 140°F
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-12 md:py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Common Temperature Problems
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                problem: "Fridge Too Warm",
                causes: [
                  "Thermostat set incorrectly",
                  "Door gasket damaged",
                  "Condenser coils dirty",
                  "Overpacked with food",
                ],
              },
              {
                problem: "Fridge Too Cold",
                causes: [
                  "Thermostat set too low",
                  "Temperature sensor issue",
                  "Air vent blocked",
                  "Damper stuck open",
                ],
              },
              {
                problem: "Uneven Cooling",
                causes: [
                  "Blocked air vents",
                  "Fan not working properly",
                  "Too much or too little food",
                  "Door opened frequently",
                ],
              },
            ].map((item) => (
              <Card key={item.problem} className="border border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    {item.problem}
                  </h3>
                  <ul className="space-y-2">
                    {item.causes.map((cause) => (
                      <li
                        key={cause}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                        {cause}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Refrigerator Not Cooling Properly?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            If your refrigerator isn&apos;t maintaining the right temperature, it
            may need repair. Call us for fast, affordable service.
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
