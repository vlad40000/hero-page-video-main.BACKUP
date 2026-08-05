'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Product Page Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
                <h2 className="text-2xl font-bold text-red-900 mb-2">Notice</h2>
                <p className="text-red-700 mb-6">
                    There was a temporary issue loading this product. Our team has been notified.
                </p>
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => reset()}
                        variant="default"
                        className="w-full"
                    >
                        Try Refreshing
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="w-full"
                    >
                        <Link href="/">Browse All Inventory</Link>
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 pt-8 border-t border-red-100 text-left">
                        <p className="text-[10px] font-mono text-red-500 overflow-auto max-h-32">
                            {error.message}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
