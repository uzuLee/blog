
import { CONFIG } from './config.js';
import { getAccessToken } from './auth.js';

const API_URL = 'https://api.github.com';

/**
 * A wrapper for the GitHub API fetch requests.
 * Handles authentication and common headers.
 * @param {string} endpoint The API endpoint (e.g., '/user').
 * @param {object} options The fetch options (method, body, etc.).
 * @returns {Promise<any>} The JSON response from the API.
 */
async function ghApi(endpoint, options = {}) {
    const token = getAccessToken();
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL + endpoint, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `GitHub API request failed: ${response.statusText}`);
    }

    // For 204 No Content, which is common for success but no body (e.g., delete reaction)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

/**
 * Fetches the currently authenticated user's profile.
 * @returns {Promise<object|null>} User object or null if not authenticated.
 */
export async function getUser() {
    if (!getAccessToken()) return null;
    try {
        return await ghApi('/user');
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
    }
}

/**
 * Finds the corresponding GitHub issue for a given document path.
 * @param {string} docPath The unique path of the document.
 * @returns {Promise<object|null>} The issue object or null if not found.
 */
export async function findIssueForPost(docPath) {
    const q = `repo:${CONFIG.githubUser}/${CONFIG.githubRepo} is:issue is:open in:title "${docPath}"`;
    const response = await ghApi(`/search/issues?q=${encodeURIComponent(q)}`);
    if (response.items && response.items.length > 0) {
        return response.items[0];
    }
    return null;
}

/**
 * Creates a new GitHub issue for a blog post.
 * @param {string} docPath The unique path of the document.
 * @param {string} docTitle The title of the document.
 * @returns {Promise<object>} The newly created issue object.
 */
export async function createIssue(docPath, docTitle) {
    return await ghApi(`/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/issues`, {
        method: 'POST',
        body: JSON.stringify({
            title: docPath, // Use the unique path as the issue title for reliable mapping
            body: `This issue tracks comments and reactions for the post: **${docTitle}**. Please do not edit this title.`,
            labels: ['blog-comment'],
        }),
    });
}

/**
 * Fetches comments for a given issue number.
 * @param {number} issueNumber The issue number.
 * @returns {Promise<Array>} An array of comment objects.
 */
export async function getComments(issueNumber) {
    return await ghApi(`/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/issues/${issueNumber}/comments`, {
        headers: {
            // Use a specific media type to get rendered markdown
            'Accept': 'application/vnd.github.html+json',
        }
    });
}

/**
 * Posts a new comment to an issue.
 * @param {number} issueNumber The issue number.
 * @param {string} body The markdown content of the comment.
 * @returns {Promise<object>} The newly created comment object.
 */
export async function postComment(issueNumber, body) {
    return await ghApi(`/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
        headers: {
            'Accept': 'application/vnd.github.html+json',
        }
    });
}

/**
 * Adds a reaction to an issue (liking a post).
 * @param {number} issueNumber The issue number.
 * @returns {Promise<object>} The reaction object.
 */
export async function likePost(issueNumber) {
    return await ghApi(`/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/issues/${issueNumber}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ content: '+1' }),
        headers: {
            'Accept': 'application/vnd.github.squirrel-girl-preview+json', // Required media type for reactions
        }
    });
}
