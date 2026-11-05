import { AnimeSourceStrategy } from './AnimeSourceStrategy.js';
import { MOCK_ANIME_LIST, MOCK_GENRES } from '../data/mockAnime.js';
import { normalizeAnime } from '../utils/adapters.js';

export class MockAnimeStrategy extends AnimeSourceStrategy {
    constructor(mockData = MOCK_ANIME_LIST) {
        super();
        this.mockData = mockData;
    }

    getTopAnimeSync(params = {}) {
        const limit = params.limit || 12;
        const page = params.page || 1;
        const genres = Array.isArray(params.genres)
            ? params.genres
            : (params.genre && params.genre !== 'Всі' ? [params.genre] : []);
        const status = params.status && params.status !== 'all' ? params.status : null;
        const yearFrom = params.yearFrom !== '' && params.yearFrom !== undefined && params.yearFrom !== null
            ? Number(params.yearFrom)
            : null;
        const yearTo = params.yearTo !== '' && params.yearTo !== undefined && params.yearTo !== null
            ? Number(params.yearTo)
            : null;

        let list = this.mockData.map(normalizeAnime);

        if (genres.length > 0) {
            list = list.filter((anime) => {
                const names = (anime.genres || []).map((g) => (typeof g === 'string' ? g : g.name));
                return genres.every((sg) => names.includes(sg));
            });
        }

        if (status) {
            list = list.filter((anime) => (anime.status || '').toLowerCase() === status.toLowerCase());
        }

        if (yearFrom !== null && !isNaN(yearFrom)) {
            list = list.filter((anime) => anime.year && anime.year >= yearFrom);
        }

        if (yearTo !== null && !isNaN(yearTo)) {
            list = list.filter((anime) => anime.year && anime.year <= yearTo);
        }

        const startIndex = (page - 1) * limit;
        return list.slice(startIndex, startIndex + limit);
    }

    async getTopAnime(params = {}) {
        return this.getTopAnimeSync(params);
    }

    async getCategories() {
        return MOCK_GENRES.filter((g) => g !== 'Всі').map((genre) => ({
            id: genre,
            title: genre,
            slug: genre.toLowerCase()
        }));
    }
}
