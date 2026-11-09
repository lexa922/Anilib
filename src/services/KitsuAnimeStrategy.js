import { normalizeAnime } from '../utils/adapters.js';
import { sortAnime, resolveServerSort } from './animeSorting.js';

export function createKitsuAnimeStrategy(baseUrl = 'https://kitsu.io/api/edge') {
    return {
        baseUrl,

        sortAnime(animeList, sort) {
            return sortAnime(animeList, sort);
        },

        resolveSortParam(sort) {
            return resolveServerSort(sort);
        },

        async getTopAnime(params = {}, signal = null) {
            const limit = params.limit || 12;
            const page = params.page || 1;
            const sortParam = resolveServerSort(params.sort);
            const textQuery = params.query || params.text || '';

            const genresSet = new Set(
                Array.isArray(params.genres)
                    ? params.genres
                    : (params.genre && params.genre !== 'Всі' ? [params.genre] : [])
            );
            if (params.category && params.category !== 'all' && params.category !== 'Всі') {
                genresSet.add(params.category);
            }
            const genres = Array.from(genresSet);

            const status = params.status && params.status !== 'all' ? params.status : null;
            const yearFrom = params.yearFrom !== '' && params.yearFrom !== undefined && params.yearFrom !== null
                ? Number(params.yearFrom)
                : null;
            const yearTo = params.yearTo !== '' && params.yearTo !== undefined && params.yearTo !== null
                ? Number(params.yearTo)
                : null;

            const targetCount = page * limit;
            const matched = [];
            let currentApiOffset = (page - 1) * limit;
            const batchSize = 20;
            let reachedEnd = false;
            let requestCount = 0;
            const MAX_REQUESTS = 12;

            while (matched.length < targetCount && !reachedEnd && requestCount < MAX_REQUESTS) {
                if (signal && signal.aborted) {
                    const abortError = new Error('Request was aborted');
                    abortError.name = 'AbortError';
                    throw abortError;
                }

                requestCount++;
                const queryParams = new URLSearchParams();

                if (textQuery.trim()) {
                    queryParams.set('filter[text]', textQuery.trim());
                }

                queryParams.set('sort', sortParam);
                queryParams.set('page[limit]', String(batchSize));
                queryParams.set('page[offset]', String(currentApiOffset));
                queryParams.set('include', 'categories');

                if (genres.length > 0) {
                    queryParams.set('filter[categories]', genres.join(','));
                }

                if (status) {
                    queryParams.set('filter[status]', status);
                }

                if (yearFrom !== null && yearTo !== null) {
                    if (yearFrom === yearTo) {
                        queryParams.set('filter[year]', String(yearFrom));
                    } else {
                        queryParams.set('filter[year]', `${yearFrom}..${yearTo}`);
                    }
                } else if (yearFrom !== null) {
                    queryParams.set('filter[year]', `${yearFrom}..`);
                } else if (yearTo !== null) {
                    queryParams.set('filter[year]', `..${yearTo}`);
                }

                const response = await fetch(`${baseUrl}/anime?${queryParams.toString()}`, {
                    signal,
                    headers: {
                        'Accept': 'application/vnd.api+json',
                        'Content-Type': 'application/vnd.api+json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Kitsu API error: ${response.status} ${response.statusText}`);
                }

                const json = await response.json();
                const data = json.data || [];

                if (data.length < batchSize) {
                    reachedEnd = true;
                }

                const categoryMap = new Map();
                (json.included || []).forEach((inc) => {
                    if (inc.type === 'categories' && inc.attributes?.title) {
                        categoryMap.set(inc.id, inc.attributes.title);
                    }
                });

                for (const item of data) {
                    const itemGenres = (item.relationships?.categories?.data || [])
                        .map((cat) => ({ id: String(cat.id), name: categoryMap.get(cat.id) }))
                        .filter((g) => Boolean(g.name));

                    const normalized = normalizeAnime({
                        ...item,
                        genres: itemGenres
                    });

                    if (genres.length > 1) {
                        const genreNames = itemGenres.map((g) => g.name);
                        const hasAll = genres.every((sg) => genreNames.includes(sg));
                        if (!hasAll) continue;
                    }

                    if (!matched.some((m) => m.id === normalized.id)) {
                        matched.push(normalized);
                    }
                }

                currentApiOffset += batchSize;
            }

            const sorted = sortAnime(matched, sortParam);
            const startIndex = (page - 1) * limit;
            return sorted.slice(startIndex, startIndex + limit);
        },

        async getAnime(params = {}, signal = null) {
            return this.getTopAnime(params, signal);
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
