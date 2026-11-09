import { normalizeAnime } from '../utils/adapters.js';
import { sortAnime } from './animeSorting.js';

export function createJikanAnimeStrategy(baseUrl = 'https://api.jikan.moe/v4') {
    return {
        baseUrl,

        sortAnime(list, sort) {
            return sortAnime(list, sort);
        },

        async getTopAnime(params = {}) {
            const queryParams = new URLSearchParams();
            if (params.limit) {
                queryParams.set('limit', String(params.limit));
            }
            if (params.page) {
                queryParams.set('page', String(params.page));
            }

            const response = await fetch(`${baseUrl}/top/anime?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error(`Jikan API error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            const normalized = (json.data || []).map(normalizeAnime);

            if (params.sort) {
                return sortAnime(normalized, params.sort);
            }
            return normalized;
        },

        async getAnimeById(id) {
            const response = await fetch(`${baseUrl}/anime/${id}`);
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
