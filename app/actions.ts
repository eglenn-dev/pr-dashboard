"use server";
import { DashboardConfig } from "@/dashboard.config";
import {
    PullRequest,
    QueryResponse,
    ReviewedPRQueryResponse,
    ReviewedPullRequest,
} from "@/lib/types";
import { GraphQLClient, gql } from "graphql-request";

// --- GraphQL Query ---
const getPullRequestsQuery = gql`
    query GetPullRequests($owner: String!, $name: String!, $cursor: String) {
        repository(owner: $owner, name: $name) {
            pullRequests(first: 100, after: $cursor, states: [OPEN]) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    author {
                        login
                    }
                    reviewRequests(first: 20) {
                        nodes {
                            requestedReviewer {
                                ... on User {
                                    login
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

const getReviewedPullRequestsQuery = gql`
    query GetReviewedPullRequests(
        $owner: String!
        $name: String!
        $cursor: String
    ) {
        repository(owner: $owner, name: $name) {
            pullRequests(
                first: 100
                after: $cursor
                states: [OPEN, MERGED, CLOSED]
                orderBy: { field: UPDATED_AT, direction: DESC }
            ) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    number
                    updatedAt
                    author {
                        login
                    }
                    reviews(first: 100) {
                        nodes {
                            author {
                                login
                            }
                            state
                            createdAt
                        }
                    }
                }
            }
        }
    }
`;

/**
 * Retry wrapper for GraphQL requests with exponential backoff.
 * Retries on transient errors like 504, 502, 503, and network errors.
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelayMs - Initial delay in milliseconds (default: 1000)
 * @returns A promise that resolves to the operation result
 */
async function fetchWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const isLastAttempt = attempt === maxRetries;

            // Check if it's a transient error that we should retry
            const status = error?.response?.status;
            const isTransientError =
                status === 504 || // Gateway Timeout
                status === 502 || // Bad Gateway
                status === 503 || // Service Unavailable
                status === 429 || // Rate Limit
                error?.code === "ECONNRESET" || // Connection reset
                error?.code === "ETIMEDOUT" || // Connection timeout
                error?.code === "ENOTFOUND"; // DNS lookup failed

            if (!isTransientError || isLastAttempt) {
                // Non-transient error or last attempt - throw immediately
                throw error;
            }

            // Calculate exponential backoff delay
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            console.warn(
                `Transient error (${
                    status || error?.code
                }) on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    // Should never reach here, but throw last error just in case
    throw lastError;
}

/**
 * Fetches all open pull requests from the specified repository, handling pagination.
 * @param client - The GraphQL client instance.
 * @returns A promise that resolves to an array of all pull requests.
 */
async function fetchAllPullRequests(
    client: GraphQLClient
): Promise<PullRequest[]> {
    let allPullRequests: PullRequest[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
        const variables = {
            owner: DashboardConfig.REPO_OWNER,
            name: DashboardConfig.REPO_NAME,
            cursor: cursor,
        };

        try {
            const data: QueryResponse = await fetchWithRetry(async () => {
                return await client.request(getPullRequestsQuery, variables);
            });
            const { pullRequests } = data.repository;

            allPullRequests = allPullRequests.concat(pullRequests.nodes);
            hasNextPage = pullRequests.pageInfo.hasNextPage;
            cursor = pullRequests.pageInfo.endCursor;
        } catch (error) {
            console.error("Error fetching pull requests after retries:", error);
            // Stop pagination on error and return partial results
            hasNextPage = false;
        }
    }

    return allPullRequests;
}

// Reviews older than this don't affect the dashboard (see activeReviewers).
const REVIEW_LOOKBACK_DAYS = 30;
// Safety cap on pagination (100 PRs per page).
const MAX_REVIEWED_PR_PAGES = 10;

/**
 * Fetches every pull request updated within the review lookback window,
 * ordered by most recently updated. Any review inside the window bumps the
 * PR's updatedAt, so paging until we pass the cutoff captures all of them.
 * A fixed page count is not enough: bulk events (e.g. deleting old head
 * branches) bump updatedAt on many stale PRs and crowd out real activity.
 * @param client - The GraphQL client instance.
 * @returns A promise that resolves to the pull requests in the window.
 */
