import { randomBytes } from 'node:crypto';

/**
 * IndexNow — real instant-submission protocol supported by Bing, Yandex,
 * Seznam and Naver. The user hosts a key file at https://<host>/<key>.txt and
 * the engines verify it when we POST to api.indexnow.org.
 */

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const INDEXNOW_MAX_URLS_PER_REQUEST = 10000;

export function generateIndexNowKey() {
    return randomBytes(16).toString('hex'); // 32 chars, hex — within the 8-128 rule
}

export function isValidIndexNowKey(key) {
    return typeof key === 'string' && /^[a-zA-Z0-9-]{8,128}$/.test(key);
}

const STATUS_REASONS = {
    400: 'Invalid request (400)',
    403: 'Key not verified — host the key file on this domain (403)',
    422: 'URLs do not belong to this host or key mismatch (422)',
    429: 'Too many requests — quota exceeded (429)',
};

/**
 * Fetches https://<host>/<key>.txt and checks that it contains the key.
 */
export async function verifyIndexNowKey(host, key, { timeoutMs = 8000 } = {}) {
    const keyLocation = `https://${host}/${key}.txt`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(keyLocation, {
            headers: { 'User-Agent': 'CrawlPilot/1.0 (+https://crawlpilot.io) IndexNow verification' },
            redirect: 'follow',
            signal: controller.signal,
        });

        if (!response.ok) {
            return {
                ok: false,
                keyLocation,
                httpStatus: response.status,
                reason: `Key file returned HTTP ${response.status}`,
            };
        }

        const body = (await response.text()).trim();
        if (!body) {
            return { ok: false, keyLocation, httpStatus: response.status, reason: 'Key file is empty' };
        }
        if (!body.includes(key)) {
            return { ok: false, keyLocation, httpStatus: response.status, reason: 'Key file does not contain the expected key' };
        }

        return { ok: true, keyLocation, httpStatus: response.status, reason: null };
    } catch (error) {
        return {
            ok: false,
            keyLocation,
            httpStatus: null,
            reason: error.name === 'AbortError' ? 'Key file check timed out' : error.message,
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

async function postIndexNowRequest(payload) {
    const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
    });

    let bodyText = '';
    try {
        bodyText = (await response.text()).slice(0, 500);
    } catch {
        bodyText = '';
    }

    return { httpStatus: response.status, ok: response.status === 200 || response.status === 202, bodyText };
}

/**
 * Submits all URLs of a single host through IndexNow.
 * Retries once on 429 / 5xx (the request may not have been processed).
 */
export async function submitIndexNowHost({ host, key, urls, maxRetries = 1, retryDelayMs = 2000 }) {
    const keyLocation = `https://${host}/${key}.txt`;
    const urlList = urls.slice(0, INDEXNOW_MAX_URLS_PER_REQUEST);
    const payload = { host, key, keyLocation, urlList };

    let lastStatus = null;
    let lastBody = '';
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const { httpStatus, ok, bodyText } = await postIndexNowRequest(payload);
            lastStatus = httpStatus;
            lastBody = bodyText;

            if (ok) {
                return {
                    ok: true,
                    httpStatus,
                    submittedUrls: urlList,
                    keyLocation,
                    error: null,
                };
            }

            // Only retry transient failures.
            const retryable = httpStatus === 429 || httpStatus >= 500;
            if (!retryable || attempt === maxRetries) {
                return {
                    ok: false,
                    httpStatus,
                    submittedUrls: [],
                    keyLocation,
                    error: STATUS_REASONS[httpStatus] || `IndexNow rejected the request (HTTP ${httpStatus})`,
                };
            }
        } catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                return {
                    ok: false,
                    httpStatus: null,
                    submittedUrls: [],
                    keyLocation,
                    error: `IndexNow request failed: ${error.message}`,
                };
            }
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    return {
        ok: false,
        httpStatus: lastStatus,
        submittedUrls: [],
        keyLocation,
        error: lastError?.message || `IndexNow request failed (HTTP ${lastStatus})`,
    };
}
