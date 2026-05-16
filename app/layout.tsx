import React from "react"
import Script from "next/script"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from 'sonner';
import { LocalBusinessSchema } from "@/components/local-business-schema"
import { SiteHeader } from "@/components/SiteHeader"
import { Footer } from "@/components/footer"

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL('https://roadrunnerappliance.com'),
    title: {
        default: 'Road Runner Appliance | Used Appliance Sales & Service | Hemingway, SC',
        template: '%s | Road Runner Appliance'
    },
    description: 'Roadrunner Appliance offers quality used appliance sales and expert repair service for all makes and models in Hemingway, SC. Washer, dryers, refrigerators, and more.',
    keywords: ['Appliance Repair', 'Used Appliances', 'Hemingway SC', 'Washer Repair', 'Dryer Repair', 'Refrigerator Repair', 'Appliance Store'],
        icons: {
        icon: [
            {
                url: '/road-runner-logo.png',
                sizes: 'any',
                type: 'image/png',
            },
            {
                url: '/road-runner-logo.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
        apple: '/road-runner-logo.png',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`font-sans antialiased`}>
                <LocalBusinessSchema />
                <div className="min-h-screen flex flex-col">
                    <SiteHeader />
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                </div>
                <Toaster position="top-center" richColors />
                <Analytics />
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-P206BQ1SEC"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-P206BQ1SEC');
                    `}
                </Script>
            </body>
        </html>
    )
}
