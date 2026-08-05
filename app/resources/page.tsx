import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Lightbulb,
  DollarSign,
  Wrench,
  Leaf,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Appliance Resources & Tips | Road Runner Appliance",
  description:
    "Appliance buying guides, maintenance tips, and energy-saving advice for homeowners in Hemingway, SC. Free resources from Road Runner Appliance.",
  alternates: {
    canonical: "/resources",
  },
};

const featuredArticles = [
  {
    slug: "buying-used-appliances",
    title: "5 Things to Check When Buying a Used Appliance",
    excerpt:
      "Learn what to look for when shopping for used appliances to ensure you get a quality product that will last.",
    category: "Buying Guide",
    readTime: "4 min read",
    date: "January 2026",
    icon: Lightbulb,
  },
];

const quickTips = [
  {
    title: "Clean Your Dryer Vent",
    content:
      "Clean your dryer vent at least once a year to prevent fires and improve efficiency. A clogged vent makes your dryer work harder and use more energy.",
    icon: Leaf,
  },
  {
    title: "Check Refrigerator Seals",
    content:
      "Test your refrigerator door seal by closing the door on a dollar bill. If you can pull it out easily, the seal may need replacing.",
    icon: Lightbulb,
  },
  {
    title: "Level Your Washer",
    content:
      "An unleveled washing machine can cause excessive vibration, noise, and premature wear. Use a level to check and adjust the feet.",
    icon: Wrench,
  },
  {
    title: "Don't Overload",
    content:
      "Overloading your washer or dryer reduces cleaning effectiveness and causes extra wear on the motor and bearings.",
    icon: Lightbulb,
  },
  {
    title: "Clean Condenser Coils",
    content:
      "Vacuum your refrigerator's condenser coils every 6-12 months. Dusty coils make the compressor work harder and use more energy.",
    icon: DollarSign,
  },
  {
    title: "Use the Right Detergent",
    content:
      "High-efficiency (HE) washers require HE detergent. Regular detergent creates too many suds and can damage the machine.",
    icon: Lightbulb,
  },
];

const categories = [
  { name: "Buying Guide", count: 3 },
  { name: "Maintenance", count: 5 },
  { name: "Energy Savings", count: 4 },
  { name: "Troubleshooting", count: 6 },
  { name: "Safety", count: 2 },
];

export default function ResourcesPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary-foreground/70 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Resources & Tips
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Helpful information to make smart appliance decisions, keep your
            appliances running longer, and save money on energy costs.
          </p>
        </div>
      </div>

      {/* Featured Articles */}
      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Featured Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/resources/${article.slug}`}
                className="group"
              >
                <Card className="border border-border hover:shadow-lg hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <article.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {article.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-12 md:py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Quick Tips
          </h2>
          <p className="text-muted-foreground mb-8">
            Simple advice to keep your appliances running smoothly
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickTips.map((tip) => (
              <Card key={tip.title} className="border border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <tip.icon className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {tip.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tip.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Sidebar & More Content */}
      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                More Helpful Information
              </h2>

              <div className="space-y-6">
                <Card className="border border-border">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      When to Repair vs. Replace an Appliance
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      A common rule of thumb: if the repair costs more than
                      50% of the price of a new appliance, and your appliance
                      is more than halfway through its expected lifespan, it&apos;s
                      usually better to replace it. However, quality used
                      appliances from Roadrunner Appliance can often be a
                      cost-effective alternative to buying new.
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Average Appliance Lifespans:
                      </p>
                      <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <li>Refrigerator: 10-15 years</li>
                        <li>Washer: 10-14 years</li>
                        <li>Dryer: 10-13 years</li>
                        <li>Range: 13-15 years</li>
                        <li>Dishwasher: 9-12 years</li>
                        <li>Microwave: 9-10 years</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Why Buy Used Appliances?
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-foreground">
                            Significant Savings:
                          </strong>{" "}
                          Used appliances can cost 50-70% less than new ones.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Leaf className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-foreground">
                            Environmentally Friendly:
                          </strong>{" "}
                          Buying used keeps appliances out of landfills.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Wrench className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-foreground">
                            Proven Reliability:
                          </strong>{" "}
                          Older models have track records you can research.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-foreground">
                            Immediate Availability:
                          </strong>{" "}
                          No waiting for backorders or shipping delays.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="border border-border sticky top-32">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Browse by Category
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category.name}>
                        <span className="flex items-center justify-between py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          <span>{category.name}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {category.count}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="font-semibold text-foreground mb-3">
                      Have Questions?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We&apos;re happy to help with any appliance questions you
                      have.
                    </p>
                    <a
                      href="tel:843-536-6005"
                      className="block w-full bg-primary text-primary-foreground text-center px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Call 843-536-6005
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter/SEO Section */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-4">
            Your Local Appliance Experts
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-6">
            Roadrunner Appliance has been serving Hemingway, SC and the
            surrounding Williamsburg County area with quality used appliances
            and reliable repair services. Stop by our shop at 123 W. Broad St.
            or give us a call.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:843-536-6005"
              className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
            >
              Call 843-536-6005
            </a>
            <a
              href="https://maps.google.com/?q=123+W.+Broad+St.+Hemingway,+SC+29554"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/20 transition-colors"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
