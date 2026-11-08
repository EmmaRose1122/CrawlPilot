import { validatePublicHttpUrl } from "../urlSafety";

/**
 * Real site audit: fetches the page server-side (SSRF-guarded) and reports the
 * actual HTTP response, redirects, timing and on-page SEO signals.
 * AI crawler readiness parses the site's real robots.txt.
 */

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const AUDIT_TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const MAX_URLS_PER_REQUEST = 20;
const CONCURRENCY = 3;

const AI_CRAWLERS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'anthropic-ai',
    'Google-Extended',
    'CCBot',
    'PerplexityBot',
    'Bytespider',
];

async function fetchForAudit(rawUrl) {
    let currentUrl = rawUrl;
    const redirectChain = [];
    const started = Date.now();

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const check = await validatePublicHttpUrl(currentUrl);
        if (!check.ok) {
            throw new Error(`Blocked URL: ${check.reason}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

        let response;
        try {
            response = await fetch(check.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; CrawlPilotAudit/1.0; +https://crawlpilot.io)',
                    Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.5',
                },
                redirect: 'manual',
                signal: controller.signal,
            });
        } catch (error) {
            if (error.name === 'AbortError') throw new Error('Request timed out');
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }

        const responseTime = Date.now() - started;

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            redirectChain.push({ from: check.url, status: response.status, to: location || null });
            if (!location) {
                return { finalUrl: check.url, status: response.status, ok: false, responseTime, redirectChain, body: '', headers: {} };
            }
            currentUrl = new URL(location, check.url).href;
            continue;
        }

        const contentType = response.headers.get('content-type') || '';
        const declaredLength = Number(response.headers.get('content-length') || 0);

        let body = '';
        const isTextual = !contentType || /text\/html|application\/xhtml|text\/plain/i.test(contentType);
        if (isTextual && (!declaredLength || declaredLength <= MAX_BODY_BYTES)) {
            body = await response.text();
            if (body.length > MAX_BODY_BYTES) body = body.slice(0, MAX_BODY_BYTES);
        }

        return {
            finalUrl: check.url,
            status: response.status,
            ok: response.ok,
            responseTime,
            redirectChain,
            body,
            headers: {
                contentType: contentType || null,
                xRobotsTag: response.headers.get('x-robots-tag') || null,
            },
        };
    }

    return {
        finalUrl: currentUrl,
        status: null,
        ok: false,
        responseTime: Date.now() - started,
        redirectChain,
        body: '',
        headers: {},
        error: 'Too many redirects',
    };
}

function decodeEntities(value) {
    return String(value)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function matchMeta(html, name) {
    const forward = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
    const reversed = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["'][^>]*>`, 'i');
    const match = html.match(forward) || html.match(reversed);
    return match ? decodeEntities(match[1]) : null;
}

function matchCanonical(html) {
    const forward = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
    const reversed = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i;
    const match = html.match(forward) || html.match(reversed);
    return match ? match[1].trim() : null;
}

function extractSeo(html) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    return {
        title: titleMatch ? decodeEntities(titleMatch[1]).slice(0, 300) : null,
        metaDescription: matchMeta(html, 'description'),
        robotsMeta: matchMeta(html, 'robots') || matchMeta(html, 'googlebot'),
        canonical: matchCanonical(html),
        h1Count: (html.match(/<h1\b[^>]*>/gi) || []).length,
        lang: (html.match(/<html[^>]*\blang=["']([^"']+)["']/i) || [])[1] || null,
        hasViewport: /<meta[^>]*name=["']viewport["']/i.test(html),
    };
}

export async function auditUrl(rawUrl) {
    const check = await validatePublicHttpUrl(rawUrl);
    if (!check.ok) {
        return { url: String(rawUrl || ''), ok: false, error: `Blocked: ${check.reason}` };
    }

    try {
        const page = await fetchForAudit(check.url);
        const seo = extractSeo(page.body || '');

        let canonical = null;
        if (seo.canonical) {
            try {
                canonical = new URL(seo.canonical, page.finalUrl).href;
            } catch {
                canonical = seo.canonical;
            }
        }

        const robotsRaw = [seo.robotsMeta, page.headers.xRobotsTag].filter(Boolean).join(', ');

        return {
            url: check.url,
            finalUrl: page.finalUrl,
            status: page.status,
            ok: page.ok,
            error: page.error || null,
            responseTime: page.responseTime,
            redirects: page.redirectChain,
            title: seo.title,
            metaDescription: seo.metaDescription,
            canonical,
            canonicalMatches: canonical ? canonical === page.finalUrl : null,
            robots: {
                raw: robotsRaw || null,
                noindex: /noindex/i.test(robotsRaw),
                nofollow: /nofollow/i.test(robotsRaw),
            },
            h1Count: seo.h1Count,
            lang: seo.lang,
            hasViewport: seo.hasViewport,
            contentType: page.headers.contentType,
            bytes: (page.body || '').length,
        };
    } catch (error) {
        return { url: check.url, ok: false, error: error.message };
    }
}

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            results[index] = await mapper(items[index], index);
        }
    });

    await Promise.all(workers);
    return results;
}

