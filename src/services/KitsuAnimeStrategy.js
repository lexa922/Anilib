import { normalizeAnime } from '../utils/adapters.js';
import { sortAnime, resolveServerSort } from './animeSorting.js';
import { parseFilterParams, buildKitsuFilterQuery, filterByGenres, filterAnimeList } from './animeFiltering.js';
import { normalizePagination, paginateAnime } from './animePagination.js';

const KITSU_HEADERS = {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json'
};

function waitWithSignal(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            const err = new Error('Request was aborted');
            err.name = 'AbortError';
            reject(err);
            return;
        }
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        function onAbort() {
            clearTimeout(timer);
            const err = new Error('Request was aborted');
            err.name = 'AbortError';
            reject(err);
        }
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}

export function createKitsuAnimeStrategy(baseUrl = 'https://kitsu.io/api/edge') {
    async function fetchKitsuBatch({ filters, sortParam, offset, batchSize, signal }) {
        if (signal && signal.aborted) {
            const abortError = new Error('Request was aborted');
            abortError.name = 'AbortError';
            throw abortError;
        }

        const queryParams = new URLSearchParams();
        buildKitsuFilterQuery(filters, queryParams);
        queryParams.set('sort', sortParam);
        queryParams.set('page[limit]', String(batchSize));
        queryParams.set('page[offset]', String(offset));
        queryParams.set('include', 'categories');

        const response = await fetch(`${baseUrl}/anime?${queryParams.toString()}`, {
            signal,
            headers: KITSU_HEADERS
        });

        if (!response.ok) {
            throw new Error(`Kitsu API error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const data = json.data || [];

        const categoryMap = new Map();
        (json.included || []).forEach((inc) => {
            if (inc.type === 'categories' && inc.attributes?.title) {
                categoryMap.set(inc.id, {
                    name: inc.attributes.title,
                    slug: inc.attributes.slug || ''
                });
            }
        });

        const normalizedItems = data.map((item) => {
            const itemGenres = (item.relationships?.categories?.data || [])
                .map((cat) => {
                    const entry = categoryMap.get(cat.id);
                    return entry ? { id: String(cat.id), name: entry.name, slug: entry.slug } : null;
                })
                .filter(Boolean);

            return normalizeAnime({
                ...item,
                genres: itemGenres
            });
        });

        return {
            items: normalizedItems,
            reachedEnd: data.length < batchSize
        };
    }

    async function collectMultiGenreMatches({ filters, sortParam, targetCount, signal }) {
        const matched = [];
        const batchSize = 20;
        const MAX_REQUESTS = 12;
        let currentApiOffset = 0;
        let reachedEnd = false;
        let requestCount = 0;

        while (matched.length < targetCount && !reachedEnd && requestCount < MAX_REQUESTS) {
            requestCount++;
            const batch = await fetchKitsuBatch({
                filters,
                sortParam,
                offset: currentApiOffset,
                batchSize,
                signal
            });

            reachedEnd = batch.reachedEnd;
            const refined = filterByGenres(batch.items, filters.genres);

            for (const item of refined) {
                if (!matched.some((m) => m.id === item.id)) {
                    matched.push(item);
                }
            }

            currentApiOffset += batchSize;
        }

        return sortAnime(matched, sortParam);
    }

    return {
        baseUrl,

        sortAnime(animeList, sort) {
            return sortAnime(animeList, sort);
        },

        filterAnime(animeList, filters) {
            return filterAnimeList(animeList, filters);
        },

        paginateAnime(animeList, pagination) {
            return paginateAnime(animeList, pagination);
        },

        async getAnime(filters = {}, signal = null) {
            const parsedFilters = parseFilterParams(filters);
            const sortParam = resolveServerSort(filters.sort);
            const batchSize = 20;

            if (parsedFilters.genres.length > 1) {
                return collectMultiGenreMatches({
                    filters: parsedFilters,
                    sortParam,
                    targetCount: batchSize,
                    signal
                });
            }

            const batch = await fetchKitsuBatch({
                filters: parsedFilters,
                sortParam,
                offset: 0,
                batchSize,
                signal
            });

            return batch.items;
        },

        async getAnimePage(filters = {}, pagination = {}, signal = null) {
            const parsedFilters = parseFilterParams(filters);
            const sortParam = resolveServerSort(filters.sort);
            const { page, limit, offset } = normalizePagination(pagination);

            if (parsedFilters.genres.length > 1) {
                const matched = await collectMultiGenreMatches({
                    filters: parsedFilters,
                    sortParam,
                    targetCount: page * limit,
                    signal
                });
                return paginateAnime(matched, { page, limit });
            }

            const batch = await fetchKitsuBatch({
                filters: parsedFilters,
                sortParam,
                offset,
                batchSize: limit,
                signal
            });

            return batch.items;
        },

        async getTopAnime(filters = {}, signal = null) {
            return this.getAnime({ ...filters, sort: '-averageRating' }, signal);
        },

        async streamAllAnimeStats({ onBatch, signal } = {}) {
            const pageSize = 20;
            const concurrency = 4;
            const waveDelayMs = 100;

            async function fetchStatsPage(offset) {
                const params = new URLSearchParams({
                    'fields[anime]': 'averageRating,status',
                    'page[limit]': String(pageSize),
                    'page[offset]': String(offset)
                });
                const response = await fetch(`${baseUrl}/anime?${params.toString()}`, {
                    signal,
                    headers: KITSU_HEADERS
                });

                if (response.status === 429) {
                    return { rateLimited: true, items: [], totalCount: 0 };
                }
                if (!response.ok) {
                    throw new Error(`Kitsu stats error: ${response.status} ${response.statusText}`);
                }

                const json = await response.json();
                const items = (json.data || []).map((raw) => ({
                    score: raw.attributes?.averageRating
                        ? (parseFloat(raw.attributes.averageRating) / 10).toFixed(1)
                        : null,
                    status: raw.attributes?.status ?? ''
                }));
                const totalCount = json.meta?.count ?? items.length;
                return { rateLimited: false, items, totalCount };
            }

            const firstPage = await fetchStatsPage(0);
            if (firstPage.rateLimited) {
                return { completed: false, totalCount: 0 };
            }

            const totalCount = firstPage.totalCount;
            let processedCount = firstPage.items.length;
            if (typeof onBatch === 'function') {
                onBatch({ items: firstPage.items, processedCount, totalCount });
            }

            const offsets = [];
            for (let offset = pageSize; offset < totalCount; offset += pageSize) {
                offsets.push(offset);
            }

            for (let i = 0; i < offsets.length; i += concurrency) {
                if (signal?.aborted) {
                    const err = new Error('Request was aborted');
                    err.name = 'AbortError';
                    throw err;
                }

                const waveOffsets = offsets.slice(i, i + concurrency);
                const waveResults = await Promise.all(waveOffsets.map(fetchStatsPage));

                let hitRateLimit = false;
                const waveItems = [];
                for (const res of waveResults) {
                    if (res.rateLimited) {
                        hitRateLimit = true;
                    } else if (res.items.length > 0) {
                        waveItems.push(...res.items);
                    }
                }

                if (waveItems.length > 0) {
                    processedCount += waveItems.length;
                    if (typeof onBatch === 'function') {
                        onBatch({ items: waveItems, processedCount, totalCount });
                    }
                }

                if (hitRateLimit) {
                    return { completed: false, totalCount };
                }

                if (i + concurrency < offsets.length) {
                    await waitWithSignal(waveDelayMs, signal);
                }
            }

            return { completed: true, totalCount };
        },

        async getAnimeById(id, signal = null) {
            const response = await fetch(`${baseUrl}/anime/${id}?include=categories`, {
                signal,
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    const notFoundError = new Error(`Аніме з ID "${id}" не знайдено`);
                    notFoundError.status = 404;
                    throw notFoundError;
                }
                const err = new Error(`Kitsu API error: ${response.status} ${response.statusText}`);
                err.status = response.status;
                throw err;
            }

            const json = await response.json();
            const categoryMap = new Map();
            (json.included || []).forEach((inc) => {
                if (inc.type === 'categories' && inc.attributes?.title) {
                    categoryMap.set(inc.id, inc.attributes.title);
                }
            });

            const itemGenres = (json.data?.relationships?.categories?.data || [])
                .map((cat) => ({ id: String(cat.id), name: categoryMap.get(cat.id) }))
                .filter((g) => Boolean(g.name));

            return normalizeAnime({
                ...json.data,
                genres: itemGenres
            });
        },

        async getCategories(limit = 40, signal = null) {
            const response = await fetch(`${baseUrl}/categories?page[limit]=${limit}&sort=-totalMediaCount`, {
                signal,
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Kitsu Categories error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            return (json.data || []).map((cat) => ({
                id: cat.id,
                title: cat.attributes?.title || '',
                slug: cat.attributes?.slug || ''
            }));
        }
    };
}
