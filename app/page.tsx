export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Home, { HomeSkeleton } from "./home";

export default async function HomePage() {
    return (
        <Suspense fallback={<HomeSkeleton />}>
            <Home />
        </Suspense>
    );
}
