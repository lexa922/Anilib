import { createKitsuAnimeStrategy } from './KitsuAnimeStrategy.js';
import { sortAnime } from './animeSorting.js';

export function createAnimeApiClient(initialStrategy = createKitsuAnimeStrategy()) {
    let activeStrategy = initialStrategy;
    const loadedAnimeMap = new Map();
    let categoriesCache = null;

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

        async getTopAnime(params, signal = null) {
            if (!activeStrategy) {
                throw new Error('No strategy configured on AnimeApiClient.');
            }

            const results = await activeStrategy.getTopAnime(params, signal);

            if (Array.isArray(results)) {
                results.forEach((item) => {
                    if (item && item.id) {
                        loadedAnimeMap.set(String(item.id), item);
                    }
                });
            }

            return results;
        },

        async getAnime(params, signal = null) {
            return this.getTopAnime(params, signal);
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
