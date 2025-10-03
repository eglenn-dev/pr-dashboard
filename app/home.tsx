"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    ExternalLink,
    HelpCircle,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
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
import { useState, useMemo } from "react";

type SortField = "assigned" | "approved" | null;
type SortDirection = "asc" | "desc";

interface UserData {
    login: string;
    assignedCount: number;
    approvedCount: number;
}

interface HomeProps {
    assignedPRCounts: UserData[];
}

export default function Home({ assignedPRCounts }: HomeProps) {
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === "desc") {
                // First click: desc -> asc
                setSortDirection("asc");
            } else {
                // Second click: asc -> remove filter
                setSortField(null);
                setSortDirection("desc");
            }
        } else {
            // Set new field with default desc direction
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortField) return assignedPRCounts;

        return [...assignedPRCounts].sort((a, b) => {
            let aValue = 0;
            let bValue = 0;

            if (sortField === "assigned") {
                aValue = a.assignedCount;
                bValue = b.assignedCount;
            } else if (sortField === "approved") {
                aValue = a.approvedCount;
                bValue = b.approvedCount;
            }

            if (sortDirection === "asc") {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }, [assignedPRCounts, sortField, sortDirection]);

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return (
                <ArrowUpDown
                    className="inline-block ml-1 opacity-30"
                    size={16}
                />
            );
        }
        return sortDirection === "asc" ? (
            <ArrowUp className="inline-block ml-1" size={16} />
        ) : (
            <ArrowDown className="inline-block ml-1" size={16} />
        );
    };
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
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort("assigned")}
                                        className="flex items-center justify-end w-full hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        Assigned
                                        {getSortIcon("assigned")}
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
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort("approved")}
                                        className="flex items-center justify-end w-full hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        Approved (7d)
                                        {getSortIcon("approved")}
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
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    View
                                    <Tooltip>
                                        <TooltipTrigger className="inline-block ml-1">
                                            <HelpCircle
                                                className="inline-block opacity-50"
                                                size={16}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>
                                                View pull requests currently
                                                assigned to this user on GitHub.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((user) => (
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
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    <div className="flex items-center justify-end w-full">
                                        Assigned
                                        <ArrowUpDown
                                            className="inline-block ml-1 opacity-30"
                                            size={14}
                                        />
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
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-mono text-xs uppercase tracking-wider">
                                    <div className="flex items-center justify-end">
                                        Approved (7d)
                                        <ArrowUpDown
                                            className="inline-block ml-1 opacity-30"
                                            size={14}
                                        />
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
                            {Array.from({ length: 8 }).map((_, id) => (
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
