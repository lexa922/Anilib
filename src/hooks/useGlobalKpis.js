import { useEffect, useSyncExternalStore } from 'react';
import { animeApiClient } from '../services/index.js';
import {
    createKpiAccumulator,
    accumulateKpiBatch,
    buildKpisFromAccumulator
} from '../utils/kpi.js';
import {
    readCatalogCache,
    appendCatalogItems,
    clearCatalogCache
} from '../utils/catalogCacheDb.js';

const NOTIFY_THROTTLE_MS = 600;
const PERSIST_BATCH_STEP = 500;

let itemsById = new Map();
const pendingPersistById = new Map();
let accumulator = createKpiAccumulator();
let currentTotalCount = 0;
let currentNextOffset = 0;
let currentIsStreaming = false;
let currentIsComplete = false;
let currentRateLimited = false;
let currentCacheReady = false;

let activeInitPromise = null;
let activeStreamController = null;
let lastNotifyTime = 0;
let notifyTimeoutId = null;

const listeners = new Set();

function buildInitialSnapshot() {
    return {
        items: [],
        itemsById,
        kpiData: buildKpisFromAccumulator(null),
        processedCount: 0,
        totalCount: 0,
        nextOffset: 0,
        isStreaming: false,
        isComplete: false,
        rateLimited: false,
        cacheReady: false
    };
}

let storeState = buildInitialSnapshot();

function notifyListeners() {
    listeners.forEach((listener) => listener());
}

function flushSnapshot() {
    if (notifyTimeoutId) {
        clearTimeout(notifyTimeoutId);
        notifyTimeoutId = null;
    }

    lastNotifyTime = Date.now();
    storeState = {
        items: Array.from(itemsById.values()),
        itemsById,
        kpiData: buildKpisFromAccumulator(accumulator),
        processedCount: accumulator.totalCount,
        totalCount: Math.max(currentTotalCount, accumulator.totalCount),
        nextOffset: currentNextOffset,
        isStreaming: currentIsStreaming,
        isComplete: currentIsComplete,
        rateLimited: currentRateLimited,
        cacheReady: currentCacheReady
    };
    notifyListeners();
}

function scheduleNotify(force = false) {
    if (force || storeState.items.length === 0) {
        flushSnapshot();
        return;
    }

    const elapsed = Date.now() - lastNotifyTime;
    if (elapsed >= NOTIFY_THROTTLE_MS) {
        flushSnapshot();
        return;
    }

    if (!notifyTimeoutId) {
        notifyTimeoutId = setTimeout(() => {
            notifyTimeoutId = null;
            flushSnapshot();
        }, NOTIFY_THROTTLE_MS - elapsed);
    }
}

function toCompactCatalogItem(raw) {
    if (!raw || raw.id === undefined || raw.id === null) return null;

    const genres = Array.isArray(raw.genres)
        ? raw.genres
            .map((g) => (typeof g === 'string' ? g.trim() : String(g?.name || g?.title || '').trim()))
            .filter(Boolean)
        : [];

    let parsedScore = null;
    if (raw.score !== null && raw.score !== undefined && raw.score !== '' && raw.score !== '?' && raw.score !== 'N/A') {
        const num = Number(raw.score);
        if (!Number.isNaN(num) && num > 0) {
            parsedScore = Number(num.toFixed(2));
        }
    }

    let parsedYear = null;
    if (typeof raw.year === 'number' && raw.year >= 1900 && raw.year <= 2100) {
        parsedYear = raw.year;
    } else if (raw.year) {
        const yr = parseInt(raw.year, 10);
        if (!Number.isNaN(yr) && yr >= 1900 && yr <= 2100) {
            parsedYear = yr;
        }
    } else if (typeof raw.startDate === 'string') {
        const match = raw.startDate.match(/^(\d{4})/);
        if (match) {
            const yr = parseInt(match[1], 10);
            if (yr >= 1900 && yr <= 2100) {
                parsedYear = yr;
            }
        }
    }

    return {
        id: String(raw.id),
        title: raw.title || '',
        score: parsedScore,
        status: raw.status || '',
        subtype: raw.subtype || '',
        startDate: raw.startDate || null,
        year: parsedYear,
        userCount: Number(raw.userCount) || 0,
        favoritesCount: Number(raw.favoritesCount) || 0,
        episodes: raw.episodes ?? null,
        episodeLength: raw.episodeLength ?? null,
        ageRating: raw.ageRating || '',
        poster: raw.poster || '',
        genres
    };
}

