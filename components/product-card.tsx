import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  name: string;
  description: string;
  price: string;
  image: string;
  condition: string;
  status?: string;
  brand?: string;
  model?: string;
  href?: string;
}

export function ProductCard({
  name,
  description,
  price,
  image,
  condition,
  status,
  brand,
  model,
  href,
}: ProductCardProps) {
  const imageContent = (
    <div className="relative aspect-square overflow-hidden bg-muted">
      <Image
        src={image || "/placeholder.svg"}
        alt={name}
        fill
        className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <div className="absolute right-3 top-3 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground shadow-sm">
        {price}
      </div>
    </div>
  );

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg">
      {href ? (
        <Link
          href={href}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          aria-label={`View ${name}`}
        >
          {imageContent}
        </Link>
      ) : (
        imageContent
      )}

      <CardContent className="flex flex-1 flex-col p-5">
        {brand ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">{brand}</p>
        ) : null}

        {href ? (
          <Link
            href={href}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <h3 className="mb-2 text-lg font-semibold text-card-foreground transition group-hover:text-primary">
              {name}
            </h3>
          </Link>
        ) : (
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">{name}</h3>
        )}

        {model ? <p className="mb-2 text-xs font-semibold text-muted-foreground">Model {model}</p> : null}

        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{description}</p>

        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
              {status === "sold" ? "Sold" : condition}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">30-day warranty</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {href ? (
              <Button size="sm" variant="outline" className="min-h-11" asChild>
                <Link href={href}>View Details</Link>
              </Button>
            ) : (
              <span />
            )}
            <Button size="sm" className="min-h-11" asChild>
              <a href="tel:843-536-6005" data-track-placement="product_card" data-track-model={model ?? name} aria-label={`Call about ${name}`}>
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
