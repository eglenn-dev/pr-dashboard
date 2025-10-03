export const dynamic = "force-dynamic";
import { getAssignedPRCounts } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExternalLink, HelpCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

export default async function Home() {
    const assignedPRCounts = await getAssignedPRCounts();
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-3xl">
                <div className="mb-8 text-center space-y-2">
                    <div className="flex justify-between items-center">
                        <div></div>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold font-mono tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                NOMP_PR_DASHBOARD
                            </h1>
                            <p className="text-sm text-muted-foreground font-mono">
                                {">"} Monitoring assigned pull requests
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
                    <Table>
                        <TableCaption className="font-mono text-xs py-4">
                            {">"} Active collaborators and PR assignments
                        </TableCaption>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="w-[80px] font-mono text-xs uppercase tracking-wider">
                                    Avatar
                                </TableHead>
                                <TableHead className="font-mono text-xs uppercase tracking-wider">
                                    Username
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider flex items-center justify-end">
                                    Assigned
                                    <Tooltip>
                                        <TooltipTrigger className="inline-block ml-1">
                                            <HelpCircle
                                                className="inline-block opacity-50"
                                                size={16}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>
                                                Number of open pull requests
                                                assigned to this user for
                                                review.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    View
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignedPRCounts.map(([login, count]) => (
                                <TableRow
                                    key={login}
                                    className="border-border hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell>
                                        <Avatar className="border-2 border-border">
                                            <AvatarImage
                                                src={`https://github.com/${login}.png`}
                                                alt={`@${login}`}
                                            />
                                            <AvatarFallback className="bg-muted font-mono">
                                                {login.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <a
                                            target="_blank"
                                            className="hover:underline underline-offset-2"
                                            href={`https://github.com/${login}`}
                                        >
                                            {login}
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-md bg-primary/10 border border-primary/20 font-mono text-sm font-semibold">
                                            {count}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <a
                                            target="_blank"
                                            className="inline-flex items-center gap-1 hover:underline ml-auto"
                                            href={`https://github.com/legrande-health/nomp/pulls?q=is%3Apr+is%3Aopen+user-review-requested%3A${login}`}
                                            rel="noreferrer"
                                        >
                                            View PRs
                                            <ExternalLink
                                                className="opacity-50"
                                                size={12}
                                            />
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground font-mono">
                        {"["} {assignedPRCounts.length} collaborators tracked{" "}
                        {"]"}
                    </p>
                </div>
            </div>
        </div>
    );
}
