import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface LeasingProductCardProps {
    name: string;
    description: string;
    specs: string;
    newPrice: string;
    usedPrice?: string;
    image: string;
    features: string[];
}

export function LeasingProductCard({
    name,
    description,
    specs,
    newPrice,
    usedPrice,
    image,
    features,
}: LeasingProductCardProps) {
    return (
        <Card className="overflow-hidden border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 rounded-3xl group relative">

            <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                <Image
                    src={image || "/placeholder.svg"}
                    alt={name}
                    fill
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            <CardContent className="p-8">
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors h-[4rem] flex items-center">
                        {name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 min-h-[2rem]">
                        {specs}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]">
                        {description}
                    </p>
                </div>

                <div className="space-y-2 mb-8">
                    {features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-slate-500">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="truncate">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">New</p>
                        <p className="text-xl font-bold text-slate-900">{newPrice}<span className="text-[10px] font-normal text-slate-500 ml-1">/mo</span></p>
                    </div>
                    {usedPrice && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Used</p>
                            <p className="text-xl font-bold text-slate-900">{usedPrice}<span className="text-[10px] font-normal text-slate-500 ml-1">/mo</span></p>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-slate-400 text-center mb-6">+ Applicable Sales Tax</p>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
                    Get Started
                </Button>
            </CardContent>
        </Card>
    );
}
