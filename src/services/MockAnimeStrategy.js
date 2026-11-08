import { MOCK_ANIME_LIST, MOCK_GENRES } from '../data/mockAnime.js';
import { normalizeAnime } from '../utils/adapters.js';
import { sortAnime, resolveServerSort } from './animeSorting.js';

export function createMockAnimeStrategy(mockData = MOCK_ANIME_LIST) {
    function getTopAnimeSync(params = {}) {
        const limit = params.limit || 12;
        const page = params.page || 1;
        const sort = resolveServerSort(params.sort);
        const query = (params.query || params.text || '').trim().toLowerCase();

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

        let list = mockData.map(normalizeAnime);

        if (query) {
            list = list.filter((anime) =>
                (anime.title || '').toLowerCase().includes(query)
            );
        }

        if (genres.length > 0) {
            list = list.filter((anime) => {
                const names = (anime.genres || []).map((g) =>
                    (typeof g === 'string' ? g : g.name).toLowerCase()
                );
                return genres.every((sg) => names.includes(sg.toLowerCase()));
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

        list = sortAnime(list, sort);

        const startIndex = (page - 1) * limit;
        return list.slice(startIndex, startIndex + limit);
    }

    return {
        sortAnime(list, sort) {
            return sortAnime(list, sort);
        },

        getTopAnimeSync,

        async getTopAnime(params = {}, signal = null) {
            if (signal && signal.aborted) {
                const err = new Error('Request was aborted');
                err.name = 'AbortError';
                throw err;
            }
            return getTopAnimeSync(params);
        },

        async getAnime(params = {}, signal = null) {
            return this.getTopAnime(params, signal);
        },

        async getAnimeById(id) {
            const found = mockData.find((a) => String(a.id) === String(id));
            if (!found) throw new Error(`Anime not found: ${id}`);
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
