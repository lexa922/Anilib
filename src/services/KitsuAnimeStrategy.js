import { AnimeSourceStrategy } from './AnimeSourceStrategy.js';
import { normalizeAnime } from '../utils/adapters.js';

export class KitsuAnimeStrategy extends AnimeSourceStrategy {
    constructor(baseUrl = 'https://kitsu.io/api/edge') {
        super();
        this.baseUrl = baseUrl;
    }

    async getTopAnime(params = {}) {
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

        const targetCount = page * limit;
        const matched = [];
        let currentApiOffset = (page - 1) * limit;
        const batchSize = 20;
        let reachedEnd = false;
        let requestCount = 0;
        const MAX_REQUESTS = 12;

        while (matched.length < targetCount && !reachedEnd && requestCount < MAX_REQUESTS) {
            requestCount++;
            const queryParams = new URLSearchParams();
            queryParams.set('sort', '-averageRating');
            queryParams.set('page[limit]', String(batchSize));
            queryParams.set('page[offset]', String(currentApiOffset));
            queryParams.set('include', 'categories');

            if (genres.length > 0) {
                queryParams.set('filter[categories]', genres.join(','));
            }
            if (status) {
                queryParams.set('filter[status]', status);
            }

            const response = await fetch(`${this.baseUrl}/anime?${queryParams.toString()}`, {
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Kitsu API error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            const data = json.data || [];

            if (data.length < batchSize) {
                reachedEnd = true;
            }

            const categoryMap = new Map();
            (json.included || []).forEach((inc) => {
                if (inc.type === 'categories' && inc.attributes?.title) {
                    categoryMap.set(inc.id, inc.attributes.title);
                }
            });

            for (const item of data) {
                const itemGenres = (item.relationships?.categories?.data || [])
                    .map((cat) => ({ id: String(cat.id), name: categoryMap.get(cat.id) }))
                    .filter((g) => Boolean(g.name));

                const normalized = normalizeAnime({
                    ...item,
                    genres: itemGenres
                });

                if (genres.length > 0) {
                    const genreNames = itemGenres.map((g) => g.name);
                    const hasAll = genres.every((sg) => genreNames.includes(sg));
                    if (!hasAll) continue;
                }

                if (status && (normalized.status || '').toLowerCase() !== status.toLowerCase()) {
                    continue;
                }

                if (yearFrom !== null && !isNaN(yearFrom)) {
                    if (!normalized.year || normalized.year < yearFrom) continue;
                }
                if (yearTo !== null && !isNaN(yearTo)) {
                    if (!normalized.year || normalized.year > yearTo) continue;
                }

                if (!matched.some((m) => m.id === normalized.id)) {
                    matched.push(normalized);
                }
            }

            currentApiOffset += batchSize;
        }

        const startIndex = (page - 1) * limit;
        return matched.slice(startIndex, startIndex + limit);
    }

    async getCategories(limit = 40) {
        const response = await fetch(`${this.baseUrl}/categories?page[limit]=${limit}&sort=-totalMediaCount`, {
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Kitsu categories: ${response.status}`);
        }

        const json = await response.json();
        return (json.data || []).map((item) => ({
            id: String(item.id),
            title: item.attributes?.title || item.attributes?.slug,
            slug: item.attributes?.slug || ''
        }));
    }
}
