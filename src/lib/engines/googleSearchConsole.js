import { google } from 'googleapis';

/**
 * Google Search Console integration using the user's service account.
 *
 * The same service account JSON used for the Indexing API also powers:
 *  - sitemaps.submit / sitemaps.list   (webmasters v3)
 *  - urlInspection.index.inspect       (searchconsole v1, 2,000/day quota)
 *
 * The service account must be added as an Owner (or Full user) of the property
 * inside Search Console, otherwise Google returns 403.
 */

const SCOPES = [
    'https://www.googleapis.com/auth/indexing',
    'https://www.googleapis.com/auth/webmasters',
];

function getAuth(configJson) {
    let credentials;
    try {
        credentials = JSON.parse(configJson);
    } catch {
        throw new Error('Google service account config is not valid JSON');
    }

    if (!credentials?.client_email || !credentials?.private_key) {
        throw new Error('Google service account config is missing client_email or private_key');
    }

    return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

export async function getSearchConsoleClients(configJson) {
    const auth = getAuth(configJson);
    const authClient = await auth.getClient();

    return {
        webmasters: google.webmasters({ version: 'v3', auth: authClient }),
        searchconsole: google.searchconsole({ version: 'v1', auth: authClient }),
    };
}

export function mapGoogleError(error) {
    const status = error?.response?.status || error?.code || null;
    const rawMessage = error?.response?.data?.error?.message || error?.message || 'Unknown Google API error';

    if (status === 401 || /invalid_grant|invalid key|DECODER/i.test(rawMessage)) {
        return { httpStatus: status, message: `Google rejected the service account credentials (${rawMessage}).` };
    }
    if (status === 403) {
        return {
            httpStatus: status,
            message: `Google denied access (${rawMessage}). Add the service account as Owner in Search Console for this property.`,
        };
    }
    if (status === 429) {
        return { httpStatus: status, message: 'Google API quota exceeded (429). Try again later.' };
    }
    return { httpStatus: status, message: rawMessage };
}

/**
 * Lists the Search Console properties the service account can access.
 */
export async function listProperties(configJson) {
    const { webmasters } = await getSearchConsoleClients(configJson);
    const { data } = await webmasters.sites.list({});

    return (data.siteEntry || [])
        .filter((entry) => entry.permissionLevel && entry.permissionLevel !== 'siteUnverifiedUser')
        .map((entry) => ({ siteUrl: entry.siteUrl, permissionLevel: entry.permissionLevel }));
}

/**
 * Finds the Search Console property that covers a host.
 * Prefers an exact URL-prefix property, then a domain property.
 */
export function matchProperty(properties, host) {
    const candidates = [`https://${host}/`, `http://${host}/`, `sc-domain:${host}`];
    for (const candidate of candidates) {
        const found = properties.find((property) => property.siteUrl === candidate);
        if (found) return found.siteUrl;
    }

    for (const property of properties) {
        if (!property.siteUrl.startsWith('sc-domain:')) continue;
        const domain = property.siteUrl.slice('sc-domain:'.length);
        if (host === domain || host.endsWith(`.${domain}`)) return property.siteUrl;
    }

    return null;
}

/**
 * Submits (or refreshes) a sitemap for the property covering the sitemap's host.
 */
export async function submitSitemap(configJson, { sitemapUrl }) {
    let host;
    try {
        host = new URL(sitemapUrl).hostname.toLowerCase();
    } catch {
        return { ok: false, error: 'Invalid sitemap URL' };
    }

    const properties = await listProperties(configJson);
    const siteUrl = matchProperty(properties, host);

    if (!siteUrl) {
        return {
            ok: false,
            error: `No Search Console property found for ${host}. Add the service account as an Owner in Search Console first.`,
            properties,
        };
    }

    const { webmasters } = await getSearchConsoleClients(configJson);
    await webmasters.sitemaps.submit({ siteUrl, feedpath: sitemapUrl });

    // Read back the sitemap status so the UI can show Google's real state.
    let status = null;
    try {
        const { data } = await webmasters.sitemaps.list({ siteUrl });
        const entry = (data.sitemap || []).find((item) => item.path === sitemapUrl) || null;
        if (entry) {
            status = {
                lastSubmitted: entry.lastSubmitted || null,
                lastDownloaded: entry.lastDownloaded || null,
                isPending: entry.isPending ?? null,
                isSitemapsIndex: entry.isSitemapsIndex ?? null,
                warnings: entry.warnings ? Number(entry.warnings) : 0,
                errors: entry.errors ? Number(entry.errors) : 0,
            };
        }
    } catch {
        // Status is best-effort; the submission itself already succeeded.
    }

    return { ok: true, siteUrl, sitemapUrl, status };
}

/**
 * Runs the URL Inspection API for a single URL.
 */
export async function inspectUrl(configJson, { url, siteUrl = null }) {
    let host;
    try {
        host = new URL(url).hostname.toLowerCase();
    } catch {
        return { ok: false, error: 'Invalid URL' };
    }

    let property = siteUrl;
    if (!property) {
        const properties = await listProperties(configJson);
        property = matchProperty(properties, host);
    }

    if (!property) {
        return {
            ok: false,
            error: `No Search Console property found for ${host}. Add the service account as an Owner in Search Console first.`,
        };
    }

    const { searchconsole } = await getSearchConsoleClients(configJson);
    const { data } = await searchconsole.urlInspection.index.inspect({
        requestBody: {
            inspectionUrl: url,
            siteUrl: property,
        },
    });

    const result = data.inspectionResult?.indexStatusResult || null;

    return {
        ok: true,
        siteUrl: property,
        inspectionUrl: url,
        result: result ? {
            verdict: result.verdict || null,
            coverageState: result.coverageState || null,
            indexingState: result.indexingState || null,
            pageFetchState: result.pageFetchState || null,
            robotsTxtState: result.robotsTxtState || null,
            lastCrawlTime: result.lastCrawlTime || null,
            googleCanonical: result.googleCanonical || null,
            userCanonical: result.userCanonical || null,
            referringUrls: result.referringUrls || [],
        } : null,
    };
}
