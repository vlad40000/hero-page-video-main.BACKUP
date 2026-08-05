import Link from "next/link";
import { ChevronLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductPageHeaderProps {
  title: string;
  description: string;
  breadcrumb: string;
}

export function ProductPageHeader({
  title,
  description,
  breadcrumb,
}: ProductPageHeaderProps) {
  return (
    <div className="bg-primary py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/#services"
          className="inline-flex items-center text-primary-foreground/70 hover:text-primary-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to All Products
        </Link>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
          {title}
        </h1>
        <p className="text-primary-foreground/80 text-lg max-w-2xl mb-6">
          {description}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            asChild
            size="lg"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <a href="tel:843-536-6005" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call for Availability
            </a>
          </Button>
          <p className="flex items-center text-primary-foreground/70 text-sm">
            Inventory changes frequently - call to confirm
          </p>
        </div>
      </div>
    </div>
  );
}
