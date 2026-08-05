import { Metadata } from 'next';
import { HomeContent } from "@/components/home-content";

export const metadata: Metadata = {
    title: 'Road Runner Appliance | Used Appliances & Repair | Hemingway, SC',
    description: 'Quality used washers, dryers, refrigerators, and expert appliance repair in Hemingway, SC. Road Runner Appliance — Sales & Service for all makes and models.',
    alternates: {
        canonical: '/',
    },
};

export default function Home() {
    return <HomeContent />;
}
