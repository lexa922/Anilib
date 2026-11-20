import { MOCK_ANIME_LIST, MOCK_GENRES } from '../data/mockAnime.js';
import { normalizeAnime } from '../utils/adapters.js';
import { sortAnime, resolveServerSort } from './animeSorting.js';
import { filterAnimeList } from './animeFiltering.js';
import { paginateAnime } from './animePagination.js';

export function createMockAnimeStrategy(mockData = MOCK_ANIME_LIST) {
    function getAnimeSync(filters = {}) {
        const sort = resolveServerSort(filters.sort);
        const normalized = mockData.map(normalizeAnime);
        const filtered = filterAnimeList(normalized, filters);
        return sortAnime(filtered, sort);
    }

    return {
        name: 'mock',
        sortAnime(list, sort) {
            return sortAnime(list, sort);
        },

        filterAnime(list, filters) {
            return filterAnimeList(list, filters);
        },

        paginateAnime(list, pagination) {
            return paginateAnime(list, pagination);
        },

        getAnimeSync,

        async getAnime(filters = {}, signal = null) {
            if (signal && signal.aborted) {
                const err = new Error('Request was aborted');
                err.name = 'AbortError';
                throw err;
            }
            return getAnimeSync(filters);
        },

        async getAnimePage(filters = {}, pagination = {}, signal = null) {
            const filtered = await this.getAnime(filters, signal);
            return paginateAnime(filtered, pagination);
        },

        async getTopAnime(filters = {}, signal = null) {
            return this.getAnime({ ...filters, sort: '-averageRating' }, signal);
        },

        async streamAllAnimeStats({ onBatch, signal } = {}) {
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

        async getAnimeById(id) {
            const found = mockData.find((a) => String(a.id) === String(id));
            if (!found) {
                const notFoundError = new Error(`Аніме з ID "${id}" не знайдено`);
                notFoundError.status = 404;
                throw notFoundError;
            }
            return normalizeAnime(found);
        },

        async getCategories() {
            return MOCK_GENRES.filter((g) => g !== 'Всі').map((genre) => ({
                id: genre,
                title: genre,
                slug: genre.toLowerCase()
            }));
        }
    };
}
