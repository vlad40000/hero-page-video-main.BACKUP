import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Phone, ShieldCheck, Truck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ProductMediaSlider from "@/components/product-media-slider";
import { ProductCard } from "@/components/product-card";
import { ProductInquiryModal } from "@/components/product-inquiry-modal";
import { SoldProductLeadModal } from "@/components/sold-product-lead-modal";
import { Button } from "@/components/ui/button";
import { getInventoryByCategory, getInventoryBySlug, getShopInventory } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { categoryLabel, categoryPath, productPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/** next/image-safe src (avoid data:, blob:, "null", etc.) */
function getSafeImageSrc(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;
  const v = input.trim();
  if (!v) return fallback;

  const lower = v.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "[object object]") return fallback;

  if (v.startsWith("/") || v.startsWith("https://") || v.startsWith("http://")) return v;

  return fallback;
}

/** Convert legacy HTML blobs into readable plaintext for markdown rendering */
function htmlToMarkdownText(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(h[1-6]|li|ul|ol|div|section|article|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getInventoryBySlug(slug);

    if (!product) {
      return { title: "Product Not Found | Road Runner Appliance" };
    }

    const safeDesc = (product.seo_description || product.short_description || "").substring(0, 160);
    const firstImg = product.images?.[0];
    const metaImageSrc = getSafeImageSrc(firstImg, "");
    const metaImages = metaImageSrc ? [metaImageSrc] : [];
    const safeTitle = `${product.seo_title || product.brand || "Product"} | Road Runner Appliance`;

    return {
      title: safeTitle,
      description: safeDesc,
      alternates: {
        canonical: `/products/${slug}`,
      },
      openGraph: {
        title: product.seo_title || product.brand || "Road Runner Appliance",
        description: safeDesc,
        images: metaImages,
      },
    };
  } catch (error) {
    console.error("METADATA ERROR:", error);
    return {
      title: "Road Runner Appliance",
      description: "Quality Used Appliances in Hemingway, SC",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getInventoryBySlug(slug);

  if (!product) notFound();

  try {
    const fallbackImg = "/images/roadrunnerappliance-logo.png";
    const heroImg = getSafeImageSrc(product.images?.[0], fallbackImg);
    const productMedia = (product.images?.length ? product.images : [heroImg])
      .map((src) => getSafeImageSrc(src, ""))
      .filter(Boolean)
      .map((src, index) => ({
        id: `${product.id || product.slug || "product"}-${index}`,
        type: "image" as const,
        src,
        alt: `${product.brand || "Appliance"} ${product.model || ""} image ${index + 1}`.trim(),
      }));
    const sliderMedia =
      productMedia.length > 0
        ? productMedia
        : [
            {
              id: `${product.id || product.slug || "product"}-fallback`,
              type: "image" as const,
              src: heroImg,
              alt: `${product.brand || "Appliance"} ${product.model || ""} image`.trim(),
            },
          ];

    const productTitle = product.seo_title || `${product.brand || "Appliance"} ${product.model || ""}`.trim();
    const descRaw = (product.description || "").trim();
    const isSold = product.status === "sold";
    const productPriceText = formatUsd(product.price);
    const productCategoryLabel = categoryLabel(product.category);
    const productCategoryPath = categoryPath(product.category);
    const descForMarkdown =
      descRaw.startsWith("<") || /<p>|<ul>|<ol>|<li>|<br\s*\/?>/i.test(descRaw)
        ? htmlToMarkdownText(descRaw)
        : descRaw;

    const sameCategoryInventory = await getInventoryByCategory(product.category);
    const relatedProducts = sameCategoryInventory.filter((item) => item.slug !== product.slug).slice(0, 3);

    if (relatedProducts.length < 3) {
      const usedSlugs = new Set([product.slug, ...relatedProducts.map((item) => item.slug)]);
      const additionalInventory = (await getShopInventory()).filter((item) => !usedSlugs.has(item.slug));
      relatedProducts.push(...additionalInventory.slice(0, 3 - relatedProducts.length));
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.seo_title || product.brand,
      description: product.seo_description || product.short_description,
      image: heroImg.startsWith("http") ? heroImg : undefined,
      brand: {
        "@type": "Brand",
        name: product.brand,
      },
      sku: product.model,
      offers: {
        "@type": "Offer",
        url: `https://roadrunnerappliance.com/products/${product.slug}`,
        priceCurrency: "USD",
        price: Number(product.price).toFixed(2),
        itemCondition: "https://schema.org/UsedCondition",
        availability:
          product.status === "available" || product.status === "listed"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: "Road Runner Appliance",
        },
      },
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <main className="min-h-screen bg-background py-10 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={productCategoryPath}
                className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {productCategoryLabel}
              </Link>
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-sm font-bold text-primary transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Browse All Appliances
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
              <div className="space-y-4">
                <ProductMediaSlider
                  media={sliderMedia}
                  title={productTitle}
                  aspect="parts"
                  transition="fade"
                  showThumbnails
                  showArrows
                  enableZoom
                />
              </div>

              <div>
                <div className="mb-6">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                    {productCategoryLabel}
                  </p>
                  <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">{productTitle}</h1>
                  <p className="mb-4 text-xl text-muted-foreground">{product.short_description}</p>

                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        isSold ? "bg-slate-200 text-slate-700" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isSold ? "Sold" : `${product.condition} Condition`}
                    </span>
                    <span className="text-sm text-muted-foreground">Model: {product.model}</span>
                  </div>

                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">{productPriceText}</span>
                    {isSold ? <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Sold</span> : null}
                  </div>
                </div>

                {descForMarkdown ? (
                  <div className="prose prose-stone mb-8 dark:prose-invert">
                    <ReactMarkdown>{descForMarkdown}</ReactMarkdown>
                  </div>
                ) : null}

                <div className="mb-8 space-y-4 rounded-lg bg-muted/50 p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">30-Day Warranty Included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Delivery & Installation Available</span>
                  </div>
                </div>

                {isSold ? (
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">This appliance has sold</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Browse available alternatives below or ask Road Runner to watch for a similar unit.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <SoldProductLeadModal
                        productTitle={productTitle}
                        category={product.category}
                        brand={product.brand}
                        model={product.model}
                        slug={product.slug}
                      />
                      <Button size="lg" variant="outline" className="min-h-11 flex-1 text-base" asChild>
                        <a href="tel:843-536-6005" aria-label={`Call for an appliance similar to ${productTitle}`}>
                          <Phone className="mr-2 h-5 w-5" />
                          Call for Similar Inventory
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Button size="lg" className="min-h-11 flex-1 text-base sm:text-lg" asChild>
                        <a href="tel:843-536-6005" aria-label={`Call about ${productTitle}`}>
                          <Phone className="mr-2 h-5 w-5" />
                          Call About This Appliance
                        </a>
                      </Button>
                      <ProductInquiryModal
                        productTitle={productTitle}
                        category={product.category}
                        brand={product.brand}
                        model={product.model}
                        slug={product.slug}
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      Mention model {product.model} when you call so we can confirm availability quickly.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {relatedProducts.length > 0 ? (
              <section className="mt-16 border-t border-border pt-12" aria-labelledby="related-products-heading">
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                      {isSold ? "Available alternatives" : "Keep browsing"}
                    </p>
                    <h2 id="related-products-heading" className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {isSold ? `Similar ${productCategoryLabel} available now` : "You may also like"}
                    </h2>
                  </div>
                  <Link
                    href={productCategoryPath}
                    className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-sm font-extrabold text-primary transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
                  >
                    View All {productCategoryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard
                      key={relatedProduct.id}
                      name={relatedProduct.seo_title}
                      description={relatedProduct.short_description}
                      price={formatUsd(relatedProduct.price)}
                      image={relatedProduct.images[0] || "/placeholder.svg"}
                      condition={relatedProduct.condition}
                      status={relatedProduct.status}
                      brand={relatedProduct.brand}
                      model={relatedProduct.model}
                      href={productPath(relatedProduct.slug)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error("CRITICAL PAGE ERROR:", error);
    return (
      <div className="min-h-[80vh] p-10 text-center md:p-20">
        <h1 className="mb-4 text-2xl font-bold">Temporarily Unavailable</h1>
        <p className="mx-auto mb-8 max-w-md text-slate-600">
          We&apos;re experiencing a technical issue loading this product. Please try again in a moment or contact us directly.
        </p>
        <div className="mx-auto mb-8 max-w-2xl overflow-auto rounded-xl border border-red-100 bg-red-50 p-4 font-mono text-xs text-red-500">
          Error ID: {error instanceof Error ? error.message.substring(0, 100) : "Internal Data Check required"}
        </div>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/shop">Browse Inventory</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="tel:843-536-6005">Call Us</a>
          </Button>
        </div>
      </div>
    );
  }
}
