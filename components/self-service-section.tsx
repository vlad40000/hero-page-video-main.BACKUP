import Link from "next/link";
import { Scale, Wrench, Lightbulb } from "lucide-react";

const TOOLS = [
    {
        title: "Fix It or Ditch It?",
        description: "Enter your model and serial or upload a machine plate photo to get likely causes, repair cost guidance, and a clear repair-vs-replace recommendation.",
        icon: Scale,
        href: "/tools/fix",
        color: "bg-blue-100 text-blue-600",
    },
    {
        title: "Common Repair Guides",
        description: "Browse typical repair costs and troubleshooting steps for washers, dryers, and refrigerators.",
        icon: Wrench,
        href: "/service#repair-guides",
        color: "bg-blue-100 text-blue-600",
    },
    {
        title: "Need a Spare Part?",
        description: "Looking for a specific part? We likely have it in stock or can get it for you quickly.",
        icon: Wrench,
        href: "/tools/part-finder",
        color: "bg-amber-100 text-amber-600",
    },
    {
        title: "Troubleshoot Your Issue",
        description: "Walking through a few simple questions can often save you a service call. Tell us what's happening, and we'll help you pinpoint the problem.",
        icon: Lightbulb,
        href: "/tools/diagnostic",
        color: "bg-purple-100 text-purple-600",
    },
];

export function SelfServiceSection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">
                        Not sure what to do next? <span className="text-blue-600">Try our free tools.</span>
                    </h2>
                    <p className="text-xl text-slate-600">
                        Empower yourself with our self-service tools before you even pick up the phone.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {TOOLS.map((tool, index) => (
                        <Link
                            key={index}
                            href={tool.href}
                            className="group bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                                <tool.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                                    {tool.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {tool.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
