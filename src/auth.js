import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "./lib/prisma";
import { readUserByEmailFromInsforge } from "./lib/adminData";
import bcrypt from "bcryptjs";

// A stale AUTH_URL makes Auth.js emit redirects to a different deployment.
// trustHost is enabled, so let each deployment derive its origin from the
// request headers instead of trusting a copied environment value.
delete process.env.AUTH_URL;
delete process.env.NEXTAUTH_URL;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
// Emergency recovery is only active when explicit env credentials are configured.
// No fallback credentials — if the env is missing, recovery is simply disabled.
const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminName = process.env.ADMIN_NAME || "Site Admin";
const dbSyncTimeoutMs = 1500;

const withTimeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Database sync timed out")), ms)),
]);

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) return null;

                    const email = normalizeEmail(credentials.email);
                    const password = String(credentials.password);

                    // EMERGENCY MASTER BYPASS & RECOVERY (env-configured only)
                    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
                        const hashedPassword = await bcrypt.hash(password, 10);
                        try {
                            const recoveredUser = await withTimeout(prisma.user.upsert({
                                where: { email },
                                update: { password: hashedPassword, role: 'ADMIN' },
                                create: {
                                    email,
                                    name: adminName,
                                    password: hashedPassword,
                                    role: 'ADMIN',
                                    balance: 1000000,
                                    referralCode: 'ADMIN_RECOVERY_' + Math.floor(Math.random() * 1000)
                                }
                            }), dbSyncTimeoutMs);
                            return { id: recoveredUser.id, name: recoveredUser.name, email: recoveredUser.email, role: recoveredUser.role };
                        } catch (error) {
                            console.warn("Admin recovery DB sync failed:", error.message);
                            // Do not mint a session with a synthetic id — the panel would be
                            // half-broken. Fail the login so the user sees a clean error.
                            return null;
                        }
                    }

                    let user = null;
                    try {
                        user = await withTimeout(prisma.user.findUnique({
                            where: { email },
                        }), dbSyncTimeoutMs);
                    } catch (error) {
                        console.warn("Credentials Prisma lookup skipped:", error.message);
                        user = await readUserByEmailFromInsforge(email);
                    }

                    if (!user || !user.password) return null;

                    const isPasswordCorrect = await bcrypt.compare(
                        password,
                        user.password
                    );

                    if (!isPasswordCorrect) return null;

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                let dbUser = null;
                if (user.email) {
                    try {
                        dbUser = await readUserByEmailFromInsforge(normalizeEmail(user.email), "id,name,email,role");
                    } catch (error) {
                        console.warn("JWT user mapping failed:", error.message);
                    }
                }

                token.id = dbUser?.id || user.id;
                token.role = dbUser?.role || user.role || 'USER';
                token.name = dbUser?.name || user.name || token.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.name = token.name || session.user.name;
            }
            return session;
        },
    },
    pages: {
        signIn: "/authorize",
        error: "/authorize", // Redirect errors back to login page
    },
    trustHost: true,
});
