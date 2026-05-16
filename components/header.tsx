"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { LeasingRoutingModal } from "./LeasingRoutingModal";
import { Building2, Home as HomeIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function NextdoorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 7.5h-2v-3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V17h-2v-6h2v.9c.5-.8 1.4-1.4 2.5-1.4 1.93 0 3.5 1.57 3.5 3.5V17z" />
    </svg>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide header on inventory pages
  if (pathname?.startsWith('/inventory') || pathname?.startsWith('/employee/inventory')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-card shadow-md">
      {/* Top Bar with Social Links */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61588160902893&sk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-secondary transition-colors"
              >
                <FacebookIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Facebook</span>
              </a>
              <a
                href="https://nextdoor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-secondary transition-colors"
              >
                <NextdoorIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Nextdoor</span>
              </a>
            </div>
            <a
              href="tel:843-536-6005"
              className="flex items-center gap-1.5 font-medium hover:text-secondary transition-colors"
            >
              <Phone className="h-4 w-4" />
              843-536-6005
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/roadrunnerappliance-logo.png"
              alt="Road Runner Appliance Logo"
              width={100}
              height={100}
              className="h-16 w-auto"
              priority
            />
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-bold text-primary leading-none tracking-tight">
                Road Runner Appliance
              </span>
              <span className="text-sm text-muted-foreground hidden sm:block">
                Sales & Service - All Makes & Models
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                {/* What We Offer */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>What We Offer</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[600px] grid-cols-3 gap-3 p-6">
                      <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">Sales</h4>
                        <ul className="flex flex-col gap-2">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/refrigerators" className="text-sm hover:text-blue-600 transition-colors">Refrigerators</Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/washers" className="text-sm hover:text-blue-600 transition-colors">Washers</Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/dryers" className="text-sm hover:text-blue-600 transition-colors">Dryers</Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/stoves-ranges" className="text-sm hover:text-blue-600 transition-colors">Stoves & Ranges</Link>
                            </NavigationMenuLink>
                          </li>
                          <li className="flex items-center gap-2">
                            <NavigationMenuLink asChild>
                              <Link href="/sales/corporate" className="text-sm hover:text-blue-600 transition-colors">Corporate</Link>
                            </NavigationMenuLink>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">LOGIN</span>
                          </li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">Service</h4>
                        <ul className="flex flex-col gap-2">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/services#repair" className="text-sm hover:text-blue-600 transition-colors">Resident</Link>
                            </NavigationMenuLink>
                          </li>
                          <li className="flex items-center gap-2">
                            <NavigationMenuLink asChild>
                              <Link href="/services#repair" className="text-sm hover:text-blue-600 transition-colors">Corporate</Link>
                            </NavigationMenuLink>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">LOGIN</span>
                          </li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">Leasing</h4>
                        <LeasingRoutingModal
                          trigger={
                            <button className="text-left text-sm hover:text-blue-600 transition-colors py-2">
                              Explore Leasing Programs
                            </button>
                          }
                        />
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Tips & FAQ */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Tips & FAQ</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href="/faq" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            FAQ
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href="/articles" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            Articles
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Tools */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href="/tools/fix" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium">Fix It or Ditch It?</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href="/service#repair-guides" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium">Common Repair Guides</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href="/tools/part-finder" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium">Need a Spare Part?</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href="/tools/diagnostic" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium">Troubleshoot Your Issue</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/#about" className={navigationMenuTriggerStyle()}>
                      About Us
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/#contact" className={navigationMenuTriggerStyle()}>
                      Contact
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Button asChild size="lg" variant="default" className="font-bold shadow-lg">
              <Link href="/place-order">Place Order</Link>
            </Button>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
              <a href="tel:843-536-6005">Call Now</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col">
              <Link
                href="/#services"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Appliances
              </Link>
              <Link
                href="/services"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>

              <Accordion type="single" collapsible className="w-full">
                {/* What We Offer - Mobile */}
                <AccordionItem value="offer" className="border-none">
                  <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-primary hover:no-underline py-3">
                    What We Offer
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 border-none">
                    <Accordion type="single" collapsible className="w-full">
                      {/* Sales */}
                      <AccordionItem value="sales" className="border-none">
                        <AccordionTrigger className="text-xs font-bold uppercase py-2">Sales</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2 pl-4">
                          <Link href="/refrigerators" className="text-sm py-1" onClick={() => setMobileMenuOpen(false)}>Refrigerators</Link>
                          <Link href="/washers" className="text-sm py-1" onClick={() => setMobileMenuOpen(false)}>Washers</Link>
                          <Link href="/dryers" className="text-sm py-1" onClick={() => setMobileMenuOpen(false)}>Dryers</Link>
                          <Link href="/stoves-ranges" className="text-sm py-1" onClick={() => setMobileMenuOpen(false)}>Stoves & Ranges</Link>
                          <Link href="/sales/corporate" className="text-sm py-1 flex items-center justify-between" onClick={() => setMobileMenuOpen(false)}>
                            Corporate <span className="text-[10px] bg-blue-100 px-1 rounded">LOGIN</span>
                          </Link>
                        </AccordionContent>
                      </AccordionItem>
                      {/* Service */}
                      <AccordionItem value="service" className="border-none">
                        <AccordionTrigger className="text-xs font-bold uppercase py-2">Service</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2 pl-4">
                          <Link href="/services#repair" className="text-sm py-1" onClick={() => setMobileMenuOpen(false)}>Resident</Link>
                          <Link href="/services#repair" className="text-sm py-1 flex items-center justify-between" onClick={() => setMobileMenuOpen(false)}>
                            Corporate <span className="text-[10px] bg-blue-100 px-1 rounded">LOGIN</span>
                          </Link>
                        </AccordionContent>
                      </AccordionItem>
                      {/* Leasing */}
                      <AccordionItem value="leasing" className="border-none">
                        <AccordionTrigger className="text-xs font-bold uppercase py-2">Leasing</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2 pl-4">
                          <LeasingRoutingModal
                            trigger={
                              <button className="text-left text-sm py-2 hover:text-blue-600 transition-colors">
                                Explore Leasing Options
                              </button>
                            }
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>

                {/* Tips & FAQ - Mobile */}
                <AccordionItem value="tips" className="border-none">
                  <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-primary hover:no-underline py-3">
                    Tips & FAQ
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 pl-4 pb-2 border-none">
                    <Link href="/faq" className="text-sm py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
                    <Link href="/articles" className="text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Articles</Link>
                  </AccordionContent>
                </AccordionItem>

                {/* Tools - Mobile */}
                <AccordionItem value="tools" className="border-none">
                  <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-primary hover:no-underline py-3">
                    Tools
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 pl-4 pb-2 border-none">
                    <Link href="/tools/fix" className="text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Fix It or Ditch It?</Link>
                    <Link href="/service#repair-guides" className="text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Common Repair Guides</Link>
                    <Link href="/tools/part-finder" className="text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Need a Spare Part?</Link>
                    <Link href="/tools/diagnostic" className="text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Troubleshoot Your Issue</Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Link
                href="/#about"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <a
                  href="https://www.facebook.com/profile.php?id=61588160902893&sk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <FacebookIcon className="h-5 w-5" />
                  Facebook
                </a>
              </div>
              <a
                href="https://nextdoor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <NextdoorIcon className="h-5 w-5" />
                Nextdoor
              </a>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 w-full justify-center">
                <Link href="/place-order">Place Order</Link>
              </Button>
              <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 mt-2 w-full justify-center">
                <a href="tel:843-536-6005">Call 843-536-6005</a>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
