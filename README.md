# 💨 Aircrawl

Aircrawl provides tools for efficiently extracting website content, designed to gather rich, structured context for Large Language Models (LLMs). Whether you need to scrape a single page or crawl an entire site, Aircrawl helps you get the clean text data you need for your AI applications.

## Features

*   **Website Crawling:** Traverses all pages within the same domain as the starting URL.
*   **Text Extraction:** Focuses on extracting meaningful content, aiming to exclude boilerplate like navigation menus, footers, and ads.
*   **Simple Interface:** Easy-to-use input for providing the target URL.

## Technologies Used

This project is built with:

*   [Vite](https://vitejs.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [React](https://reactjs.org/)
*   [shadcn/ui](https://ui.shadcn.com/)
*   [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

To run Aircrawl locally, you'll need [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (or yarn) installed.

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_GIT_REPOSITORY_URL>
    cd aircrawl # Or your repository's directory name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    This will start the Vite development server, typically available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

To deploy the application to Cloudflare Pages:

1.  **Build the project:**
    ```bash
    npm run build
    ```

2.  **Deploy to Cloudflare Pages:**
    ```bash
    wrangler pages deploy dist
    ```

## How It Works

1.  Enter a valid URL of the website you want to crawl in the input field.
2.  Click "Extract Text".
3.  Aircrawl will begin fetching and processing the initial page and then discover and crawl sub-pages on the same domain.
4.  The extracted text from all crawled pages will be (intended to be) aggregated and displayed. (Note: Display/aggregation part might still be under development).
