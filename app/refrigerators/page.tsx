import { Metadata } from "next";
import { ProductPageHeader } from "@/components/product-page-header";
import { ProductCard } from "@/components/product-card";
import { Phone } from "lucide-react";
import { getInventoryByCategory } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { productPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Used Refrigerators for Sale | Road Runner Appliance",
  description:
    "Shop quality used refrigerators and freezers in Hemingway, SC. French door, side-by-side, and top-freezer models from top brands. All tested and guaranteed.",
  alternates: {
    canonical: "/refrigerators",
  },
};

export default async function RefrigeratorsPage() {
  const refrigerators = await getInventoryByCategory("refrigerators");

  return (
    <>
      <ProductPageHeader
        title="Used Refrigerators"
        description="Browse our selection of quality used refrigerators. We carry all major brands including Samsung, LG, Whirlpool, GE, and more."
        breadcrumb="Refrigerators"
      />

      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Info Banner */}
          <div className="bg-muted rounded-lg p-6 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                Looking for something specific?
              </h2>
              <p className="text-muted-foreground text-sm">
                Our inventory changes frequently. Call us to check availability
                or let us know what you need.
              </p>
            </div>
            <a
              href="tel:843-536-6005"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Phone className="h-4 w-4" />
              843-536-6005
            </a>
          </div>

          {/* Product Grid */}
          {refrigerators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {refrigerators.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.seo_title}
                  description={product.short_description}
                  price={formatUsd(product.price)}
                  image={product.images[0] || "/placeholder.svg"}
                  condition={product.condition}
                  status={product.status}
                  brand={product.brand}
                  href={productPath(product.slug)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No refrigerators currently in stock. Please check back soon or call us to inquire about incoming inventory.
              </p>
              <a
                href="tel:843-536-6005"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call 843-536-6005
              </a>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-2">
              All appliances are tested and inspected before sale.
            </p>
            <p className="text-sm text-muted-foreground">
              Delivery available in the Hemingway, SC area.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
