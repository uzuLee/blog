export const CONFIG = {
    // --- Branding Settings ---
    // These settings personalize the look and feel of your blog.
    blogName: 'UZU Notes', // The name of your blog
    blogDescription: 'A modern wiki blog with graph visualization', // A short description
    accentColor: '#5aa2ff', // The primary accent color
    gradientColors: ['rgba(49, 130, 246, 0.08)', 'rgba(124, 58, 237, 0.06)'], // Colors for the background gradient

    // --- GitHub Settings ---
    // Configure the connection to your GitHub repository where the blog posts are stored.
    githubUser: 'uzulee',      // Your GitHub username
    githubRepo: 'posts',        // The repository for blog posts
    githubBranch: 'main',       // The branch to fetch content from

    // --- Giscus Settings ---
    // Configure giscus for comments. Get your settings at: https://giscus.app
    giscus: {
        repo: 'uzuLee/posts',              // Your repo in 'username/repo' format
        repoId: 'R_kgDOQB91cQ',            // Get from giscus.app
        category: 'Comments',               // Discussion category name
        categoryId: 'DIC_kwDOQB91cc4Cw6Cf',    // Get from giscus.app
        mapping: 'pathname',               // How to map pages to discussions
        strict: '0',                       // Use strict title matching
        reactionsEnabled: '1',             // Enable reactions
        emitMetadata: '0',                 // Emit discussion metadata
        inputPosition: 'bottom',           // Comment box position (top=작성란이 위, bottom=작성란이 아래)
        theme: 'preferred_color_scheme',   // Theme (will be set dynamically)
        lang: 'ko',                        // Language
        loading: 'lazy'                    // Loading strategy
    }
};
