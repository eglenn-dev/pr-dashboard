import { Suspense } from "react";
import Home, { HomeSkeleton } from "./home";
import { getAssignedPRCounts, getMergedPRCountsByMonth } from "./actions";
import { cacheLife } from "next/cache";
import {
    MergedPRChart,
    MergedPRChartSkeleton,
} from "@/components/merged-pr-chart";

async function HomeWithData({ chart }: { chart: React.ReactNode }) {
    "use cache";
    cacheLife("seconds");
    const { data: assignedPRCounts, approvalDays, fetchedAt } =
        await getAssignedPRCounts();
    return (
        <Home
            assignedPRCounts={assignedPRCounts}
            approvalDays={approvalDays}
            fetchedAt={fetchedAt}
            chart={chart}
        />
    );
}

// Merged-PR history changes slowly, so it gets a much longer cache life than
// the table above it — the GitHub API is only re-queried in the background
// once an hour instead of on every page load.
async function MergedPRChartWithData() {
    "use cache";
    cacheLife("hours");
    const months = await getMergedPRCountsByMonth();
    return <MergedPRChart months={months} />;
}

export default async function HomePage() {
    return (
        <Suspense fallback={<HomeSkeleton />}>
            <HomeWithData
                chart={
                    <Suspense fallback={<MergedPRChartSkeleton />}>
                        <MergedPRChartWithData />
                    </Suspense>
                }
            />
        </Suspense>
    );
}
