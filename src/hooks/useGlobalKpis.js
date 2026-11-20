import { useEffect, useSyncExternalStore } from 'react';
import { animeApiClient } from '../services/index.js';
import {
    createKpiAccumulator,
    accumulateKpiBatch,
    buildKpisFromAccumulator
} from '../utils/kpi.js';

const CACHE_KEY = 'anilib_global_kpis_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

function readCachedKpis() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.kpiData)) return null;
        if (Date.now() - (parsed.timestamp || 0) > CACHE_TTL_MS) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeCachedKpis(payload) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            ...payload,
            timestamp: Date.now()
        }));
    } catch {
        // Ignore storage quota errors
    }
}

function createInitialState() {
    const cached = readCachedKpis();
    if (cached) {
        return {
            kpiData: cached.kpiData,
            processedCount: cached.processedCount || 0,
            totalCount: cached.totalCount || 0,
            isStreaming: false,
            isComplete: Boolean(cached.isComplete)
        };
    }
    return {
        kpiData: buildKpisFromAccumulator(null),
        processedCount: 0,
        totalCount: 0,
        isStreaming: false,
        isComplete: false
    };
}

let storeState = createInitialState();
let activeStreamPromise = null;
const listeners = new Set();

function notifyListeners() {
    listeners.forEach((listener) => listener());
}

function setStoreState(next) {
    storeState = next;
    notifyListeners();
}

function ensureGlobalKpiStream() {
    if (storeState.isComplete || activeStreamPromise) {
        return;
    }

    const cached = readCachedKpis();
    if (cached) {
        setStoreState({
            kpiData: cached.kpiData,
            processedCount: cached.processedCount || 0,
            totalCount: cached.totalCount || 0,
            isStreaming: false,
            isComplete: Boolean(cached.isComplete)
        });
        return;
    }

    const acc = createKpiAccumulator();
    setStoreState({
        ...storeState,
        isStreaming: true
    });

    activeStreamPromise = animeApiClient.streamAllAnimeStats({
        onBatch: ({ items, processedCount, totalCount }) => {
            accumulateKpiBatch(acc, items);
            setStoreState({
                kpiData: buildKpisFromAccumulator(acc),
                processedCount,
                totalCount,
                isStreaming: true,
                isComplete: false
            });
        }
    })
        .then((result) => {
            const finalKpis = buildKpisFromAccumulator(acc);
            const isComplete = Boolean(result?.completed);
            const finalTotal = result?.totalCount || acc.totalCount;

            setStoreState({
                kpiData: finalKpis,
                processedCount: acc.totalCount,
                totalCount: finalTotal,
                isStreaming: false,
                isComplete
            });

            if (acc.totalCount > 0) {
                writeCachedKpis({
                    kpiData: finalKpis,
                    processedCount: acc.totalCount,
                    totalCount: finalTotal,
                    isComplete
                });
            }
        })
        .catch(() => {
            setStoreState({
                ...storeState,
                isStreaming: false
            });
        })
        .finally(() => {
            activeStreamPromise = null;
        });
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return storeState;
}

export function useGlobalKpis() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useEffect(() => {
        ensureGlobalKpiStream();
    }, []);

    return snapshot;
}

export default useGlobalKpis;
