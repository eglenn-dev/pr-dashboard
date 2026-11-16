import { Suspense } from "react";
import Home, { HomeSkeleton } from "./home";
import {
    getAssignedPRCounts,
    getMergedPRCountsByDay,
    getMergedPRCountsByMonth,
} from "./actions";
import { cacheLife } from "next/cache";
import {
    MergedPRChart,
    MergedPRChartSkeleton,
} from "@/components/merged-pr-chart";
import {
    ContributionHeatmap,
    ContributionHeatmapSkeleton,
} from "@/components/contribution-heatmap";

async function HomeWithData({ chart }: { chart: React.ReactNode }) {
    "use cache";
    cacheLife("seconds");
    const {
        data: assignedPRCounts,
        approvalDays,
        fetchedAt,
    } = await getAssignedPRCounts();
    return (
        <Home
            assignedPRCounts={assignedPRCounts}
            approvalDays={approvalDays}
            fetchedAt={fetchedAt}
            chart={chart}
        />
    );
}

// Revalidation only happens when a request actually reaches the server, and
// this dashboard sees a handful of visits a day. Anything with an expiry
// longer than the gap between visits never gets refreshed and pins the value
// captured at build time, so keep this shorter than a typical visit interval.
async function MergedPRChartWithData() {
    "use cache";
    cacheLife("seconds");
    const months = await getMergedPRCountsByMonth();
    return <MergedPRChart months={months} />;
}

async function ContributionHeatmapWithData() {
    "use cache";
    cacheLife("seconds");
    const days = await getMergedPRCountsByDay();
    return <ContributionHeatmap days={days} />;
}

export default async function HomePage() {
    return (
        <Suspense fallback={<HomeSkeleton />}>
            <HomeWithData
                chart={
                    <div className="space-y-6">
                        <Suspense fallback={<MergedPRChartSkeleton />}>
                            <MergedPRChartWithData />
                        </Suspense>
                        <Suspense fallback={<ContributionHeatmapSkeleton />}>
                            <ContributionHeatmapWithData />
                        </Suspense>
                    </div>
                }
            />
        </Suspense>
    );
}