async function fetchReviewedPullRequests(
    client: GraphQLClient
): Promise<ReviewedPullRequest[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - REVIEW_LOOKBACK_DAYS);

    let allPullRequests: ReviewedPullRequest[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < MAX_REVIEWED_PR_PAGES; page++) {
        const variables = {
            owner: DashboardConfig.REPO_OWNER,
            name: DashboardConfig.REPO_NAME,
            cursor,
        };

        try {
            const data: ReviewedPRQueryResponse = await fetchWithRetry(
                async () => {
                    return await client.request(
                        getReviewedPullRequestsQuery,
                        variables
                    );
                }
            );
            const { pullRequests } = data.repository;
            const nodes = pullRequests.nodes;

            allPullRequests = allPullRequests.concat(nodes);

            const oldest = nodes[nodes.length - 1];
            if (
                !pullRequests.pageInfo.hasNextPage ||
                !oldest ||
                new Date(oldest.updatedAt) < cutoff
            ) {
                break;
            }
            cursor = pullRequests.pageInfo.endCursor;
        } catch (error) {
            console.error(
                "Error fetching reviewed pull requests after retries:",
                error
            );
            // Return partial results to allow app to continue
            // The retry logic has already attempted to recover from transient errors
            break;
        }
    }

    return allPullRequests;
}

export interface MergedPRMonth {
    /** Short month label, e.g. "Feb" */
    label: string;
    year: number;
    count: number;
    /** True for the current, still-in-progress month */
    isPartial: boolean;
}

const MERGED_CHART_MONTHS = 7;

/**
 * Fetches the number of merged PRs per month for the last several months.
 * Uses the GitHub search API's issueCount so each month is a single cheap
 * count query (batched into one request via aliases) with no pagination.
 */
export async function getMergedPRCountsByMonth(): Promise<MergedPRMonth[]> {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error(
            "GitHub token is not set. Please set the GITHUB_TOKEN environment variable."
        );
    }

    const client = new GraphQLClient(DashboardConfig.GITHUB_API_URL, {
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
    });

    const now = new Date();
    const months: { start: string; end: string; label: string; year: number }[] =
        [];

    for (let i = MERGED_CHART_MONTHS - 1; i >= 0; i--) {
        const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const last = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const toISODate = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                2,
                "0"
            )}-${String(d.getDate()).padStart(2, "0")}`;
        months.push({
            start: toISODate(first),
            end: toISODate(last),
            label: first.toLocaleString("en-US", { month: "short" }),
            year: first.getFullYear(),
        });
    }

    const searchBase = `repo:${DashboardConfig.REPO_OWNER}/${DashboardConfig.REPO_NAME} is:pr is:merged`;
    const query = gql`
        query MergedPRCountsByMonth {
            ${months
                .map(
                    (m, i) =>
                        `m${i}: search(query: "${searchBase} merged:${m.start}..${m.end}", type: ISSUE) { issueCount }`
                )
                .join("\n")}
        }
    `;

    try {
        const data = await fetchWithRetry<Record<string, { issueCount: number }>>(
            async () => client.request(query)
        );

        return months.map((m, i) => ({
            label: m.label,
            year: m.year,
            count: data[`m${i}`]?.issueCount ?? 0,
            isPartial: i === months.length - 1,
        }));
    } catch (error) {
        console.error("Error fetching merged PR counts after retries:", error);
        return [];
    }
}

export interface ContributionDay {
    /** Calendar date in the team's time zone, YYYY-MM-DD */
    date: string;
    count: number;
}

// Same as GitHub profiles: 52 full weeks plus the current partial week.
const HEATMAP_WEEKS = 53;
// Safety cap on pagination (100 PRs per page).
const MAX_HEATMAP_PR_PAGES = 40;
// Days are bucketed in the team's time zone (see approval window logic).
const HEATMAP_TIME_ZONE = "America/Denver";

const getMergedPullRequestsQuery = gql`
    query GetMergedPullRequests(
        $owner: String!
        $name: String!
        $cursor: String
    ) {
        repository(owner: $owner, name: $name) {
            pullRequests(
                first: 100
                after: $cursor
                states: [MERGED]
                orderBy: { field: UPDATED_AT, direction: DESC }
            ) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    mergedAt
                    updatedAt
                }
            }
        }
    }
