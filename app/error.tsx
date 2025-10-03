"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Error({
    error,
}: {
    error: Error & { digest?: string };
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold font-mono tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Error
                        </h1>
                        <p className="text-sm text-muted-foreground font-mono">
                            {">"} Something went wrong
                        </p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            An unexpected error occurred. Please try refreshing
                            the page.
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full"
                            variant="default"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
