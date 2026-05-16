"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SoldProductLeadModalProps {
  productTitle: string;
  category: string;
  brand?: string;
  model?: string;
  slug: string;
}

export function SoldProductLeadModal({
  productTitle,
  category,
  brand,
  model,
  slug,
}: SoldProductLeadModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim() && !phone.trim()) {
      setError("Enter a phone number or email so we can follow up.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          intentType: "BUY",
          applianceCategory: category,
          brand,
          symptoms: notes.trim() || `Interested in a similar item to ${productTitle}`,
          metadata: {
            name: name.trim() || undefined,
            source: "sold_product_similar_item_modal",
            soldProductTitle: productTitle,
            soldProductSlug: slug,
            model,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Lead capture failed");
      }

      setMessage("Request sent. We will follow up when a similar unit is available.");
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch (submitError) {
      console.error("Similar item lead failed:", submitError);
      setError("Could not send the request. Please call 843-536-6005.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1 text-lg">
          Interested in a Similar Item?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Find a similar appliance</DialogTitle>
          <DialogDescription>
            This unit is sold. Send your contact info and we will watch for a similar replacement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="similar-name">Name</Label>
            <Input
              id="similar-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="similar-phone">Phone</Label>
              <Input
                id="similar-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="similar-email">Email</Label>
              <Input
                id="similar-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="similar-notes">What are you looking for?</Label>
            <Textarea
              id="similar-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder={`${brand || "Appliance"} ${model || ""}`.trim()}
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
