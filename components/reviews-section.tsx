import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const reviews = [
  {
    name: "James W.",
    rating: 5,
    text: "Great selection of used appliances at fair prices. LaDain was very helpful and knowledgeable. My washer has been running perfectly for 6 months now!",
    date: "2 months ago",
  },
  {
    name: "Patricia M.",
    rating: 5,
    text: "Needed a refrigerator quickly and they delivered the same day. Excellent service and the appliance works like new. Highly recommend!",
    date: "3 months ago",
  },
  {
    name: "Robert T.",
    rating: 5,
    text: "Best place in Hemingway for used appliances. They also fixed my dryer when it broke down. Fast, affordable, and honest service.",
    date: "4 months ago",
  },
];

export function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 md:py-28 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GoogleIcon className="h-8 w-8" />
            <p className="text-primary font-semibold text-sm uppercase tracking-wider">
              Google Reviews
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-6 w-6 fill-secondary text-secondary"
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">4.8</span>
            <span className="text-muted-foreground">based on customer reviews</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {reviews.map((review) => (
            <Card
              key={review.name}
              className="border border-border bg-card hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= review.rating
                          ? "fill-secondary text-secondary"
                          : "text-muted"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-4">
                  {'"'}{review.text}{'"'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{review.name}</span>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA to Leave Review */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Had a great experience? We would love to hear from you!
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <GoogleIcon className="h-5 w-5" />
              Leave a Review on Google
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
