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

/**
 * Fetches the last 100 pull requests with reviews from the specified repository.
 * @param client - The GraphQL client instance.
 * @returns A promise that resolves to an array of the last 100 pull requests.
 */
async function fetchReviewedPullRequests(
    client: GraphQLClient
): Promise<ReviewedPullRequest[]> {
    const variables = {
        owner: DashboardConfig.REPO_OWNER,
        name: DashboardConfig.REPO_NAME,
        cursor: null,
    };

    try {
        const data: ReviewedPRQueryResponse = await fetchWithRetry(async () => {
            return await client.request(
                getReviewedPullRequestsQuery,
                variables
            );
        });
        const { pullRequests } = data.repository;

        return pullRequests.nodes;
    } catch (error) {
        console.error(
            "Error fetching reviewed pull requests after retries:",
            error
        );
        // Return empty array to allow app to continue with partial data
        // The retry logic has already attempted to recover from transient errors
        return [];
    }
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

    const assignedPRsCount = new Map<string, number>();
    const approvedPRsCount = new Map<string, number>();

    // Track users who have reviewed PRs in the last 30 days
    const activeReviewers = new Set<string>();

    // First pass: identify active reviewers from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

    // Determine approval window: 14 days on Tuesdays, 7 days otherwise
    // Check if it's Tuesday in MST (Mountain Standard Time)
    const mstDate = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Denver" })
    );
    const isTuesday = mstDate.getDay() === 2;
    const approvalDays = isTuesday ? 14 : 7;

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
            })),
            approvalDays,
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

    // Use a Map of Sets to track unique PRs approved by each user
    const approvedPRsMap = new Map<string, Set<number>>();

    for (const pr of reviewedPullRequests) {
        const prAuthor = pr.author?.login;

        for (const review of pr.reviews.nodes) {
            if (review.state === "APPROVED" && review.author) {
                const reviewDate = new Date(review.createdAt);
                const reviewAuthor = review.author.login;

                // Check if within time window
                if (reviewDate >= cutoffDate) {
                    // Check if self-approval
                    if (reviewAuthor === prAuthor) {
                        continue;
                    }

                    if (!approvedPRsMap.has(reviewAuthor)) {
                        approvedPRsMap.set(reviewAuthor, new Set());
                    }
                    // Add the PR number to the set (automatically handles duplicates)
                    approvedPRsMap.get(reviewAuthor)!.add(pr.number);
                }
            }
        }
    }
    // Convert Sets to counts
    for (const [login, prSet] of approvedPRsMap.entries()) {
        approvedPRsCount.set(login, prSet.size);
    }

    // Combine the data and sort by assigned count (descending)
    const combinedData = [...assignedPRsCount.entries()].map(
        ([login, assignedCount]) => ({
            login,
            assignedCount,
            approvedCount: approvedPRsCount.get(login) || 0,
        })
    );

    const sortedCounts = combinedData.sort(
        (a, b) => b.assignedCount - a.assignedCount
    );

    return { data: sortedCounts, approvalDays };
}