export async function auditUrls(rawUrls) {
    const urls = (Array.isArray(rawUrls) ? rawUrls : [])
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter(Boolean);

    if (urls.length === 0) {
        return { error: 'At least one URL is required' };
    }
    if (urls.length > MAX_URLS_PER_REQUEST) {
        return { error: `A maximum of ${MAX_URLS_PER_REQUEST} URLs can be audited per request` };
    }

    const results = await mapWithConcurrency(urls, CONCURRENCY, (url) => auditUrl(url));
    return { results };
}

function parseRobotsGroups(text) {
    const groups = []; // { agents: [], rules: [{type, path}] }
    let current = null;
    let lastWasAgent = false;

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.split('#')[0].trim();
        if (!line) continue;
        const separator = line.indexOf(':');
        if (separator === -1) continue;

        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        if (key === 'user-agent') {
            if (!lastWasAgent) {
                current = { agents: [], rules: [] };
                groups.push(current);
            }
            current.agents.push(value.toLowerCase());
            lastWasAgent = true;
        } else if (key === 'allow' || key === 'disallow') {
            if (current) current.rules.push({ type: key, path: value });
            lastWasAgent = false;
        } else {
            lastWasAgent = false;
        }
    }

    return groups;
}

function findGroup(groups, botName) {
    const bot = botName.toLowerCase();
    return groups.find((group) => group.agents.some((agent) => agent === bot))
        || groups.find((group) => group.agents.some((agent) => agent === '*'))
        || null;
}

function isRootBlocked(group) {
    if (!group) return false;

    const matching = group.rules
        .filter((rule) => rule.path === '/' || rule.path === '/*')
        .sort((a, b) => b.path.length - a.path.length);

    if (matching.length === 0) return false;

    // Longest match wins in robots.txt; on a tie Allow wins.
    const longest = matching[0].path.length;
    const candidates = matching.filter((rule) => rule.path.length === longest);
    const allowWins = candidates.some((rule) => rule.type === 'allow');
    return !allowWins && candidates.every((rule) => rule.type === 'disallow');
}

export async function checkAiReadiness(domainInput) {
    let host;
    try {
        let value = String(domainInput || '').trim();
        if (!value) throw new Error('empty');
        if (!/^https?:\/\//.test(value)) value = `https://${value}`;
        host = new URL(value).hostname.toLowerCase();
    } catch {
        return { error: 'A valid domain is required' };
    }

    const robotsUrl = `https://${host}/robots.txt`;
    const robotsCheck = await validatePublicHttpUrl(robotsUrl);
    if (!robotsCheck.ok) {
        return { error: `Domain is not allowed: ${robotsCheck.reason}` };
    }

    let robotsText = '';
    let robotsStatus = null;
    let robotsError = null;

    try {
        const response = await fetch(robotsCheck.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrawlPilotAudit/1.0; +https://crawlpilot.io)' },
            signal: AbortSignal.timeout(8000),
        });
        robotsStatus = response.status;
        if (response.ok) {
            robotsText = (await response.text()).slice(0, 512 * 1024);
        }
    } catch (error) {
        robotsError = error.message;
    }

    const groups = robotsText ? parseRobotsGroups(robotsText) : [];
    const sitemapUrls = robotsText
        ? robotsText.split(/\r?\n/)
            .map((line) => line.split('#')[0].trim())
            .filter((line) => /^sitemap\s*:/i.test(line))
            .map((line) => line.replace(/^sitemap\s*:\s*/i, '').trim())
            .filter(Boolean)
        : [];

    const bots = AI_CRAWLERS.map((botName) => {
        const specificGroup = groups.find((group) => group.agents.some((agent) => agent === botName.toLowerCase()));
        const group = specificGroup || findGroup(groups, botName);
        const isSpecific = !!specificGroup;

        if (!group) {
            return {
                bot: botName,
                allowed: true,
                matched: 'no robots.txt rules — allowed',
                specificRule: false,
            };
        }

        const blocked = isRootBlocked(group);
        return {
            bot: botName,
            allowed: !blocked,
            matched: isSpecific
                ? `rule for ${botName}: ${blocked ? 'Disallow: /' : 'allowed'}`
                : group.agents.includes('*')
                    ? `wildcard rule (User-agent: *): ${blocked ? 'Disallow: /' : 'allowed'}`
                    : 'allowed',
            specificRule: isSpecific,
        };
    });

    // Homepage reachability is part of readiness.
    let homepage = null;
    try {
        const page = await fetchForAudit(`https://${host}/`);
        homepage = {
            status: page.status,
            ok: page.ok,
            responseTime: page.responseTime,
            title: extractSeo(page.body || '').title,
        };
    } catch (error) {
        homepage = { ok: false, error: error.message };
    }

    return {
        domain: host,
        robots: {
            url: robotsUrl,
            status: robotsStatus,
            error: robotsError,
            found: !!robotsText,
            sitemapUrls,
            blockingBots: bots.filter((entry) => !entry.allowed).map((entry) => entry.bot),
        },
        bots,
        homepage,
    };
}
