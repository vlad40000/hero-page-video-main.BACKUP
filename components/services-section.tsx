import Link from "next/link";
import { Refrigerator, WashingMachine, Wind, Wrench, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Refrigerator,
    title: "Refrigerators",
    description: "Wide selection of quality used refrigerators in various sizes and styles.",
    href: "/refrigerators",
    isProduct: true,
  },
  {
    icon: WashingMachine,
    title: "Washers",
    description: "Reliable washing machines including top load and front load units.",
    href: "/washers",
    isProduct: true,
  },
  {
    icon: Wind,
    title: "Dryers",
    description: "Quality electric and gas dryers for all your laundry needs.",
    href: "/dryers",
    isProduct: true,
  },
  {
    icon: Wind,
    title: "Stoves & Ranges",
    description: "Gas and electric stoves and ranges for your kitchen.",
    href: "/stoves-ranges",
    isProduct: true,
  },
  {
    icon: WashingMachine,
    title: "Washer & Dryer Sets",
    description: "Save even more with our matching laundry pairs and stacked sets.",
    href: "/washer-dryer-sets",
    isProduct: true,
  },
  {
    icon: Wrench,
    title: "Appliance Repair",
    description: "Expert repair services for all makes and models of appliances.",
    href: "/service",
    isProduct: false,
  },
  {
    icon: Truck,
    title: "Delivery Available",
    description: "Convenient delivery service to get your appliances home safely.",
    href: "/service",
    isProduct: false,
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    description: "All appliances tested and inspected before sale.",
    href: "/service",
    isProduct: false,
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            What We Offer
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Sales & Service for All Makes & Models
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            From refrigerators to washing machines, we have the used appliances you need at prices you can afford.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link key={service.title} href={service.href}>
              <Card className="border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all h-full group cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center text-primary font-medium text-sm">
                    {service.isProduct ? "View Products" : "Learn More"}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
