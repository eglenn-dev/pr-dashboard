import { Suspense } from "react";
import Home, { HomeSkeleton } from "./home";
import { getAssignedPRCounts } from "./actions";
import { cacheLife } from "next/cache";

async function HomeWithData() {
    "use cache";
    cacheLife("seconds");
    const { data: assignedPRCounts, approvalDays } =
        await getAssignedPRCounts();
    const fetchedAt = Date.now();
    return (
        <Home
            assignedPRCounts={assignedPRCounts}
            approvalDays={approvalDays}
            fetchedAt={fetchedAt}
        />
    );
}

export default async function HomePage() {
    return (
        <Suspense fallback={<HomeSkeleton />}>
            <HomeWithData />
        </Suspense>
    );
}
