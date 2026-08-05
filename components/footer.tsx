"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Mail, Star, User, FileText } from "lucide-react";

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

export function Footer() {
  const [partnerMenuOpen, setPartnerMenuOpen] = useState(false);

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <Image
                src="/images/roadrunnerappliance-logo.png"
                alt="Road Runner Appliance Logo"
                width={120}
                height={120}
                className="h-24 w-auto"
              />
              <div>
                <h3 className="text-2xl font-bold">Road Runner Appliance</h3>
                <p className="text-sm text-primary-foreground/70">Sales & Service - All Makes & Models</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 leading-relaxed mb-6">
              Your trusted source for quality used appliances and expert repair services in Hemingway, South Carolina.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61588160902893&sk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href="https://nextdoor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Nextdoor"
              >
                <NextdoorIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/shop"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Shop Appliances
              </Link>
              <Link
                href="/service"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Appliance Repair
              </Link>
              <Link
                href="/resources"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Resources
              </Link>
              <Link
                href="/tools"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Free Tools
              </Link>
              <Link
                href="/#about"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/#contact"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <div className="mb-8">
              <h4 className="font-semibold mb-2">Didn&apos;t find the perfect match?</h4>
              <p className="text-sm text-primary-foreground/70">
                We get new arrivals daily. Give our team a call and we&apos;ll help you find exactly what you&apos;re looking for.
              </p>
            </div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="flex flex-col gap-3">
              <a
                href="tel:843-536-6005"
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                843-536-6005
              </a>
              <a
                href="https://maps.google.com/?q=123+W.+Broad+St.+Hemingway,+SC+29554"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" />
                123 W. Broad St. Hemingway, SC 29554
              </a>
              <a
                href="mailto:roadrunnerappliance@yahoo.com"
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                roadrunnerappliance@yahoo.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            Road Runner Appliance. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://www.facebook.com/profile.php?id=61588160902893&sk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://nextdoor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              Nextdoor
            </a>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPartnerMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-foreground/20 text-primary-foreground/60 hover:text-primary-foreground hover:border-primary-foreground/40 transition-colors"
                aria-label="Open partner links"
                aria-expanded={partnerMenuOpen}
              >
                <Star className="h-4 w-4" />
              </button>
              {partnerMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-56 rounded-md border border-primary-foreground/15 bg-slate-950 p-1 text-xs font-bold uppercase tracking-widest text-slate-300 shadow-xl z-50">
                  <Link
                    href="/wholesale?tab=property"
                    className="block rounded px-3 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setPartnerMenuOpen(false)}
                  >
                    Property Managers
                  </Link>
                  <Link
                    href="/wholesale?tab=dealer"
                    className="block rounded px-3 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setPartnerMenuOpen(false)}
                  >
                    Dealers
                  </Link>
                  <Link
                    href="/forms"
                    className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setPartnerMenuOpen(false)}
                  >
                    <FileText className="h-3 w-3" /> Forms Hub
                  </Link>
                  <Link
                    href="/wholesale"
                    className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setPartnerMenuOpen(false)}
                  >
                    <User className="h-3 w-3" /> Corporate Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
