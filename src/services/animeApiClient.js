import { KitsuAnimeStrategy } from './KitsuAnimeStrategy.js';

export class AnimeApiClient {

    constructor(initialStrategy = new KitsuAnimeStrategy()) {
        this.strategy = initialStrategy;
        this.loadedAnimeMap = new Map();
        this.categoriesCache = null;
    }

    setStrategy(newStrategy) {
        if (!newStrategy) {
            throw new Error('A valid strategy instance must be provided.');
        }
        this.strategy = newStrategy;
        this.clearCache();
        this.categoriesCache = null;
    }

    getStrategy() {
        return this.strategy;
    }

    getAllLoadedAnime() {
        return Array.from(this.loadedAnimeMap.values());
    }

    clearCache() {
        this.loadedAnimeMap.clear();
    }

    async getTopAnime(params) {
        if (!this.strategy) {
            throw new Error('No strategy configured on AnimeApiClient.');
        }

        const results = await this.strategy.getTopAnime(params);

        if (Array.isArray(results)) {
            results.forEach((item) => {
                if (item && item.id) {
                    this.loadedAnimeMap.set(String(item.id), item);
                }
            });
        }

        return results;
    }

    async getCategories(limit = 40) {
        if (this.categoriesCache) {
            return this.categoriesCache;
        }

        if (!this.strategy || !this.strategy.getCategories) {
            return [];
        }

        const categories = await this.strategy.getCategories(limit);
        this.categoriesCache = categories;
        return categories;
    }
}

export const animeApiClient = new AnimeApiClient(new KitsuAnimeStrategy());
