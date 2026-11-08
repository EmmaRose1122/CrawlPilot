import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchPublicUrl, validatePublicHttpUrl } from "@/lib/urlSafety";

const MAX_URLS = 1000;
const MAX_SITEMAPS = 25;

function decodeXml(value) {
    return value
        .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, "$1")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'")
        .trim();
}

function extractLocs(xml) {
    const locRegex = /<(?:[\w-]+:)?loc\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?loc>/gi;
    const urls = [];
    let match;

    while ((match = locRegex.exec(xml)) !== null) {
        const url = decodeXml(match[1]);

        try {
            urls.push(new URL(url).href);
        } catch {
            // Ignore invalid sitemap entries.
        }
    }

    return urls;
}

async function fetchSitemapXml(sitemapUrl) {
    return fetchPublicUrl(sitemapUrl, { timeoutMs: 8000 });
}

async function collectSitemapUrls(sitemapUrl, seen = new Set()) {
    if (seen.has(sitemapUrl) || seen.size >= MAX_SITEMAPS) {
        return [];
    }

    seen.add(sitemapUrl);

    // Child sitemap URLs come from untrusted XML — validate them too.
    const check = await validatePublicHttpUrl(sitemapUrl);
    if (!check.ok) {
        throw new Error(`Blocked sitemap URL: ${check.reason}`);
    }

    const xml = await fetchSitemapXml(check.url);
    const locs = extractLocs(xml);
    const isSitemapIndex = /<(?:[\w-]+:)?sitemapindex\b/i.test(xml);

    if (!isSitemapIndex) {
        return locs.slice(0, MAX_URLS);
    }

    const urls = [];

    for (const childSitemapUrl of locs) {
        if (urls.length >= MAX_URLS || seen.size >= MAX_SITEMAPS) {
            break;
        }

        try {
            const childUrls = await collectSitemapUrls(childSitemapUrl, seen);
            urls.push(...childUrls);
        } catch (error) {
            console.warn("Nested sitemap fetch failed:", error.message);
        }
    }

    return urls.slice(0, MAX_URLS);
}

export async function POST(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { sitemapUrl } = await req.json();

        if (!sitemapUrl) {
            return NextResponse.json({ error: "Sitemap URL is required" }, { status: 400 });
        }

        const check = await validatePublicHttpUrl(sitemapUrl);
        if (!check.ok) {
            return NextResponse.json(
                { error: `Sitemap URL is not allowed: ${check.reason}` },
                { status: 400 }
            );
        }

        const urls = await collectSitemapUrls(check.url);

        return NextResponse.json({
            urls,
            total: urls.length,
            count: urls.length,
        });
    } catch (error) {
        console.error("Sitemap Fetch Error:", error);
        return NextResponse.json({ error: "Could not parse sitemap. Ensure it is a valid XML sitemap." }, { status: 500 });
    }
}
