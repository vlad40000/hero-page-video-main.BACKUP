'use client';

import Script from 'next/script';

export function LocalBusinessSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    "name": "Road Runner Appliance",
    "image": [
      "https://roadrunnerappliance.com/icon.png"
    ],
    "description": "Sales & Service for all makes and models of appliances in Hemingway, SC. Quality used appliances at affordable prices.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 W. Broad St.",
      "addressLocality": "Hemingway",
      "addressRegion": "SC",
      "postalCode": "29554",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 33.7529,
      "longitude": -79.4470
    },
    "url": "https://roadrunnerappliance.com",
    "telephone": "+1843-536-6005",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "09:00",
        "closes": "17:00"
      }
    ],
    "priceRange": "$$"
  };

  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData),
      }}
    />
  );
}
