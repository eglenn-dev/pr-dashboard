export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Home, { HomeSkeleton } from "./home";
import { getAssignedPRCounts } from "./actions";

async function HomeWithData() {
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
