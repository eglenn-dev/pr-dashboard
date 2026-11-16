import type { ContributionDay } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const PAD = { top: 20, left: 32 };
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

// Index = intensity level (0 = nothing merged). Fill classes for the SVG cells,
// background classes for the HTML legend; both must stay in sync.
const LEVEL_FILL = [
    "fill-muted",
    "fill-green-500/30",
    "fill-green-500/55",
    "fill-green-500/80",
    "fill-green-500",
];
const LEVEL_BG = [
    "bg-muted",
    "bg-green-500/30",
    "bg-green-500/55",
    "bg-green-500/80",
    "bg-green-500",
];

/**
 * GitHub-style intensity buckets: quartiles of the non-zero days, so a few
 * very busy days don't wash out the rest of the graph.
 */
function levelThresholds(days: ContributionDay[]): number[] {
    const nonZero = days
        .map((d) => d.count)
        .filter((c) => c > 0)
        .sort((a, b) => a - b);
    if (nonZero.length === 0) return [0, 0, 0];
    const at = (q: number) =>
        nonZero[Math.min(nonZero.length - 1, Math.floor(q * nonZero.length))];
    return [at(0.25), at(0.5), at(0.75)];
}

function levelFor(count: number, thresholds: number[]): number {
    if (count === 0) return 0;
    const idx = thresholds.findIndex((t) => count <= t);
    return idx === -1 ? 4 : idx + 1;
}

/** Parse a YYYY-MM-DD string as a calendar date (UTC midnight). */
function parseDay(date: string): Date {
    return new Date(`${date}T00:00:00Z`);
}

const tooltipDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
});
const monthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
});

export function ContributionHeatmap({ days }: { days: ContributionDay[] }) {

    if (days.length === 0) {
        return (
            <HeatmapCard>
                <p className="py-12 text-center text-xs text-muted-foreground font-mono">
                    {">"} Unable to load merged PR history
                </p>
            </HeatmapCard>
        );
    }

    const thresholds = levelThresholds(days);
    const total = days.reduce((sum, d) => sum + d.count, 0);
    const weeks = Math.ceil(days.length / 7);
    const width = PAD.left + weeks * STEP;
    const height = PAD.top + 7 * STEP;

    // Label a column when its first day starts a new month, skipping labels
    // that would collide with the previous one (e.g. a partial first week).
    const monthLabels: { x: number; label: string }[] = [];
    let prevMonth = -1;
    let prevCol = -Infinity;
    for (let col = 0; col < weeks; col++) {
        const month = parseDay(days[col * 7].date).getUTCMonth();
        if (month !== prevMonth) {
            if (col - prevCol >= 3) {
                monthLabels.push({
                    x: PAD.left + col * STEP,
                    label: monthLabel.format(parseDay(days[col * 7].date)),
                });
                prevCol = col;
            }
            prevMonth = month;
        }
    }

    return (
        <HeatmapCard>
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[600px]"
                    role="img"
                    aria-label="Merged pull requests per day over the last year"
                >
                    {monthLabels.map((m) => (
                        <text
                            key={`${m.label}-${m.x}`}
                            x={m.x}
                            y={PAD.top - 8}
                            className="fill-muted-foreground font-mono text-[9px]"
                        >
                            {m.label}
                        </text>
                    ))}

                    {WEEKDAY_LABELS.map(
                        (label, row) =>
                            label && (
                                <text
                                    key={label}
                                    x={PAD.left - 6}
                                    y={PAD.top + row * STEP + CELL - 2}
                                    textAnchor="end"
                                    className="fill-muted-foreground font-mono text-[9px]"
                                >
                                    {label}
                                </text>
                            )
                    )}

                    {days.map((day, i) => {
                        const col = Math.floor(i / 7);
                        const row = i % 7;
                        const merged = `${day.count.toLocaleString()} merged ${
                            day.count === 1 ? "PR" : "PRs"
                        }`;
                        return (
                            <rect
                                key={day.date}
                                x={PAD.left + col * STEP}
                                y={PAD.top + row * STEP}
                                width={CELL}
                                height={CELL}
                                rx={2}
                                className={
                                    LEVEL_FILL[levelFor(day.count, thresholds)]
                                }
                            >
                                <title>{`${merged} on ${tooltipDate.format(
                                    parseDay(day.date)
                                )}`}</title>
                            </rect>
                        );
                    })}
                </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 pt-2 px-2 text-xs text-muted-foreground font-mono">
                <span>
                    {">"} {total.toLocaleString()} PRs merged in the last year
                </span>
                <span className="flex items-center gap-1">
                    Less
                    {LEVEL_BG.map((cls) => (
                        <span
                            key={cls}
                            className={`inline-block size-[11px] rounded-[2px] ${cls}`}
                        />
                    ))}
                    More
                </span>
            </div>
        </HeatmapCard>
    );
}

function HeatmapCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Merged pull requests / day
                </h2>
            </div>
            <div className="px-4">{children}</div>
        </div>
    );
}

export function ContributionHeatmapSkeleton() {
    return (
        <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Merged pull requests / day
                </h2>
            </div>
            <div className="px-6 pb-6 pt-2">
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
}