`;

interface MergedPRQueryResponse {
    repository: {
        pullRequests: {
            pageInfo: { endCursor: string | null; hasNextPage: boolean };
            nodes: { mergedAt: string | null; updatedAt: string }[];
        };
    };
}

const toZonedISODate = new Intl.DateTimeFormat("en-CA", {
    timeZone: HEATMAP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

/**
 * Fetches the number of PRs merged per day over the last year, laid out like
 * a GitHub profile contribution graph: contiguous days starting on a Sunday
 * and ending today.
 *
 * Pages through merged PRs by most recently updated. Merging bumps updatedAt,
 * so once a page's oldest PR was last updated before the window starts, every
 * PR merged inside the window has been seen. (The search API would be cheaper
 * but caps results at 1,000, which a year of merges can exceed.)
 *
 * Returns no days if any page fails, since a partial history would render as
 * a misleadingly empty stretch of the graph.
 */
export async function getMergedPRCountsByDay(): Promise<ContributionDay[]> {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error(
            "GitHub token is not set. Please set the GITHUB_TOKEN environment variable."
        );
    }

    const client = new GraphQLClient(DashboardConfig.GITHUB_API_URL, {
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
    });

    // Work in whole calendar days (as UTC midnights) to sidestep DST.
    const today = new Date(`${toZonedISODate.format(new Date())}T00:00:00Z`);
    const start = new Date(today);
    start.setUTCDate(
        start.getUTCDate() - (HEATMAP_WEEKS - 1) * 7 - today.getUTCDay()
    );

    const counts = new Map<string, number>();
    for (
        const d = new Date(start);
        d <= today;
        d.setUTCDate(d.getUTCDate() + 1)
    ) {
        counts.set(d.toISOString().slice(0, 10), 0);
    }

    // A day early, so PRs merged early on the first local day aren't missed;
    // anything outside the grid is dropped when bucketing.
    const cutoff = new Date(start);
    cutoff.setUTCDate(cutoff.getUTCDate() - 1);

    let cursor: string | null = null;

    try {
        for (let page = 0; page < MAX_HEATMAP_PR_PAGES; page++) {
            const data: MergedPRQueryResponse = await fetchWithRetry(
                async () =>
                    client.request(getMergedPullRequestsQuery, {
                        owner: DashboardConfig.REPO_OWNER,
                        name: DashboardConfig.REPO_NAME,
                        cursor,
                    })
            );
            const { pullRequests } = data.repository;
            const nodes = pullRequests.nodes;

            for (const pr of nodes) {
                if (!pr.mergedAt) continue;
                const day = toZonedISODate.format(new Date(pr.mergedAt));
                const current = counts.get(day);
                if (current !== undefined) counts.set(day, current + 1);
            }

            const oldest = nodes[nodes.length - 1];
            if (
                !pullRequests.pageInfo.hasNextPage ||
                !oldest ||
                new Date(oldest.updatedAt) < cutoff
            ) {
                break;
            }
            cursor = pullRequests.pageInfo.endCursor;
        }
    } catch (error) {
        console.error("Error fetching merged PR history after retries:", error);
        return [];
    }

    return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

/**
 * Main function to orchestrate fetching, counting, and displaying the results.
 */
export async function getAssignedPRCounts() {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error(
            "GitHub token is not set. Please set the GITHUB_TOKEN environment variable."
        );
    }

    const client = new GraphQLClient(DashboardConfig.GITHUB_API_URL, {
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        // next: { revalidate: 120 },
    });

    const [allPullRequests, reviewedPullRequests] = await Promise.all([
        fetchAllPullRequests(client),
        fetchReviewedPullRequests(client),
    ]);

    // Timestamp of when this data was fetched. Captured here (server-side, at
    // fetch time) so it stays accurate even when the caller is a cached render.
    const fetchedAt = Date.now();

    const assignedPRsCount = new Map<string, number>();
    const approvedPRsCount = new Map<string, number>();
    const openPRsCount = new Map<string, number>();

    // Count open PRs authored by each user
    for (const pr of allPullRequests) {
        if (pr.author) {
            const login = pr.author.login;
            openPRsCount.set(login, (openPRsCount.get(login) || 0) + 1);
        }
    }

    // Track users who have reviewed PRs in the last 30 days
    const activeReviewers = new Set<string>();

    // First pass: identify active reviewers from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - REVIEW_LOOKBACK_DAYS);

    for (const pr of reviewedPullRequests) {
        for (const review of pr.reviews.nodes) {
            if (review.author) {
                const reviewDate = new Date(review.createdAt);
                const reviewerLogin = review.author.login;

                // Filter out excluded reviewers (bots, etc.)
                if (
                    DashboardConfig.EXCLUDED_REVIEWERS.includes(reviewerLogin)
                ) {
                    continue;
                }

                if (reviewDate >= thirtyDaysAgo) {
                    activeReviewers.add(reviewerLogin);
                }
            }
        }
    }

    // Initialize only active reviewers with 0 PRs
    for (const reviewer of activeReviewers) {
        assignedPRsCount.set(reviewer, 0);
        approvedPRsCount.set(reviewer, 0);
    }

    // Determine approval window: 14 days on Mondays, 7 days otherwise
    // Check if it's Monday in MST (Mountain Standard Time)
    const mstDate = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Denver" })
    );
    const isMonday = mstDate.getDay() === 1;
    const approvalDays = isMonday ? 14 : 7;

    if (allPullRequests.length === 0) {
        // Return all collaborators with 0 counts if there are no PRs
        const sortedCounts = [...assignedPRsCount.entries()].sort((a, b) =>
            a[0].localeCompare(b[0])
        );
        return {
            data: sortedCounts.map(([login, assignedCount]) => ({
                login,
                assignedCount,
                approvedCount: 0,
                openPRCount: openPRsCount.get(login) || 0,
                approvalRate: null as number | null,
            })),
            approvalDays,
            fetchedAt,
        };
    }

    // Count assigned PRs
    for (const pr of allPullRequests) {
        for (const reviewRequest of pr.reviewRequests.nodes) {
            if (reviewRequest.requestedReviewer) {
                const currentCount =
                    assignedPRsCount.get(
                        reviewRequest.requestedReviewer.login
                    ) || 0;
                assignedPRsCount.set(
                    reviewRequest.requestedReviewer.login,
                    currentCount + 1
                );
            }
        }
    }

    // Count approved PRs within the approval window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - approvalDays);

    // Use Maps of Sets to track unique PRs approved/changes-requested by each user
    const approvedPRsMap = new Map<string, Set<number>>();
    const changesRequestedPRsMap = new Map<string, Set<number>>();

    for (const pr of reviewedPullRequests) {
        const prAuthor = pr.author?.login;

        for (const review of pr.reviews.nodes) {
            if (
                (review.state === "APPROVED" ||
                    review.state === "CHANGES_REQUESTED") &&
                review.author
            ) {
                const reviewDate = new Date(review.createdAt);
                const reviewAuthor = review.author.login;

                // Check if within time window
                if (reviewDate >= cutoffDate) {
                    // Check if self-review
                    if (reviewAuthor === prAuthor) {
                        continue;
                    }

                    if (review.state === "APPROVED") {
                        if (!approvedPRsMap.has(reviewAuthor)) {
                            approvedPRsMap.set(reviewAuthor, new Set());
                        }
                        approvedPRsMap.get(reviewAuthor)!.add(pr.number);
                    } else {
                        if (!changesRequestedPRsMap.has(reviewAuthor)) {
                            changesRequestedPRsMap.set(
                                reviewAuthor,
                                new Set()
                            );
                        }
                        changesRequestedPRsMap
                            .get(reviewAuthor)!
                            .add(pr.number);
                    }
                }
            }
        }
    }
    // Convert Sets to counts
    for (const [login, prSet] of approvedPRsMap.entries()) {
        approvedPRsCount.set(login, prSet.size);
    }

    const changesRequestedPRsCount = new Map<string, number>();
    for (const [login, prSet] of changesRequestedPRsMap.entries()) {
        changesRequestedPRsCount.set(login, prSet.size);
    }

    // Combine the data and sort by assigned count (descending)
    const combinedData = [...assignedPRsCount.entries()].map(
        ([login, assignedCount]) => {
            const approved = approvedPRsCount.get(login) || 0;
            const changesRequested =
                changesRequestedPRsCount.get(login) || 0;
            const total = approved + changesRequested;
            return {
                login,
                assignedCount,
                approvedCount: approved,
                openPRCount: openPRsCount.get(login) || 0,
                approvalRate:
                    total > 0
                        ? Math.round((approved / total) * 100)
                        : null,
            };
        }
    );

    const sortedCounts = combinedData.sort(
        (a, b) => b.assignedCount - a.assignedCount
    );

    return { data: sortedCounts, approvalDays, fetchedAt };
}
