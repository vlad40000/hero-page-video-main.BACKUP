import { AboutSection } from "@/components/about-section";
import { ContactSection } from "@/components/contact-section";
import { HeroSection } from "@/components/hero-section";
import { HomeInventoryGridSection } from "@/components/home-inventory-grid-section";
import { HomeRepairSection } from "@/components/home-repair-section";
import { ReviewsSection } from "@/components/reviews-section";
import { WebsiteOfferSection } from "@/components/website-offer-section";
import { getShopInventory } from "@/lib/inventory";

export async function HomeContent() {
  const inventory = await getShopInventory();

  return (
    <>
      <HeroSection inventory={inventory} />
      <HomeInventoryGridSection inventory={inventory} />
      <HomeRepairSection />
      <ReviewsSection />
      <AboutSection />
      <WebsiteOfferSection />
      <ContactSection />
    </>
  );
}
