import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, AlertCircle, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "5 Things to Check When Buying a Used Appliance | Road Runner Appliance",
  description:
    "Learn what to look for when shopping for used appliances to ensure you get a quality product that will last. A buying guide from Road Runner Appliance in Hemingway, SC.",
  alternates: {
    canonical: "/resources/buying-used-appliances",
  },
};

export default function BuyingUsedAppliancesPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/resources"
            className="inline-flex items-center text-primary-foreground/70 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Resources
          </Link>
          <span className="inline-block text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-1 rounded mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            5 Things to Check When Buying a Used Appliance
          </h1>
          <p className="text-primary-foreground/80">
            January 2026 · 4 min read
          </p>
        </div>
      </div>

      {/* Article Content */}
      <article className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Buying a used appliance can save you hundreds of dollars compared
            to buying new, but it&apos;s important to know what to look for. Here
            are five key things to check before making your purchase.
          </p>

          {/* Tip 1 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                1
              </span>
              Check the Age
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Knowing the age of an appliance helps you estimate how much life
              it has left. Most major appliances last 10-15 years with proper
              care. You can usually find the manufacturing date on a label
              inside the door or on the back of the unit.
            </p>
            <Card className="bg-muted border-0">
              <CardContent className="p-4">
                <p className="text-sm text-foreground font-medium mb-2">
                  Pro Tip:
                </p>
                <p className="text-sm text-muted-foreground">
                  Look up the model number online to find the manufacture date
                  if it&apos;s not clearly labeled. Many manufacturers encode the
                  date in the serial number.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tip 2 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                2
              </span>
              Inspect for Physical Damage
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Look carefully for dents, rust, cracks, or other physical
              damage. While cosmetic issues may not affect performance, they
              can indicate the appliance wasn&apos;t well cared for.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Check door seals and gaskets for cracks or gaps
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Look inside for rust, mold, or unusual odors
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Inspect cords and plugs for damage
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Check that all racks, drawers, and parts are included
                </p>
              </div>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                3
              </span>
              Test It If Possible
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              If you can, see the appliance running before you buy. This is
              one advantage of buying from a dealer like Roadrunner Appliance
              — we test everything before it goes on our floor.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Refrigerators:</strong>{" "}
                  Check that it cools properly and the compressor isn&apos;t overly
                  loud
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Washers:</strong> Run a
                  cycle and listen for unusual noises during spin
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Dryers:</strong> Check
                  that it heats properly and the drum spins smoothly
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Ranges:</strong> Test
                  all burners and the oven to ensure they heat correctly
                </span>
              </li>
            </ul>
          </div>

          {/* Tip 4 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                4
              </span>
              Research the Brand and Model
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Some brands and models have better reliability records than
              others. A quick online search can reveal common problems
              associated with a particular model, helping you avoid known
              issues.
            </p>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium mb-1">
                      Check for Recalls
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Search the model number on cpsc.gov to check for any
                      safety recalls before buying.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tip 5 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                5
              </span>
              Buy from a Reputable Seller
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Buying from a reputable dealer gives you peace of mind. At
              Roadrunner Appliance, every appliance is inspected, tested, and
              cleaned before sale. We stand behind what we sell and can answer
              your questions about any unit.
            </p>
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-foreground">
                <strong>Roadrunner Appliance Guarantee:</strong> All our
                appliances are tested and inspected. We want you to be
                satisfied with your purchase.
              </p>
            </div>
          </div>

          {/* Conclusion */}
          <div className="border-t border-border pt-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Shop?
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Stop by Roadrunner Appliance to see our current selection of
              quality used refrigerators, washers, dryers, and ranges. We&apos;re
              located at 123 W. Broad St. in Hemingway, SC. Have questions?
              Give us a call!
            </p>
            <a
              href="tel:843-536-6005"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Call 843-536-6005
            </a>
          </div>
        </div>
      </article>
    </>
  );
}
