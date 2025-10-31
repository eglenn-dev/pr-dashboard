import { Suspense } from "react";
import Home, { HomeSkeleton } from "./home";
import { getAssignedPRCounts } from "./actions";
import { cacheLife, cacheTag } from "next/cache";

async function HomeWithData() {
    "use cache";
    cacheLife("minutes");
    const assignedPRCounts = await getAssignedPRCounts();
    return <Home assignedPRCounts={assignedPRCounts} />;
}

export default async function HomePage() {
    return (
        <Suspense fallback={<HomeSkeleton />}>
            <HomeWithData />
        </Suspense>
    );
}
