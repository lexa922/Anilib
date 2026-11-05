import { AnimeSourceStrategy } from './AnimeSourceStrategy.js';
import { normalizeAnime } from '../utils/adapters.js';

export class JikanAnimeStrategy extends AnimeSourceStrategy {
    constructor(baseUrl = 'https://api.jikan.moe/v4') {
        super();
        this.baseUrl = baseUrl;
    }

    async getTopAnime(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.limit) {
            queryParams.set('limit', String(params.limit));
        }

        const response = await fetch(`${this.baseUrl}/top/anime?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        return (json.data || []).map(normalizeAnime);
    }
}
