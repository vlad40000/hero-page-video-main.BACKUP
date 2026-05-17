import { Metadata } from 'next';
import AuditorInterface from './components/AuditorInterface';
import { SEOContent } from './components/SEOContent';

export const metadata: Metadata = {
    title: 'Fix It or Ditch It? | Road Runner Appliance',
    description: 'Describe your appliance symptoms and get likely causes, parts + labor costs, and a repair-or-replace recommendation in minutes. Free AI diagnostic from Road Runner Appliance.',
    alternates: {
        canonical: '/tools/fix',
    },
    openGraph: {
        title: 'Fix It or Ditch It? Appliance Repair Advisor | Road Runner Appliance',
        description: 'AI-powered appliance diagnosis and repair-vs-replace tool.',
        images: ['/images/roadrunnerappliance-logo.png'],
    }
};

export default function ApplianceAuditorPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Fix It or Ditch It',
        'description': 'AI-powered appliance diagnosis and repair cost estimator.',
        'applicationCategory': 'Utility',
        'operatingSystem': 'Web',
    };

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': 'How accurate is this appliance repair estimate?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Our estimates use real-time market data from retail part catalogs and local labor averages. While highly accurate for research, we recommend a physical inspection by a technician to confirm specific failures.'
                }
            },
            {
                '@type': 'Question',
                'name': 'Do you cover my area for service?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Road Runner Appliance provides on-site repair throughout our region! Call for details. If the tool recommends repair, and you are in our service area, you can book a tech immediately.'
                }
            },
            {
                '@type': 'Question',
                'name': 'Do you sell parts for DIY repairs?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Yes! We sell both new and used parts for most major appliance brands. Whether you\'re looking for a common belt or a specific control board, we can help you find what you need to get the job done.'
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className="fix-tool-page min-h-screen py-10 md:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <AuditorInterface />
                    <SEOContent />
                </div>
            </div>
        </>
    );
}
