export function LocalBusinessSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'HomeGoodsStore',
    '@id': 'https://roadrunnerappliance.com/#business',
    name: 'Road Runner Appliance',
    url: 'https://roadrunnerappliance.com',
    logo: 'https://roadrunnerappliance.com/road-runner-logo.png',
    image: ['https://roadrunnerappliance.com/road-runner-logo.png'],
    description:
      'Sales and service for all makes and models of appliances in Hemingway, SC. Quality used appliances at affordable prices.',
    telephone: '+1843-536-6005',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 W. Broad St.',
      addressLocality: 'Hemingway',
      addressRegion: 'SC',
      postalCode: '29554',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.7529,
      longitude: -79.447,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
  };

  return (
    <script
      id="local-business-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
