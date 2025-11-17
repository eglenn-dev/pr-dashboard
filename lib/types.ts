export interface RequestedReviewer {
    login: string;
}

export interface ReviewRequest {
    requestedReviewer?: RequestedReviewer;
}

export interface PullRequest {
    reviewRequests: {
        nodes: ReviewRequest[];
    };
}

export interface Review {
    author: {
        login: string;
    } | null;
    state: string;
    createdAt: string;
}

export interface ReviewedPullRequest {
    number: number;
    author: {
        login: string;
    } | null;
    reviews: {
        nodes: Review[];
    };
}

export interface ReviewedPRQueryResponse {
    repository: {
        pullRequests: {
            pageInfo: PageInfo;
            nodes: ReviewedPullRequest[];
        };
    };
}

export interface PageInfo {
    endCursor: string;
    hasNextPage: boolean;
}

export interface QueryResponse {
    repository: {
        pullRequests: {
            pageInfo: PageInfo;
            nodes: PullRequest[];
        };
    };
}

export interface PageInfo {
    endCursor: string;
    hasNextPage: boolean;
}

export interface ReviewRequest {
    requestedReviewer?: {
        login: string;
    };
}

export interface PullRequest {
    reviewRequests: {
        nodes: ReviewRequest[];
    };
}

export interface PullRequestQueryResponse {
    repository: {
        pullRequests: {
            pageInfo: PageInfo;
            nodes: PullRequest[];
        };
    };
}

export interface Collaborator {
    login: string;
}

export interface CollaboratorsQueryResponse {
    repository: {
        collaborators: {
            pageInfo: PageInfo;
            nodes: Collaborator[];
        };
    };
}
