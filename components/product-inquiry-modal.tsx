"use client";

import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { LoadingLogo } from "@/components/LoadingLogo";
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

interface ProductInquiryModalProps {
  productTitle: string;
  category: string;
  brand?: string;
  model?: string;
  slug: string;
}

export function ProductInquiryModal({
  productTitle,
  category,
  brand,
  model,
  slug,
}: ProductInquiryModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim() && !phone.trim()) {
      setError("Enter a phone number or email so we can answer you.");
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
          symptoms: question.trim() || `Interested in ${productTitle}`,
          metadata: {
            name: name.trim() || undefined,
            source: "available_product_inquiry_modal",
            productTitle,
            productSlug: slug,
            productPath: `/products/${slug}`,
            model,
          },
        }),
      });

      if (!response.ok) throw new Error("Product inquiry failed");

      setMessage("Question sent. Road Runner Appliance will follow up with you.");
      setName("");
      setEmail("");
      setPhone("");
      setQuestion("");
    } catch (submitError) {
      console.error("Product inquiry failed:", submitError);
      setError("Could not send the question. Please call 843-536-6005.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="min-h-11 flex-1 text-base sm:text-lg">
          <MessageSquareText className="mr-2 h-5 w-5" />
          Ask About This Appliance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ask about this appliance</DialogTitle>
          <DialogDescription>
            Your question will include the appliance model automatically. For fastest help, call 843-536-6005.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-inquiry-name">Name</Label>
            <Input
              id="product-inquiry-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-inquiry-phone">Phone</Label>
              <Input
                id="product-inquiry-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-inquiry-email">Email</Label>
              <Input
                id="product-inquiry-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-inquiry-question">Question</Label>
            <Textarea
              id="product-inquiry-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder={`Ask about ${brand || "this appliance"} ${model || ""}`.trim()}
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

          <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full">
            {isSubmitting ? (
              <LoadingLogo size={18} label="Sending question" className="mr-2" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Question
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
