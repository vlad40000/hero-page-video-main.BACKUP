import { Phone, MapPin, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "843-536-6005",
    href: "tel:843-536-6005",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "123 W. Broad St.\nHemingway, SC 29554",
    href: "https://maps.google.com/?q=123+W.+Broad+St.+Hemingway,+SC+29554",
  },
  {
    icon: Mail,
    label: "Email",
    value: "roadrunnerappliance@yahoo.com",
    href: "mailto:roadrunnerappliance@yahoo.com",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon-Fri: 9am - 5pm",
    href: "#",
  },
];

export function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            Get In Touch
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Contact Us Today
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Ready to find your next appliance or need repair service? Give us a call or stop by our store in Hemingway.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((item) => (
            <Card
              key={item.label}
              className="border border-border bg-card hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {item.label}
                </h3>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-foreground font-medium hover:text-primary transition-colors whitespace-pre-line"
                >
                  {item.value}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8"
          >
            <a href="tel:843-536-6005" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Now: 843-536-6005
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
