import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, ShieldCheck, Truck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ProductMediaSlider from "@/components/product-media-slider";
import { SoldProductLeadModal } from "@/components/sold-product-lead-modal";
import { Button } from "@/components/ui/button";
import { getInventoryBySlug } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";

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

  // Only allow remote http(s) or local public paths
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

// Generate Metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getInventoryBySlug(slug);

    if (!product) {
      return { title: "Product Not Found | Road Runner Appliance" };
    }

    // Truncate to avoid header bloat
    const safeDesc = (product.seo_description || product.short_description || "").substring(0, 160);

    // Never allow base64/blob/poisoned strings in OG headers
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
  try {
    const { slug } = await params;
    const product = await getInventoryBySlug(slug);

    if (!product) notFound();

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

    const descRaw = (product.description || "").trim();
    const isSold = product.status === "sold";
    const productPriceText = formatUsd(product.price);
    const descForMarkdown =
      descRaw.startsWith("<") || /<p>|<ul>|<ol>|<li>|<br\s*\/?>/i.test(descRaw)
        ? htmlToMarkdownText(descRaw)
        : descRaw;

    // JSON-LD Structured Data
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

        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/#services"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
              {/* Image */}
              <div className="space-y-4">
                <ProductMediaSlider
                  media={sliderMedia}
                  title={product.seo_title || `${product.brand || "Appliance"} ${product.model || ""}`.trim()}
                  aspect="parts"
                  transition="fade"
                  showThumbnails
                  showArrows
                  enableZoom
                />
              </div>

              {/* Details */}
              <div>
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {product.seo_title || product.brand}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-4">{product.short_description}</p>

                  <div className="flex items-center gap-4 mb-6">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${isSold ? "bg-slate-200 text-slate-700" : "bg-green-100 text-green-800"}`}>
                      {isSold ? "Sold" : `${product.condition} Condition`}
                    </span>
                    <span className="text-sm text-muted-foreground">Model: {product.model}</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-primary">{productPriceText}</span>
                    {isSold ? <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Sold</span> : null}
                  </div>

                  {isSold ? (
                    <div className="mb-6">
                      <SoldProductLeadModal
                        productTitle={product.seo_title || `${product.brand || "Appliance"} ${product.model || ""}`.trim()}
                        category={product.category}
                        brand={product.brand}
                        model={product.model}
                        slug={product.slug}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="prose prose-stone dark:prose-invert mb-8">
                  <ReactMarkdown>{descForMarkdown}</ReactMarkdown>
                </div>

                <div className="space-y-4 rounded-lg bg-muted/50 p-6 mb-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">30-Day Warranty Included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Delivery & Installation Available</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {!isSold ? (
                    <>
                      <Button size="lg" className="flex-1 text-lg" asChild>
                        <a href="tel:843-536-6005">
                          <Phone className="mr-2 h-5 w-5" />
                          Call
                        </a>
                      </Button>
                      <Button size="lg" variant="outline" className="flex-1 text-lg" asChild>
                        <Link href="/#contact">Ask a Question</Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("CRITICAL PAGE ERROR:", error);
    return (
      <div className="p-20 text-center min-h-[80vh]">
        <h1 className="text-2xl font-bold mb-4">Temporarily Unavailable</h1>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          We&apos;re experiencing a technical issue loading this specific product&apos;s data. Please try again in a moment or
          contact us directly.
        </p>
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-500 font-mono text-xs max-w-2xl mx-auto mb-8 overflow-auto">
          Error ID: {error instanceof Error ? error.message.substring(0, 100) : "Internal Data Check required"}
        </div>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="tel:843-536-6005">Call Us</a>
          </Button>
        </div>
      </div>
    );
  }
}
