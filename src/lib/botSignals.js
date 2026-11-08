/**
 * Performs the engine request for a URL.
 *
 * Only engines that expose real submission interfaces are listed here.
 * Google accepts the Indexing API (handled in googleIndexing.js); Bing accepts
 * IndexNow (Phase 1). This module performs the plain HTTP check and records the
 * real response — it does not simulate a crawler visit.
 */

export const botUserAgents = {
    google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    bing: 'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
};

/**
 * Send a signal to a specific bot for a given URL with retry logic.
 * Returns an object with success status and details.
 */
export async function sendBotSignal(botId, url, options = {}) {
    const { maxRetries = 2, retryDelay = 1000 } = options;
    const userAgent = botUserAgents[botId];
    if (!userAgent) {
        return { success: false, error: `Unknown bot: ${botId}` };
    }

    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        const startTime = Date.now();
        try {
            // 1. Make a GET request to the URL with bot user-agent
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            const response = await fetch(url, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            return {
                success: response.ok,
                status: response.status,
                responseTime,
                botId,
                url,
                attempt,
            };
        } catch (err) {
            lastError = err;
            if (attempt <= maxRetries) {
                // Exponential backoff: wait longer between retries
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    return {
        success: false,
        error: lastError?.message || 'Request failed after all retries',
        botId,
        url,
        attempt: maxRetries + 1,
    };
}

/**
 * Process a batch of tasks with controlled concurrency
 */
async function processBatch(tasks, concurrency, progressCallback) {
    const results = [];
    const queue = [...tasks];
    const active = new Set();
    
    while (queue.length > 0 || active.size > 0) {
        // Fill up to concurrency limit
        while (active.size < concurrency && queue.length > 0) {
            const task = queue.shift();
            let promise;
            promise = task().then(result => {
                results.push(result);
                if (progressCallback) {
                    progressCallback({
                        type: 'progress',
                        completed: results.length,
                        total: tasks.length,
                        current: result
                    });
                }
                return result;
            }).finally(() => {
                active.delete(promise);
            });
            active.add(promise);
        }
        
        if (active.size > 0) {
            await Promise.race(active);
        }
    }
    
    return results;
}

/**
 * Send signals to multiple bots for multiple URLs with parallel processing.
 * Returns array of results with real-time progress updates.
 */
export async function sendBotSignals(bots, urls, options = {}) {
    const {
        concurrency = 5, // Number of parallel requests
        progressCallback, // Callback for real-time progress
        maxRetries = 2,
        retryDelay = 1000,
    } = options;

    // Generate all tasks (bot × url combinations)
    const tasks = [];
    for (const url of urls) {
        for (const botId of bots) {
            tasks.push(() => sendBotSignal(botId, url, { maxRetries, retryDelay }));
        }
    }

    if (progressCallback) {
        progressCallback({
            type: 'start',
            total: tasks.length,
            urls: urls.length,
            bots: bots.length,
        });
    }

    // Process tasks with controlled concurrency
    const results = await processBatch(tasks, concurrency, progressCallback);

    // Calculate statistics
    const stats = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        avgResponseTime: results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length || 0,
        byBot: {},
        byUrl: {},
    };

    // Group results by bot and URL for detailed analysis
    results.forEach(result => {
        stats.byBot[result.botId] = stats.byBot[result.botId] || { total: 0, successful: 0 };
        stats.byBot[result.botId].total++;
        if (result.success) stats.byBot[result.botId].successful++;

        stats.byUrl[result.url] = stats.byUrl[result.url] || { total: 0, successful: 0 };
        stats.byUrl[result.url].total++;
        if (result.success) stats.byUrl[result.url].successful++;
    });

    if (progressCallback) {
        progressCallback({
            type: 'complete',
            results,
            stats,
        });
    }

    return {
        results,
        stats,
        summary: `${stats.successful}/${stats.total} signals successful (${stats.total ? Math.round(stats.successful / stats.total * 100) : 0}%)`,
    };
}

/**
 * Enhanced version with real-time WebSocket/SSE support
 * This can be used for frontend real-time updates
 */
export class BotSignalManager {
    constructor(options = {}) {
        this.options = {
            concurrency: 5,
            maxRetries: 2,
            retryDelay: 1000,
            ...options
        };
        this.subscribers = new Set();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notify(event) {
        this.subscribers.forEach(callback => {
            try {
                callback(event);
            } catch (err) {
                console.error('Error in bot signal subscriber:', err);
            }
        });
    }

    async sendSignals(bots, urls) {
        const startTime = Date.now();
        this.notify({
            type: 'start',
            timestamp: startTime,
            totalTasks: bots.length * urls.length,
            bots,
            urls,
        });

        const result = await sendBotSignals(bots, urls, {
            ...this.options,
            progressCallback: (progress) => {
                this.notify({
                    type: 'progress',
                    timestamp: Date.now(),
                    ...progress,
                });
            },
        });

        const endTime = Date.now();
        this.notify({
            type: 'complete',
            timestamp: endTime,
            duration: endTime - startTime,
            ...result,
        });

        return result;
    }
}
