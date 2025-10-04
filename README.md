<div align="center">
    <h1>PR Dashboard</h1>
    <p>A Next.js-based dashboard for monitoring pull request reviews in a given repository.</p>
    <p>
        <img alt="Next.js" src="https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js&logoColor=white" />
        <img alt="React" src="https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=white" />
        <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
        <img alt="Tailwind CSS" src="https://img.shields.io/badge/-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
        <img alt="Vercel" src="https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
        <img alt="shadcn/ui" src="https://img.shields.io/badge/-shadcn%2Fui-111827?style=flat-square&logo=shadcnui&logoColor=white" />
    </p>
</div>

## Features

-   View open pull requests requiring review
-   Filter by reviewer
-   Exclude specific reviewers (e.g., automated reviewers)
-   Dark/light theme support

## Prerequisites

-   Node.js (version 18 or higher)
-   npm or yarn
-   A GitHub Personal Access Token with repository read access

## Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/eglenn-dev/pr-dashboard.git
    cd pr-dashboard
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    - Copy the sample environment file:
        ```bash
        cp sample.env .env
        ```
    - Edit `.env` and replace `your_github_token_here` with your actual GitHub Personal Access Token.
        - To create a GitHub token, go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/personal-access-tokens) and generate a new token with `repo` scope.

4. **Configure the dashboard:**

    - Open `dashboard.config.ts` and update the following settings:
        - `REPO_OWNER`: Set to your GitHub repository owner (e.g., "legrande-health")
        - `REPO_NAME`: Set to your repository name (e.g., "nomp")
        - `EXCLUDED_REVIEWERS`: Add any reviewers you want to exclude from the dashboard (default: ["copilot-pull-request-reviewer"])
        - Optionally, update the `home.title` and `home.description` if desired.

5. **Run the development server:**

    ```bash
    npm run dev
    ```

6. **Open your browser:**
    - Navigate to [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Available Scripts

-   `npm run dev` - Start the development server with Turbopack
-   `npm run build` - Build the application for production
-   `npm run start` - Start the production server

## Technologies Used

-   [Next.js](https://nextjs.org) - React framework
-   [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
-   [shadcn/ui](https://ui.shadcn.com) - Component library
-   [GraphQL](https://graphql.org) - Query language for APIs
-   [GitHub API](https://docs.github.com/en/rest) - For fetching PR data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and created by [Ethan Glenn](https://ethanglenn.dev).
