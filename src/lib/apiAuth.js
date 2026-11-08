import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";

export function hashToken(token) {
    return createHash("sha256").update(String(token)).digest("hex");
}

export function generateApiToken() {
    return "cp_" + randomBytes(24).toString("hex");
}

/**
 * Authenticate a request via the `token` query param (or Bearer header).
 * Returns the user record or null.
 */
export async function authenticateApiRequest(req) {
    const { searchParams } = new URL(req.url);
    let token = searchParams.get("token") || "";

    if (!token) {
        const authHeader = req.headers.get("authorization") || "";
        if (authHeader.toLowerCase().startsWith("bearer ")) {
            token = authHeader.slice(7).trim();
        }
    }

    if (!token) return null;

    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
        where: { apiToken: tokenHash },
        select: { id: true, email: true, plan: true, balance: true, allowedBots: true },
    });

    return user || null;
}
