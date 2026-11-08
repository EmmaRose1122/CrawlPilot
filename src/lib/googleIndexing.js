import { google } from 'googleapis';

/**
 * Send indexing request to Google Indexing API using user's service account config
 * @param {string} url - The URL to index
 * @param {string} configJson - The JSON string of the Google Service Account key
 * @param {string} type - The type of request: 'URL_UPDATED' or 'URL_DELETED'
 */
export async function sendGoogleIndexingRequest(url, configJson, type = 'URL_UPDATED') {
    if (!configJson) {
        throw new Error('Google Indexing Configuration is missing');
    }

    try {
        const credentials = JSON.parse(configJson);
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const authClient = await auth.getClient();
        const indexing = google.indexing({
            version: 'v3',
            auth: authClient,
        });

        const res = await indexing.urlNotifications.publish({
            requestBody: {
                url: url,
                type: type,
            },
        });

        return {
            success: true,
            status: res.status,
            data: res.data,
            url
        };
    } catch (error) {
        console.error('Google Indexing API Error:', error);
        return {
            success: false,
            error: error.message,
            url
        };
    }
}

/**
 * Batch process URLs for Google Indexing API
 * Note: Google Indexing API has a quota of 200 requests per day by default.
 */
export async function batchGoogleIndexing(urls, configJson, type = 'URL_UPDATED') {
    const results = [];
    for (const url of urls) {
        const result = await sendGoogleIndexingRequest(url, configJson, type);
        results.push(result);
    }
    return results;
}
