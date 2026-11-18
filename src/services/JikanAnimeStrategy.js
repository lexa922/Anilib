import { normalizeAnime } from '../utils/adapters.js';
import { sortAnime } from './animeSorting.js';
import { filterAnimeList } from './animeFiltering.js';
import { normalizePagination, paginateAnime } from './animePagination.js';

const JIKAN_SORT_MAP = {
    '-averageRating': { order_by: 'score', sort: 'desc' },
    'averageRating': { order_by: 'score', sort: 'asc' },
    '-startDate': { order_by: 'start_date', sort: 'desc' },
    'startDate': { order_by: 'start_date', sort: 'asc' },
    '-userCount': { order_by: 'popularity', sort: 'asc' }
};

export function createJikanAnimeStrategy(baseUrl = 'https://api.jikan.moe/v4') {
    async function fetchJikanList(endpoint, queryParams, signal, sort) {
        const response = await fetch(`${baseUrl}${endpoint}?${queryParams.toString()}`, { signal });
        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const normalized = (json.data || []).map(normalizeAnime);
        return sort ? sortAnime(normalized, sort) : normalized;
    }

    return {
        baseUrl,

        sortAnime(list, sort) {
            return sortAnime(list, sort);
        },

        filterAnime(list, filters) {
            return filterAnimeList(list, filters);
        },

        paginateAnime(list, pagination) {
            return paginateAnime(list, pagination);
        },

        async getAnime(filters = {}, signal = null) {
            const queryParams = new URLSearchParams();
            const textQuery = (filters.query || filters.text || '').trim();
            if (textQuery) {
                queryParams.set('q', textQuery);
            }
            const sortConfig = JIKAN_SORT_MAP[filters.sort];
            if (sortConfig) {
                queryParams.set('order_by', sortConfig.order_by);
                queryParams.set('sort', sortConfig.sort);
            }

            return fetchJikanList('/anime', queryParams, signal, filters.sort);
        },

        async getAnimePage(filters = {}, pagination = {}, signal = null) {
            const { page, limit } = normalizePagination(pagination);
            const queryParams = new URLSearchParams();
            queryParams.set('page', String(page));
            queryParams.set('limit', String(limit));

            const textQuery = (filters.query || filters.text || '').trim();
            if (textQuery) {
                queryParams.set('q', textQuery);
            }
            const sortConfig = JIKAN_SORT_MAP[filters.sort];
            if (sortConfig) {
                queryParams.set('order_by', sortConfig.order_by);
                queryParams.set('sort', sortConfig.sort);
            }

            return fetchJikanList('/anime', queryParams, signal, filters.sort);
        },

        async getTopAnime(pagination = {}, signal = null) {
            const { page, limit } = normalizePagination(pagination);
            const queryParams = new URLSearchParams();
            queryParams.set('page', String(page));
            queryParams.set('limit', String(limit));

            return fetchJikanList('/top/anime', queryParams, signal);
        },

        async getAnimeById(id, signal = null) {
            const response = await fetch(`${baseUrl}/anime/${id}`, { signal });
            if (!response.ok) {
                const notFoundError = new Error(`Аніме з ID "${id}" не знайдено`);
                notFoundError.status = response.status;
                throw notFoundError;
            }
            const json = await response.json();
            return normalizeAnime(json.data);
        },

        async getCategories() {
            return [];
        }
    };
}
