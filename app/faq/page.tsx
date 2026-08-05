import PlaceholderPage from "@/components/placeholder-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() { return <PlaceholderPage title="Frequently Asked Questions" />; }
