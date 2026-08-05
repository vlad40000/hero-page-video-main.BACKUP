import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Affordable prices on quality used appliances",
  "Expert repair services for all brands",
  "Friendly, knowledgeable staff",
  "Local family-owned business",
  "Delivery services available",
  "All appliances tested before sale",
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
              About Us
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              Your Local Appliance Experts
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Roadrunner Appliance has been serving the Hemingway, South Carolina community with quality used appliances and expert repair services. Owner LaDain Pope and the team are committed to providing reliable appliances at prices that fit your budget.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Whether you need a replacement refrigerator, a new washer and dryer set, or repairs for your existing appliances, we have you covered. We service all makes and models.
            </p>

            {/* Benefits List */}
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Card */}
          <div className="relative">
            <div className="bg-primary rounded-2xl p-8 md:p-12">
              <div className="text-center">
                <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-2">
                  Owned & Operated By
                </p>
                <h3 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  LaDain Pope
                </h3>
                <div className="w-16 h-1 bg-secondary mx-auto mb-6" />
                <p className="text-primary-foreground/80 text-lg leading-relaxed">
                  Dedicated to providing quality appliances and exceptional service to our community.
                </p>
              </div>
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-secondary/20 rounded-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
