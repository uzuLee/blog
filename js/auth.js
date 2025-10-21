
import { CONFIG } from './config.js';

const AUTH_STATE_KEY = 'github_auth_state';
const ACCESS_TOKEN_KEY = 'github_access_token';

// Helper function to generate a random string for the code verifier
async function generateCodeVerifier() {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    return btoa(String.fromCharCode.apply(null, randomBytes))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper function to generate the code challenge from the verifier
async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hash)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Redirects the user to the GitHub authorization page.
 */
export async function login() {
    const state = await generateCodeVerifier(); // Use a random string for state
    const codeVerifier = await generateCodeVerifier();

    sessionStorage.setItem(AUTH_STATE_KEY + '_state', state);
    sessionStorage.setItem(AUTH_STATE_KEY + '_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
        client_id: CONFIG.oauthClientId,
        redirect_uri: CONFIG.oauthCallbackUrl,
        scope: 'public_repo', // Scope to create issues and comments
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Handles the callback from GitHub, exchanges the code for an access token.
 */
export async function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    const savedState = sessionStorage.getItem(AUTH_STATE_KEY + '_state');
    const codeVerifier = sessionStorage.getItem(AUTH_STATE_KEY + '_verifier');

    if (!code || !state || !savedState || state !== savedState || !codeVerifier) {
        console.error('Invalid state or code from GitHub callback.');
        alert('Authentication failed. Please try again.');
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: CONFIG.oauthClientId,
                redirect_uri: CONFIG.oauthCallbackUrl,
                code: code,
                code_verifier: codeVerifier,
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
            window.location.href = sessionStorage.getItem('post_login_redirect') || '/';
        } else {
            throw new Error(data.error_description || 'Failed to retrieve access token.');
        }
    } catch (error) {
        console.error('Error during token exchange:', error);
        alert(`Authentication failed: ${error.message}`);
        window.location.href = '/';
    } finally {
        sessionStorage.removeItem(AUTH_STATE_KEY + '_state');
        sessionStorage.removeItem(AUTH_STATE_KEY + '_verifier');
        sessionStorage.removeItem('post_login_redirect');
    }
}

/**
 * Retrieves the access token from local storage.
 * @returns {string|null} The access token or null if not found.
 */
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Clears the access token from local storage to log the user out.
 */
export function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    location.reload();
}

/**
 * Stores the current path to redirect back to after login.
 */
export function storeRedirect() {
    sessionStorage.setItem('post_login_redirect', window.location.pathname + window.location.hash);
}
