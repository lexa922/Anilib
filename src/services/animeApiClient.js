import { createKitsuAnimeStrategy } from './KitsuAnimeStrategy.js';
import { sortAnime } from './animeSorting.js';
import { filterAnimeList } from './animeFiltering.js';
import { paginateAnime } from './animePagination.js';

export function createAnimeApiClient(initialStrategy = createKitsuAnimeStrategy()) {
    let activeStrategy = initialStrategy;
    const loadedAnimeMap = new Map();
    let categoriesCache = null;

    function cacheResults(results) {
        if (Array.isArray(results)) {
            results.forEach((item) => {
                if (item && item.id) {
                    loadedAnimeMap.set(String(item.id), item);
                }
            });
        }
        return results;
    }

    return {
        setStrategy(newStrategy) {
            if (!newStrategy) {
                throw new Error('A valid strategy object must be provided.');
            }
            activeStrategy = newStrategy;
            loadedAnimeMap.clear();
            categoriesCache = null;
        },

        getStrategy() {
            return activeStrategy;
        },

        getAllLoadedAnime() {
            return Array.from(loadedAnimeMap.values());
        },

        clearCache() {
            loadedAnimeMap.clear();
        },

        sortAnime(animeList, sort) {
            if (activeStrategy && typeof activeStrategy.sortAnime === 'function') {
                return activeStrategy.sortAnime(animeList, sort);
            }
            return sortAnime(animeList, sort);
        },

        filterAnime(animeList, filters) {
            if (activeStrategy && typeof activeStrategy.filterAnime === 'function') {
                return activeStrategy.filterAnime(animeList, filters);
            }
            return filterAnimeList(animeList, filters);
        },

        paginateAnime(animeList, pagination) {
            if (activeStrategy && typeof activeStrategy.paginateAnime === 'function') {
                return activeStrategy.paginateAnime(animeList, pagination);
            }
            return paginateAnime(animeList, pagination);
        },

        async getAnime(filters = {}, signal = null) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }
            if (typeof activeStrategy.getAnime !== 'function') {
                throw new Error('getAnime not supported by active strategy.');
            }

            const results = await activeStrategy.getAnime(filters, signal);
            return cacheResults(results);
        },

        async getAnimePage(filters = {}, pagination = {}, signal = null) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }

            if (typeof activeStrategy.getAnimePage === 'function') {
                const results = await activeStrategy.getAnimePage(filters, pagination, signal);
                return cacheResults(results);
            }

            const filtered = await this.getAnime(filters, signal);
            return this.paginateAnime(filtered, pagination);
        },

        async getTopAnime(filters = {}, signal = null) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }

            const results = typeof activeStrategy.getTopAnime === 'function'
                ? await activeStrategy.getTopAnime(filters, signal)
                : await this.getAnime({ ...filters, sort: '-averageRating' }, signal);

            return cacheResults(results);
        },

        async getAnimeById(id, signal = null) {
            if (!activeStrategy || !activeStrategy.getAnimeById) {
                throw new Error('getAnimeById not supported by active strategy.');
            }
            return activeStrategy.getAnimeById(id, signal);
        },

        async getCategories(limit = 40, signal = null) {
            if (categoriesCache) {
                return categoriesCache;
            }

            if (!activeStrategy || !activeStrategy.getCategories) {
                return [];
            }

            const categories = await activeStrategy.getCategories(limit, signal);
            categoriesCache = categories;
            return categories;
        }
    };
}

export const animeApiClient = createAnimeApiClient(createKitsuAnimeStrategy());
