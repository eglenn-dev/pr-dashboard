"use server";
import {
    CollaboratorsQueryResponse,
    PullRequest,
    QueryResponse,
} from "@/lib/types";
import { GraphQLClient, gql } from "graphql-request";

// --- Configuration ---
const GITHUB_API_URL = "https://api.github.com/graphql";
const REPO_OWNER = "legrande-health";
const REPO_NAME = "nomp";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// --- GraphQL Query ---
const getCollaboratorsQuery = gql`
    query GetCollaborators($owner: String!, $name: String!, $cursor: String) {
        repository(owner: $owner, name: $name) {
            collaborators(first: 100, after: $cursor) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    login
                }
            }
        }
    }
`;

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

/**
 * Fetches all collaborators from the specified repository, handling pagination.
 * @param client - The GraphQL client instance.
 * @returns A promise that resolves to an array of collaborator logins.
 */
async function fetchAllCollaborators(client: GraphQLClient): Promise<string[]> {
    let allCollaborators: string[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    console.log(`Fetching collaborators from ${REPO_OWNER}/${REPO_NAME}...`);

    while (hasNextPage) {
        const variables = {
            owner: REPO_OWNER,
            name: REPO_NAME,
            cursor: cursor,
        };

        try {
            const data: CollaboratorsQueryResponse = await client.request(
                getCollaboratorsQuery,
                variables
            );
            const { collaborators } = data.repository;

            if (collaborators) {
                allCollaborators = allCollaborators.concat(
                    collaborators.nodes.map((c: { login: string }) => c.login)
                );
                hasNextPage = collaborators.pageInfo.hasNextPage;
                cursor = collaborators.pageInfo.endCursor;
            } else {
                hasNextPage = false;
            }
        } catch (error) {
            console.error("Error fetching collaborators:", error);
            hasNextPage = false;
        }
    }

    console.log(`Found a total of ${allCollaborators.length} collaborators.`);
    return allCollaborators;
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

    console.log(`Fetching pull requests from ${REPO_OWNER}/${REPO_NAME}...`);

    while (hasNextPage) {
        const variables = {
            owner: REPO_OWNER,
            name: REPO_NAME,
            cursor: cursor,
        };

        try {
            const data: QueryResponse = await client.request(
                getPullRequestsQuery,
                variables
            );
            const { pullRequests } = data.repository;

            allPullRequests = allPullRequests.concat(pullRequests.nodes);
            hasNextPage = pullRequests.pageInfo.hasNextPage;
            cursor = pullRequests.pageInfo.endCursor;

            console.log(
                `Fetched a page of ${pullRequests.nodes.length} pull requests.`
            );
        } catch (error) {
            console.error("Error fetching pull requests:", error);
            // Stop pagination on error
            hasNextPage = false;
        }
    }

    console.log(
        `Found a total of ${allPullRequests.length} open pull requests.`
    );
    const prsWithReviewers = allPullRequests.filter(
        (pr) => pr.reviewRequests.nodes.length > 0
    );
    console.log(`${prsWithReviewers.length} of those have reviewers.`);

    return allPullRequests;
}

/**
 * Main function to orchestrate fetching, counting, and displaying the results.
 */
export async function getAssignedPRCounts() {
    if (!GITHUB_TOKEN) {
        throw new Error(
            "GitHub token is not set. Please set the GITHUB_TOKEN environment variable."
        );
    }

    const client = new GraphQLClient(GITHUB_API_URL, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
    });

    const [allPullRequests, allCollaborators] = await Promise.all([
        fetchAllPullRequests(client),
        fetchAllCollaborators(client),
    ]);

    const assignedPRsCount = new Map<string, number>();

    // Initialize all collaborators with 0 PRs.
    for (const collaborator of allCollaborators) {
        assignedPRsCount.set(collaborator, 0);
    }

    if (allPullRequests.length === 0) {
        // Return all collaborators with 0 counts if there are no PRs
        const sortedCounts = [...assignedPRsCount.entries()].sort((a, b) =>
            a[0].localeCompare(b[0])
        );
        return sortedCounts;
    }

    // Use a Map to store the count of assigned PRs for each user.

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

    // Sort the results for better readability
    const sortedCounts = [...assignedPRsCount.entries()].sort(
        (a, b) => b[1] - a[1]
    );

    return sortedCounts;
}
