export const CONFIG = {
    blogName: 'UZU Notes',
    githubUser: 'uzulee',      // Your GitHub username
    githubRepo: 'posts', // The repository for blog posts and comment issues
    githubBranch: 'main',       // The branch to fetch content from

    // --- GitHub OAuth Settings ---
    // Your GitHub OAuth App's Client ID. Create one at: https://github.com/settings/applications/new
    oauthClientId: 'Ov23liV1glCm4LnGVNTz',

    // --- OAuth Callback URL ---
    // This MUST EXACTLY MATCH the "Authorization callback URL" in your GitHub OAuth App settings.
    //
    // **OPTION 1: For GitHub Pages hosting**
    // e.g., `https://your-user.github.io/your-repo/callback.html`
    //
    // **OPTION 2: For Local Development**
    // e.g., `http://127.0.0.1:8080/callback.html`
    //
    // **OPTION 3: For Custom Domains**
    // e.g., `https://example.com/callback.html`
    //
    // **Replace the placeholder below with your actual callback URL.**
    oauthCallbackUrl: 'https://uzulee.github.io/blog/callback.html', // IMPORTANT: Replace this!
};
