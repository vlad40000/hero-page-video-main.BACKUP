import { HeroSection } from "@/components/hero-section";
import { HomeInventorySliderSection } from "@/components/home-inventory-slider-section";
import { ServicesSection } from "@/components/services-section";
import { SelfServiceSection } from "@/components/self-service-section";
import { AboutSection } from "@/components/about-section";
import { ReviewsSection } from "@/components/reviews-section";
import { ReferralSection } from "@/components/referral-section";
import { ReferralBadge } from "@/components/referral-badge";
import { ContactSection } from "@/components/contact-section";
import { WebsiteOfferSection } from "@/components/website-offer-section";

export function HomeContent() {
  return (
    <>
      <ReferralBadge />
      <HeroSection />
      <HomeInventorySliderSection />
      <WebsiteOfferSection />
      <ServicesSection />
      <SelfServiceSection />
      <AboutSection />
      <ReviewsSection />
      <ReferralSection />
      <ContactSection />
    </>
  );
}
