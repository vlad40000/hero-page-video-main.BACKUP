import { Metadata } from "next";
import { ProductPageHeader } from "@/components/product-page-header";
import { ProductCard } from "@/components/product-card";
import { Phone } from "lucide-react";
import { getInventoryByCategory } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { productPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Appliance Packages | Roadrunner Appliance",
    description:
        "Save big with our matched appliance packages. Kitchen sets and laundry pairs available. Hemingway, SC.",
};

export default async function PackagesPage() {
    const packages = await getInventoryByCategory("packages");

    return (
        <>
            <ProductPageHeader
                title="Appliance Packages"
                description="Get a complete set for your home and save. We offer bundles on kitchen and laundry appliances."
                breadcrumb="Packages"
            />

            <section className="py-12 md:py-16 bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-muted rounded-lg p-6 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-foreground mb-1">
                                Custom Packages?
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                We can create a custom package for your specific needs. Call us for a bundle price.
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

                    {packages.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((product) => (
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
                                No packages currently available. Please check back soon or call us to build your own.
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
                </div>
            </section>
        </>
    );
}
