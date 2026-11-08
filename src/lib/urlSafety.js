import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

function ipv4ToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isBlockedIpv4(ip) {
    const value = ipv4ToInt(ip);
    const ranges = [
        [ipv4ToInt('0.0.0.0'), ipv4ToInt('0.255.255.255')],
        [ipv4ToInt('10.0.0.0'), ipv4ToInt('10.255.255.255')],
        [ipv4ToInt('100.64.0.0'), ipv4ToInt('100.127.255.255')],
        [ipv4ToInt('127.0.0.0'), ipv4ToInt('127.255.255.255')],
        [ipv4ToInt('169.254.0.0'), ipv4ToInt('169.254.255.255')],
        [ipv4ToInt('172.16.0.0'), ipv4ToInt('172.31.255.255')],
        [ipv4ToInt('192.0.0.0'), ipv4ToInt('192.0.0.255')],
        [ipv4ToInt('192.0.2.0'), ipv4ToInt('192.0.2.255')],
        [ipv4ToInt('192.168.0.0'), ipv4ToInt('192.168.255.255')],
        [ipv4ToInt('198.18.0.0'), ipv4ToInt('198.19.255.255')],
        [ipv4ToInt('198.51.100.0'), ipv4ToInt('198.51.100.255')],
        [ipv4ToInt('203.0.113.0'), ipv4ToInt('203.0.113.255')],
        [ipv4ToInt('224.0.0.0'), ipv4ToInt('255.255.255.255')],
    ];
    return ranges.some(([start, end]) => value >= start && value <= end);
}

function isBlockedIpv6(ip) {
    const normalized = ip.toLowerCase();
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('::ffff:')) {
        return isBlockedIpv4(normalized.slice(7));
    }
    return false;
}

function isBlockedIp(ip) {
    const version = isIP(ip);
    if (version === 4) return isBlockedIpv4(ip);
    if (version === 6) return isBlockedIpv6(ip);
    return false;
}

const blockedHostSuffixes = ['.local', '.internal', '.localhost', '.lan', '.home', '.corp'];
const blockedHostNames = new Set(['localhost', 'metadata.google.internal']);

/**
 * Validates that a URL points at a public internet host.
 * Rejects invalid URLs, non-http(s) schemes, and hosts resolving to
 * loopback/private/link-local/reserved addresses (SSRF guard).
 */
export async function validatePublicHttpUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return { ok: false, reason: 'empty' };

    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        return { ok: false, reason: 'invalid-url', value };
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { ok: false, reason: 'invalid-scheme', value };
    }

    const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!host) return { ok: false, reason: 'invalid-host', value };

    if (blockedHostNames.has(host) || blockedHostSuffixes.some((suffix) => host.endsWith(suffix))) {
        return { ok: false, reason: 'blocked-host', value };
    }

    if (isIP(host)) {
        if (isBlockedIp(host)) return { ok: false, reason: 'blocked-ip', value };
    } else {
        try {
            const addresses = await lookup(host, { all: true });
            if (addresses.some(({ address }) => isIP(address) && isBlockedIp(address))) {
                return { ok: false, reason: 'blocked-ip', value };
            }
        } catch {
            return { ok: false, reason: 'dns-error', value };
        }
    }

    return { ok: true, url: parsed.href, value };
}

const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 10 * 1024 * 1024;

/**
 * Fetch a public URL with a timeout, a redirect cap, and a size cap.
 * Every redirect hop is re-validated against the SSRF guard.
 */
export async function fetchPublicUrl(url, { timeoutMs = 8000, maxRedirects = MAX_REDIRECTS } = {}) {
    let currentUrl = url;
    for (let hop = 0; hop <= maxRedirects; hop++) {
        const check = await validatePublicHttpUrl(currentUrl);
        if (!check.ok) {
            throw new Error(`Blocked URL: ${check.reason}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let response;
        try {
            response = await fetch(check.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; CrawlPilot/1.0; +https://crawlpilot.io)',
                },
                redirect: 'manual',
                signal: controller.signal,
            });
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
        clearTimeout(timeoutId);

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            if (!location) throw new Error('Redirect without location');
            currentUrl = new URL(location, check.url).href;
            continue;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText || response.status}`);
        }

        const declaredLength = Number(response.headers.get('content-length') || 0);
        if (declaredLength > MAX_BODY_BYTES) {
            throw new Error('Response too large');
        }

        const body = await response.text();
        if (body.length > MAX_BODY_BYTES) {
            throw new Error('Response too large');
        }

        return body;
    }

    throw new Error('Too many redirects');
}
