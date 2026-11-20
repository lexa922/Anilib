import { useState, useEffect } from 'react';
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

export function useGlobalKpis() {
    const [state, setState] = useState(() => {
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
            isStreaming: true,
            isComplete: false
        };
    });

    useEffect(() => {
        const cached = readCachedKpis();
        if (cached) {
            return undefined;
        }

        const controller = new AbortController();
        const acc = createKpiAccumulator();

        animeApiClient.streamAllAnimeStats({
            signal: controller.signal,
            onBatch: ({ items, processedCount, totalCount }) => {
                if (controller.signal.aborted) return;
                accumulateKpiBatch(acc, items);
                setState({
                    kpiData: buildKpisFromAccumulator(acc),
                    processedCount,
                    totalCount,
                    isStreaming: true,
                    isComplete: false
                });
            }
        })
            .then((result) => {
                if (controller.signal.aborted) return;
                const finalKpis = buildKpisFromAccumulator(acc);
                const isComplete = Boolean(result?.completed);
                const finalTotal = result?.totalCount || acc.totalCount;

                setState({
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
            .catch((err) => {
                if (err?.name === 'AbortError' || controller.signal.aborted) {
                    return;
                }
                setState((prev) => ({
                    ...prev,
                    isStreaming: false
                }));
            });

        return () => {
            controller.abort();
        };
    }, []);

    return state;
}

export default useGlobalKpis;
