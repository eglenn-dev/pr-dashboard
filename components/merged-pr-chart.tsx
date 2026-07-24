import type { MergedPRMonth } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";

const WIDTH = 680;
const HEIGHT = 280;
const PAD = { top: 36, right: 28, bottom: 32, left: 52 };

/** Round a raw maximum up to a "nice" axis ceiling (1/2/2.5/5 x 10^n). */
function niceCeil(value: number): number {
    if (value <= 5) return 5;
    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    for (const m of [1, 2, 2.5, 5, 10]) {
        if (value <= m * pow) return m * pow;
    }
    return 10 * pow;
}

interface MergedPRChartProps {
    months: MergedPRMonth[];
}

export function MergedPRChart({ months }: MergedPRChartProps) {
    if (months.length === 0) {
        return (
            <ChartCard>
                <p className="py-12 text-center text-xs text-muted-foreground font-mono">
                    {">"} Unable to load merged PR history
                </p>
            </ChartCard>
        );
    }

    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const yMax = niceCeil(Math.max(...months.map((m) => m.count)));
    const xStep = months.length > 1 ? plotW / (months.length - 1) : 0;

    const points = months.map((m, i) => ({
        ...m,
        x: PAD.left + i * xStep,
        y: PAD.top + plotH - (m.count / yMax) * plotH,
    }));

    // Solid line through complete months, dashed segment into the partial one
    const solidPoints = points.filter((p) => !p.isPartial);
    const solidPath = solidPoints
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");
    const partial = points.find((p) => p.isPartial);
    const lastSolid = solidPoints[solidPoints.length - 1];

    const yTicks = Array.from({ length: 5 }, (_, i) => {
        const value = (yMax / 4) * i;
        return {
            value,
            y: PAD.top + plotH - (value / yMax) * plotH,
        };
    });

    return (
        <ChartCard>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full h-auto"
                role="img"
                aria-label="Merged pull requests per month"
            >
                {/* Gridlines + y-axis labels */}
                {yTicks.map((tick) => (
                    <g key={tick.value}>
                        <line
                            x1={PAD.left}
                            x2={WIDTH - PAD.right}
                            y1={tick.y}
                            y2={tick.y}
                            className="stroke-border"
                            strokeDasharray="3 4"
                            strokeWidth={1}
                        />
                        <text
                            x={PAD.left - 8}
                            y={tick.y + 3.5}
                            textAnchor="end"
                            className="fill-muted-foreground font-mono text-[10px]"
                        >
                            {tick.value.toLocaleString()}
                        </text>
                    </g>
                ))}

                {/* Line */}
                <path
                    d={solidPath}
                    fill="none"
                    className="stroke-blue-500"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {partial && lastSolid && (
                    <line
                        x1={lastSolid.x}
                        y1={lastSolid.y}
                        x2={partial.x}
                        y2={partial.y}
                        className="stroke-blue-500"
                        strokeWidth={2}
                        strokeDasharray="6 5"
                        strokeLinecap="round"
                    />
                )}

                {/* Points, value pills, and month labels */}
                {points.map((p) => {
                    const label = p.count.toLocaleString();
                    const pillW = label.length * 7 + 16;
                    const pillH = 20;
                    // Keep pills clear of the y-axis labels and the right edge
                    const pillX = Math.min(
                        Math.max(p.x - pillW / 2, PAD.left - 8),
                        WIDTH - pillW - 2
                    );
                    return (
                        <g key={`${p.label}-${p.year}`}>
                            <title>
                                {`${p.label} ${p.year}: ${label} merged PRs${
                                    p.isPartial ? " (month in progress)" : ""
                                }`}
                            </title>
                            {/* Invisible wide hit target for the native tooltip */}
                            <rect
                                x={p.x - xStep / 2}
                                y={PAD.top - 24}
                                width={xStep || WIDTH}
                                height={plotH + 24}
                                fill="transparent"
                            />
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={4}
                                className={
                                    p.isPartial
                                        ? "fill-background stroke-blue-500"
                                        : "fill-blue-500 stroke-background"
                                }
                                strokeWidth={2}
                            />
                            <rect
                                x={pillX}
                                y={p.y - pillH - 9}
                                width={pillW}
                                height={pillH}
                                rx={5}
                                className={
                                    p.isPartial
                                        ? "fill-blue-500/10 stroke-blue-500/30"
                                        : "fill-blue-500"
                                }
                            />
                            <text
                                x={pillX + pillW / 2}
                                y={p.y - pillH / 2 - 5}
                                textAnchor="middle"
                                className={`font-mono text-[11px] font-semibold ${
                                    p.isPartial
                                        ? "fill-foreground"
                                        : "fill-white"
                                }`}
                            >
                                {label}
                            </text>
                            <text
                                x={p.x}
                                y={HEIGHT - 10}
                                textAnchor="middle"
                                className="fill-muted-foreground font-mono text-[10px] uppercase tracking-wider"
                            >
                                {p.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <p className="pb-4 text-center text-xs text-muted-foreground font-mono">
                {">"} Dashed segment: current month in progress
            </p>
        </ChartCard>
    );
}

function ChartCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Merged pull requests / month
                </h2>
            </div>
            <div className="px-4">{children}</div>
        </div>
    );
}

export function MergedPRChartSkeleton() {
    return (
        <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Merged pull requests / month
                </h2>
            </div>
            <div className="px-6 pb-6 pt-2">
                <Skeleton className="h-56 w-full" />
            </div>
        </div>
    );
}
