import { createKitsuAnimeStrategy } from './KitsuAnimeStrategy.js';
import { sortAnime } from './animeSorting.js';
import { filterAnimeList } from './animeFiltering.js';
import { paginateAnime } from './animePagination.js';

export function createAnimeApiClient(initialStrategy = createKitsuAnimeStrategy()) {
    let activeStrategy = initialStrategy;
    let categoriesCache = null;

    return {
        setStrategy(newStrategy) {
            if (!newStrategy) {
                throw new Error('A valid strategy object must be provided.');
            }
            activeStrategy = newStrategy;
            categoriesCache = null;
        },

        getStrategy() {
            return activeStrategy;
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

            return activeStrategy.getAnime(filters, signal);
        },

        async getAnimePage(filters = {}, pagination = {}, signal = null) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }

            if (typeof activeStrategy.getAnimePage === 'function') {
                return activeStrategy.getAnimePage(filters, pagination, signal);
            }

            const filtered = await this.getAnime(filters, signal);
            return this.paginateAnime(filtered, pagination);
        },

        async getTopAnime(filters = {}, signal = null) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }

            return typeof activeStrategy.getTopAnime === 'function'
                ? activeStrategy.getTopAnime(filters, signal)
                : this.getAnime({ ...filters, sort: '-averageRating' }, signal);
        },

        async streamAllAnimeStats({ onBatch, signal } = {}) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }

            if (typeof activeStrategy.streamAllAnimeStats === 'function') {
                return activeStrategy.streamAllAnimeStats({ onBatch, signal });
            }

            const list = await this.getAnime({}, signal);
            if (typeof onBatch === 'function') {
                onBatch({
                    items: list,
                    processedCount: list.length,
                    totalCount: list.length
                });
            }
            return { completed: true, totalCount: list.length };
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
