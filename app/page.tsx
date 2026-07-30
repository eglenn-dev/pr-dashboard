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

// Revalidation only happens when a request actually reaches the server, and
// this dashboard sees a handful of visits a day. Anything with an expiry
// longer than the gap between visits never gets refreshed and pins the value
// captured at build time, so keep this shorter than a typical visit interval.
async function MergedPRChartWithData() {
    "use cache";
    cacheLife("minutes");
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
