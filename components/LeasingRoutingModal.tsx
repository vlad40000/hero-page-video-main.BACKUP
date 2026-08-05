'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Home } from "lucide-react";

interface LeasingRoutingModalProps {
    trigger: React.ReactNode;
}

export function LeasingRoutingModal({ trigger }: LeasingRoutingModalProps) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    const handleRoute = (path: string) => {
        setOpen(false);
        router.push(path);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center text-slate-900 mt-4 mb-2">
                        I am Interested in Leasing for
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-6">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-blue-600 hover:bg-blue-50 transition-all border-slate-100"
                        onClick={() => handleRoute('/leasing')}
                    >
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <span className="font-bold text-slate-900">As a Property Manager</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-emerald-600 hover:bg-emerald-50 transition-all border-slate-100"
                        onClick={() => handleRoute('/resident')}
                    >
                        <Home className="h-8 w-8 text-emerald-600" />
                        <span className="font-bold text-slate-900">For a Residential Property</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
