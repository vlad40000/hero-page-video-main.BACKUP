"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { BadgePercent, Phone, Refrigerator, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function WebsiteOfferSection() {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [applianceInterest, setApplianceInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/website-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          phone,
          applianceInterest,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to submit your offer request.");
        return;
      }

      setSuccess("You are in. Mention the website at purchase for 10% off.");
      setFirstName("");
      setPhone("");
      setApplianceInterest("");
    } catch {
      setError("Unable to submit your offer request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-slate-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/60">
          <CardContent className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div className="flex flex-col justify-center">
              <Image
                src="/images/roadrunner-running.png"
                alt="Road Runner Appliance"
                width={240}
                height={160}
                unoptimized
                className="mx-auto mb-6 h-24 w-auto object-contain md:h-28"
              />
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                <BadgePercent className="h-4 w-4" />
                Website Offer
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Mention the website and get 10% off your purchase.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Leave your first name, phone number, and what kind of appliance you are looking for. When you buy, just mention you saw the website.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website-offer-first-name" className="text-slate-800">
                    First name
                  </Label>
                  <div className="relative mt-2">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="website-offer-first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="First name"
                      autoComplete="given-name"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website-offer-phone" className="text-slate-800">
                    Phone number
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="website-offer-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website-offer-appliance-interest" className="text-slate-800">
                    What kind of appliance are you looking for?
                  </Label>
                  <div className="relative mt-2">
                    <Refrigerator className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-slate-400" />
                    <Textarea
                      id="website-offer-appliance-interest"
                      value={applianceInterest}
                      onChange={(event) => setApplianceInterest(event.target.value)}
                      placeholder="Washer, dryer, refrigerator, stove, dishwasher..."
                      className="min-h-[96px] pl-9"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isSubmitting ? "Submitting..." : "Claim Website Offer"}
                </Button>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {success}
                  </div>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
