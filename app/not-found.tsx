import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold font-mono tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            404
                        </h1>
                        <p className="text-sm text-muted-foreground font-mono">
                            {">"} Not Found
                        </p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Could not find the requested resource.
                        </p>
                        <Button asChild className="w-full" variant="default">
                            <Link href="/">
                                <Home className="w-4 h-4" />
                                Return Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
