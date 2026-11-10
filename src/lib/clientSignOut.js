'use client';

// NextAuth resolves sign-out redirects against AUTH_URL, which may point at a
// different deployment. Clear the session with a manual POST that ignores the
// server redirect, then navigate within the current origin.
export async function signOutToLogin() {
    try {
        const response = await fetch('/api/auth/csrf', { cache: 'no-store' });
        const { csrfToken } = await response.json();
        await fetch('/api/auth/signout', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ csrfToken, callbackUrl: '/authorize' }).toString(),
            redirect: 'manual',
            cache: 'no-store',
        });
    } catch (error) {
        console.error('Sign out failed:', error);
    } finally {
        window.location.replace('/authorize');
    }
}