function addItemsToStore(incomingItems = [], trackForPersist = true) {
    if (!Array.isArray(incomingItems) || incomingItems.length === 0) return 0;

    const newlyAdded = [];
    for (const raw of incomingItems) {
        const compact = toCompactCatalogItem(raw);
        if (!compact) continue;

        const existing = itemsById.get(compact.id);
        if (!existing) {
            itemsById.set(compact.id, compact);
            newlyAdded.push(compact);
            if (trackForPersist) {
                pendingPersistById.set(compact.id, compact);
            }
        } else if (
            (compact.poster && !existing.poster) ||
            (compact.favoritesCount > 0 && !existing.favoritesCount) ||
            (compact.ageRating && !existing.ageRating)
        ) {
            const enriched = {
                ...existing,
                poster: existing.poster || compact.poster,
                startDate: existing.startDate || compact.startDate,
                favoritesCount: existing.favoritesCount || compact.favoritesCount,
                episodes: existing.episodes ?? compact.episodes,
                episodeLength: existing.episodeLength ?? compact.episodeLength,
                ageRating: existing.ageRating || compact.ageRating
            };
            itemsById.set(compact.id, enriched);
            if (trackForPersist) {
                pendingPersistById.set(compact.id, enriched);
            }
        }
    }

    if (newlyAdded.length > 0) {
        accumulateKpiBatch(accumulator, newlyAdded);
    }

    return newlyAdded.length;
}

async function flushPendingPersist(isComplete) {
    if (pendingPersistById.size === 0 && !isComplete) {
        return;
    }
    const batch = Array.from(pendingPersistById.values());
    pendingPersistById.clear();

    await appendCatalogItems(batch, {
        totalCount: currentTotalCount,
        nextOffset: currentNextOffset,
        isComplete
    });
}

export function mergeCatalogItems(normalizedItems = []) {
    if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) return;

    const addedCount = addItemsToStore(normalizedItems);
    if (addedCount > 0) {
        scheduleNotify(false);
    }
}

function ensureCatalogInitialized() {
    if (currentIsComplete || activeInitPromise) {
        return;
    }

    activeInitPromise = (async () => {
        try {
            const cached = await readCatalogCache();
            if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
                const preExisting = Array.from(itemsById.values());
                itemsById = new Map();
                accumulator = createKpiAccumulator();
                addItemsToStore(cached.items, false);
                if (preExisting.length > 0) {
                    addItemsToStore(preExisting, true);
                }

                currentTotalCount = Math.max(cached.totalCount || 0, accumulator.totalCount);
                currentNextOffset = Number(cached.nextOffset) || 0;
                currentIsComplete = Boolean(cached.isComplete);
                currentRateLimited = false;
                currentCacheReady = true;

                if (currentIsComplete) {
                    currentIsStreaming = false;
                    flushSnapshot();
                    return;
                }

                currentIsStreaming = true;
                flushSnapshot();
            } else {
                currentCacheReady = true;
                currentIsStreaming = true;
                flushSnapshot();
            }

            const controller = new AbortController();
            activeStreamController = controller;

            const result = await animeApiClient.streamAllAnimeStats({
                startOffset: currentNextOffset,
                signal: controller.signal,
                onBatch: ({ items, totalCount, nextOffset }) => {
                    if (controller.signal.aborted) return;

                    addItemsToStore(items, true);
                    if (typeof totalCount === 'number' && totalCount > 0) {
                        currentTotalCount = totalCount;
                    }
                    if (typeof nextOffset === 'number') {
                        currentNextOffset = nextOffset;
                    }

                    if (pendingPersistById.size >= PERSIST_BATCH_STEP) {
                        flushPendingPersist(false);
                    }

                    scheduleNotify(false);
                }
            });

            if (controller.signal.aborted) {
                return;
            }

            currentIsStreaming = false;
            currentIsComplete = Boolean(result?.completed);
            currentRateLimited = Boolean(result?.rateLimited);
            if (typeof result?.totalCount === 'number' && result.totalCount > 0) {
                currentTotalCount = result.totalCount;
            }
            if (typeof result?.nextOffset === 'number') {
                currentNextOffset = result.nextOffset;
            }

            if (itemsById.size > 0) {
                await flushPendingPersist(currentIsComplete);
            }

            flushSnapshot();
        } catch (err) {
            if (err?.name !== 'AbortError') {
                currentIsStreaming = false;
                if (itemsById.size > 0) {
                    await flushPendingPersist(false);
                }
                flushSnapshot();
            }
        } finally {
            activeStreamController = null;
            activeInitPromise = null;
        }
    })();
}

export async function refreshCatalogCache() {
    if (activeStreamController) {
        activeStreamController.abort();
        activeStreamController = null;
    }
    if (notifyTimeoutId) {
        clearTimeout(notifyTimeoutId);
        notifyTimeoutId = null;
    }
    activeInitPromise = null;

    itemsById = new Map();
    pendingPersistById.clear();
    accumulator = createKpiAccumulator();
    currentTotalCount = 0;
    currentNextOffset = 0;
    currentIsStreaming = false;
    currentIsComplete = false;
    currentRateLimited = false;
    currentCacheReady = true;

    await clearCatalogCache();
    flushSnapshot();
    ensureCatalogInitialized();
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return storeState;
}

export function useGlobalCatalogCache() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useEffect(() => {
        ensureCatalogInitialized();
    }, []);

    return {
        ...snapshot,
        refreshCatalogCache
    };
}

export function useGlobalKpis() {
    return useGlobalCatalogCache();
}

export default useGlobalKpis;
