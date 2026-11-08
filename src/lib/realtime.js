/**
 * Real-time service for Discovery Activity updates
 * Uses InsForge real-time subscriptions to provide live updates
 */

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

/**
 * Subscribe to indexing results for a specific user
 * @param {string} userId - User ID to subscribe to
 * @param {function} callback - Callback function when new data arrives
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToIndexingResults(userId, callback) {
    if (!userId) {
        console.error('User ID is required for real-time subscription');
        return null;
    }

    console.log(`Subscribing to indexing results for user: ${userId}`);

    // Connect to real-time if not connected
    supabase.realtime.connect().catch(err => console.error('Real-time connect error:', err));

    // Subscribe to channel
    const channel = `indexing-results-${userId}`;
    supabase.realtime.subscribe(channel).then(({ ok, error }) => {
        if (!ok) {
            console.error('Failed to subscribe to indexing results:', error?.message);
            return;
        }
        console.log(`Subscribed to ${channel}`);
    });

    // Listen for events
    const handler = (payload) => {
        console.log('Real-time update received:', payload);
        callback(payload);
    };

    supabase.realtime.on('INSERT', handler);
    supabase.realtime.on('UPDATE', handler);
    supabase.realtime.on('DELETE', handler);

    return {
        unsubscribe: () => {
            console.log(`Unsubscribing from indexing results for user: ${userId}`);
            supabase.realtime.off('INSERT', handler);
            supabase.realtime.off('UPDATE', handler);
            supabase.realtime.off('DELETE', handler);
            supabase.realtime.unsubscribe(channel);
        }
    };
}

/**
 * Subscribe to bot signaling progress for a specific user
 * This listens for updates to the signalingResults field
 * @param {string} userId - User ID to subscribe to
 * @param {function} callback - Callback function when signaling results update
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToSignalingProgress(userId, callback) {
    if (!userId) {
        console.error('User ID is required for signaling progress subscription');
        return null;
    }

    console.log(`Subscribing to signaling progress for user: ${userId}`);

    // Connect to real-time if not connected
    supabase.realtime.connect().catch(err => console.error('Real-time connect error:', err));

    // Subscribe to channel
    const channel = `signaling-progress-${userId}`;
    supabase.realtime.subscribe(channel).then(({ ok, error }) => {
        if (!ok) {
            console.error('Failed to subscribe to signaling progress:', error?.message);
            return;
        }
        console.log(`Subscribed to ${channel}`);
    });

    // Listen for UPDATE events
    const handler = (payload) => {
        // Check if signalingResults field was updated
        if (payload.new.signalingResults !== payload.old?.signalingResults) {
            console.log('Signaling progress update:', payload);
            callback(payload);
        }
    };

    supabase.realtime.on('UPDATE', handler);

    return {
        unsubscribe: () => {
            console.log(`Unsubscribing from signaling progress for user: ${userId}`);
            supabase.realtime.off('UPDATE', handler);
            supabase.realtime.unsubscribe(channel);
        }
    };
}

/**
 * Subscribe to daily stats updates
 * This aggregates data and provides day-wise updates
 * @param {string} userId - User ID to subscribe to
 * @param {function} callback - Callback function when daily stats update
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToDailyStats(userId, callback) {
    if (!userId) {
        console.error('User ID is required for daily stats subscription');
        return null;
    }

    console.log(`Subscribing to daily stats for user: ${userId}`);

    // Connect to real-time if not connected
    supabase.realtime.connect().catch(err => console.error('Real-time connect error:', err));

    // Subscribe to channel
    const channel = `daily-stats-${userId}`;
    supabase.realtime.subscribe(channel).then(({ ok, error }) => {
        if (!ok) {
            console.error('Failed to subscribe to daily stats:', error?.message);
            return;
        }
        console.log(`Subscribed to ${channel}`);
    });

    // Listen for all events and fetch stats
    const handler = async (payload) => {
        // When any change occurs, fetch updated daily stats
        try {
            const response = await fetch(`/api/user/stats`);
            if (response.ok) {
                const stats = await response.json();
                callback({
                    type: 'daily_stats_update',
                    stats: stats.dailyStats || [],
                    totalUrls: stats.totalUrls || 0,
                    acceptedUrls: stats.accepted || 0,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Failed to fetch updated daily stats:', error);
        }
    };

    supabase.realtime.on('INSERT', handler);
    supabase.realtime.on('UPDATE', handler);
    supabase.realtime.on('DELETE', handler);

    return {
        unsubscribe: () => {
            console.log(`Unsubscribing from daily stats for user: ${userId}`);
            supabase.realtime.off('INSERT', handler);
            supabase.realtime.off('UPDATE', handler);
            supabase.realtime.off('DELETE', handler);
            supabase.realtime.unsubscribe(channel);
        }
    };
}

/**
 * Real-time manager for coordinating multiple subscriptions
 */
export class RealTimeManager {
    constructor(userId) {
        this.userId = userId;
        this.subscriptions = new Map();
        this.callbacks = new Map();
    }

    /**
     * Start all real-time subscriptions
     * @param {object} options - Subscription options
     */
    start(options = {}) {
        const {
            onIndexingUpdate = () => {},
            onSignalingProgress = () => {},
            onDailyStatsUpdate = () => {}
        } = options;

        // Store callbacks for cleanup
        this.callbacks.set('indexing', onIndexingUpdate);
        this.callbacks.set('signaling', onSignalingProgress);
        this.callbacks.set('dailyStats', onDailyStatsUpdate);

        // Connect to real-time
        supabase.realtime.connect().catch(err => console.error('Real-time connect error:', err));

        // Start subscriptions
        if (onIndexingUpdate) {
            const sub = subscribeToIndexingResults(this.userId, onIndexingUpdate);
            if (sub) this.subscriptions.set('indexing', sub);
        }

        if (onSignalingProgress) {
            const sub = subscribeToSignalingProgress(this.userId, onSignalingProgress);
            if (sub) this.subscriptions.set('signaling', sub);
        }

        if (onDailyStatsUpdate) {
            const sub = subscribeToDailyStats(this.userId, onDailyStatsUpdate);
            if (sub) this.subscriptions.set('dailyStats', sub);
        }

        console.log(`Real-time manager started for user: ${this.userId}`);
    }

    /**
     * Stop all real-time subscriptions
     */
    stop() {
        for (const [key, subscription] of this.subscriptions) {
            try {
                subscription.unsubscribe();
                console.log(`Stopped subscription: ${key}`);
            } catch (error) {
                console.error(`Error stopping subscription ${key}:`, error);
            }
        }
        this.subscriptions.clear();
        this.callbacks.clear();
        supabase.realtime.disconnect();
        console.log(`Real-time manager stopped for user: ${this.userId}`);
    }

    /**
     * Check if real-time is connected
     * @returns {boolean} Connection status
     */
    isConnected() {
        return supabase.realtime.isConnected && this.subscriptions.size > 0;
    }
}

/**
 * Utility function to get real-time updates for the current session
 * This can be used in React components
 */
export function useRealTimeUpdates(session, callbacks) {
    const [manager, setManager] = useState(null);

    useEffect(() => {
        if (!session?.user?.id) return;

        const realTimeManager = new RealTimeManager(session.user.id);
        realTimeManager.start(callbacks);
        setManager(realTimeManager);

        return () => {
            if (realTimeManager) {
                realTimeManager.stop();
            }
        };
    }, [session?.user?.id]);

    return manager;
}

// For backward compatibility
export default {
    subscribeToIndexingResults,
    subscribeToSignalingProgress,
    subscribeToDailyStats,
    RealTimeManager,
    useRealTimeUpdates
};