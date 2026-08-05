import { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  ClipboardList,
  PackageSearch,
  Sparkles,
  Zap,
  Lock,
  ExternalLink,
  ChevronLeft,
  ScanSearch,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Free Appliance Tools & Guides | Road Runner Appliance",
  description:
    "Free tools and guides for appliance owners: get instant repair-vs-replace recommendations, find OEM replacement parts, and access common repair guides. From Road Runner Appliance in Hemingway, SC.",
  alternates: {
    canonical: "/tools",
  },
};

const residentTools = [
  {
    icon: Sparkles,
    title: "Appliance Match",
    description: "Answer three quick questions and get matched against current Road Runner machine inventory using live listed prices.",
    category: "Shopping",
    comingSoon: false,
    href: "/tools/appliance-match",
  },
  {
    icon: ScanSearch,
    title: "Fix It or Ditch It?",
    description: "Our most popular tool. Get an instant repair estimate, likely causes, and a clear repair-vs-replace recommendation based on real-world part costs.",
    category: "Diagnosis",
    comingSoon: false,
    href: "/tools/fix",
  },
  {
    icon: Wrench,
    title: "Common Repair Guides",
    description: "Browse typical repair costs and troubleshooting steps for washers, dryers, and refrigerators.",
    category: "Guides",
    comingSoon: false,
    href: "/service#repair-guides",
  },
  {
    icon: PackageSearch,
    title: "Replacement Part Finder",
    description: "Find likely OEM replacement parts by model number, serial number, or rating plate photo. Review likely matches and send the details to Road Runner.",
    category: "Parts",
    comingSoon: false,
    href: "/tools/part-finder",
  },
  {
    icon: ClipboardList,
    title: "Parts Catalog",
    description: "Browse part cards created by lookup and troubleshooting searches. Open each entry in the catalog listing view.",
    category: "Catalog",
    comingSoon: false,
    href: "/parts",
  },
];

const b2bTools = [
  {
    icon: Calculator,
    title: "Portfolio Deal Analyzer",
    description: "Financial modeling for ownership vs leasing across multi-unit portfolios. Ideal for landlords and property managers.",
    category: "B2B Only",
    comingSoon: false,
    href: "/tools/portfolio-appliance-deal-analyzer",
  },
];

const upcomingTools: any[] = [];

const externalResources = [
  {
    title: "Energy Star Rebate Finder",
    description: "Find rebates for energy-efficient appliances in your area.",
    href: "https://www.energystar.gov/rebate-finder",
  },
  {
    title: "Appliance Recall Information",
    description: "Check if your appliance has been recalled for safety issues.",
    href: "https://www.cpsc.gov/Recalls",
  },
  {
    title: "SC Energy Office",
    description:
      "South Carolina programs for energy efficiency and assistance.",
    href: "https://energy.sc.gov/",
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-primary py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary-foreground/70 hover:text-primary-foreground mb-4 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Helpful Tools
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl">
              Free tools and resources to help you make informed decisions when
              buying, using, and maintaining your appliances.
            </p>
          </div>
        </div>

        {/* Main Tools Grid */}
        <section className="py-12 md:py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Residential Diagnostics & Guides
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {residentTools.map((tool) => (
                <Card
                  key={tool.title}
                  className={`border border-border ${tool.comingSoon
                    ? "opacity-75"
                    : "hover:shadow-lg hover:border-blue-500/30 transition-all border-l-4 border-l-blue-500"
                    }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                        <tool.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {tool.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                      {tool.description}
                    </p>
                    <Link
                      href={tool.href}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      Use Tool <Zap size={14} />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* B2B Tools Section */}
        <section className="py-12 md:py-16 bg-slate-50 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-slate-400" /> Property Manager & Dealer Tools
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {b2bTools.map((tool) => (
                <Card key={tool.title} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <tool.icon className="h-5 w-5 text-slate-600" />
                      </div>
                      <h3 className="font-bold text-slate-800">{tool.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{tool.description}</p>
                    <Link href={tool.href} className="text-sm font-bold text-slate-900 flex items-center gap-1 hover:underline">
                      Professional Access <ArrowRight size={14} />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* External Resources */}
        <section className="py-12 md:py-16 bg-muted">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              External Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {externalResources.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="border border-border hover:shadow-lg hover:border-primary/30 transition-all h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-card-foreground">
                          {resource.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resource.description}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Employee Entrance Section */}
        <section className="py-12 md:py-16 bg-slate-50 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-blue-600 mb-3">
                  <Lock className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Internal System</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Employee Entrance</h2>
                <p className="text-slate-600 max-w-xl">
                  Log in to access internal inventory management, order processing, and technician dispatch tools.
                  Authorized personnel only.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <Link
                  href="/inventory"
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  <Lock className="h-4 w-4" />
                  Employee Login
                </Link>
                <p className="text-center text-xs text-slate-400">
                  Forgot credentials? Contact IT support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Request Tool Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-primary-foreground mb-3">
                Have a Tool Suggestion?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                We&apos;re always looking to add helpful resources. Let us know what
                tools would help you as an appliance buyer.
              </p>
              <a
                href="mailto:roadrunnerappliance@yahoo.com?subject=Tool Suggestion"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
              >
                Send Suggestion
              </a>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
