'use client';

import { signOut } from 'next-auth/react';

// NextAuth resolves callback URLs against AUTH_URL, which may point at a
// different deployment. Clear the session without its redirect and then
// navigate within the current origin.
export async function signOutToLogin() {
    try {
        await signOut({ redirect: false, callbackUrl: '/authorize' });
    } finally {
        window.location.replace('/authorize');
    }
}
