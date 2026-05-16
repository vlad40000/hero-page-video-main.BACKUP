"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface ProductCardProps {
  name: string;
  description: string;
  price: string;
  image: string;
  condition: string;
  status?: string;
  brand?: string;
  href?: string; // Optional link to product detail page
}

export function ProductCard({
  name,
  description,
  price,
  image,
  condition,
  status,
  brand,
  href,
}: ProductCardProps) {
  const cardContent = (
    <Card className="overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-muted">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold">
          {price}
        </div>
      </div>
      <CardContent className="p-5">
        {brand && (
          <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
            {brand}
          </p>
        )}
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {status === "sold" ? "Sold" : condition}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'tel:843-536-6005';
              }}
            >
              <Phone className="h-3.5 w-3.5" />
              Inquire
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // If href is provided, wrap the card in a Link
  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  // Otherwise, return the card as-is
  return cardContent;
}
