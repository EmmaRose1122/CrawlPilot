import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readUserByIdFromInsforge, withPrismaFallback } from "@/lib/adminData";
import { validatePublicHttpUrl } from "@/lib/urlSafety";
import { submitSitemap, mapGoogleError } from "@/lib/engines/googleSearchConsole";

// POST /api/indexing/google/sitemap  { sitemapUrl }
// Submits the sitemap to Google Search Console for the property covering its host.
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { sitemapUrl } = body;

        if (!sitemapUrl) {
            return NextResponse.json({ error: "Sitemap URL is required" }, { status: 400 });
        }

        const check = await validatePublicHttpUrl(sitemapUrl);
        if (!check.ok) {
            return NextResponse.json({ error: `Sitemap URL is not allowed: ${check.reason}` }, { status: 400 });
        }

        const user = await withPrismaFallback("Google config",
            () => readUserByIdFromInsforge(session.user.id, "id,googleIndexingConfig"),
            () => prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, googleIndexingConfig: true },
            })
        );

        if (!user?.googleIndexingConfig) {
            return NextResponse.json(
                { error: "GOOGLE_CONFIG_MISSING", message: "Add your Google service account JSON in My profile first." },
                { status: 400 }
            );
        }

        const result = await submitSitemap(user.googleIndexingConfig, { sitemapUrl: check.url });

        if (!result.ok) {
            return NextResponse.json({ error: result.error, properties: result.properties || [] }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        const mapped = mapGoogleError(error);
        console.error("Search Console sitemap submit error:", mapped.message);
        return NextResponse.json({ error: mapped.message, httpStatus: mapped.httpStatus }, { status: 502 });
    }
}
