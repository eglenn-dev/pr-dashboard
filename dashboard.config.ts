/**
 * Dashboard configuration settings.
 * Adjust these settings to customize the dashboard behavior.
 * You can also modify the EXCLUDED_REVIEWERS list to fit your team's needs.
 */

export const DashboardConfig = {
    // GitHub API endpoint
    GITHUB_API_URL: "https://api.github.com/graphql",

    // GitHub repository details
    REPO_OWNER: "legrande-health",
    REPO_NAME: "nomp",

    // List of reviewers to exclude from the dashboard
    EXCLUDED_REVIEWERS: ["copilot-pull-request-reviewer"],

    // Dashboard home page settings
    home: {
        title: "NOMP_PR_DASHBOARD",
        description: "Created by Ethan Glenn",
    },

    // Utility function to generate PR URL for a given username
    pullRequestBaseURL: (username: string) =>
        `https://github.com/${DashboardConfig.REPO_OWNER}/${DashboardConfig.REPO_NAME}/pulls?q=is%3Apr+is%3Aopen+user-review-requested%3A${username}`,
};
