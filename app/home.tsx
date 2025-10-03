import { getAssignedPRCounts } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExternalLink, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
                                    <div className="flex items-center justify-end">
                                        Approved (7d)
                                        <Tooltip>
                                            <TooltipTrigger className="inline-block ml-1">
                                                <HelpCircle
                                                    className="inline-block opacity-50"
                                                    size={16}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p>
                                                    Number of pull requests
                                                    approved by this user in the
                                                    last 7 days.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    View
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignedPRCounts.map((user) => (
                                <TableRow
                                    key={user.login}
                                    className="border-border hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell>
                                        <Avatar className="border-2 border-border">
                                            <AvatarImage
                                                src={`https://github.com/${user.login}.png`}
                                                alt={`@${user.login}`}
                                            />
                                            <AvatarFallback className="bg-muted font-mono">
                                                {user.login
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <a
                                            target="_blank"
                                            className="hover:underline underline-offset-2"
                                            href={`https://github.com/${user.login}`}
                                        >
                                            {user.login}
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-md bg-primary/10 border border-primary/20 font-mono text-sm font-semibold">
                                            {user.assignedCount}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-md bg-green-500/10 border border-green-500/20 font-mono text-sm font-semibold">
                                            {user.approvedCount}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <a
                                            target="_blank"
                                            className="inline-flex items-center gap-1 hover:underline ml-auto"
                                            href={`https://github.com/legrande-health/nomp/pulls?q=is%3Apr+is%3Aopen+user-review-requested%3A${user.login}`}
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

export function HomeSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-3xl">
                <div className="mb-8 text-center space-y-2">
                    <div className="flex justify-between items-center">
                        <div></div>
                        <div className="text-center mt-4">
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
                                    <div className="flex items-center justify-end">
                                        Approved (7d)
                                        <Tooltip>
                                            <TooltipTrigger className="inline-block ml-1">
                                                <HelpCircle
                                                    className="inline-block opacity-50"
                                                    size={16}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p>
                                                    Number of pull requests
                                                    approved by this user in the
                                                    last 7 days.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    View
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 10 }).map((_, id) => (
                                <TableRow
                                    key={id}
                                    className="border-border hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell>
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-12 ml-auto" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-12 ml-auto" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-4 w-20 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground font-mono">
                        {"["} 0 collaborators tracked {"]"}
                    </p>
                </div>
            </div>
        </div>
    );
}
