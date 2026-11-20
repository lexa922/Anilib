export function parseFilterParams(params = {}) {
    const textQuery = (params.query || params.text || '').trim();

    const genresSet = new Set(
        Array.isArray(params.genres)
            ? params.genres
            : (params.genre && params.genre !== 'Всі' ? [params.genre] : [])
    );
    if (params.category && params.category !== 'all' && params.category !== 'Всі') {
        genresSet.add(params.category);
    }

    const status = params.status && params.status !== 'all' ? params.status : null;

    const yearFrom = params.yearFrom !== '' && params.yearFrom !== undefined && params.yearFrom !== null
        ? Number(params.yearFrom)
        : null;
    const yearTo = params.yearTo !== '' && params.yearTo !== undefined && params.yearTo !== null
        ? Number(params.yearTo)
        : null;

    return {
        textQuery,
        genres: Array.from(genresSet),
        status,
        yearFrom: yearFrom !== null && !Number.isNaN(yearFrom) ? yearFrom : null,
        yearTo: yearTo !== null && !Number.isNaN(yearTo) ? yearTo : null
    };
}

function toKitsuCategorySlug(genre) {
    return String(genre)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function buildKitsuFilterQuery(filters, queryParams) {
    if (filters.textQuery) {
        queryParams.set('filter[text]', filters.textQuery);
    }

    if (filters.genres.length > 0) {
        const slugs = filters.genres.map(toKitsuCategorySlug).filter(Boolean);
        if (slugs.length > 0) {
            queryParams.set('filter[categories]', slugs.join(','));
        }
    }

    if (filters.status) {
        queryParams.set('filter[status]', filters.status);
    }

    if (filters.yearFrom !== null && filters.yearTo !== null) {
        if (filters.yearFrom === filters.yearTo) {
            queryParams.set('filter[year]', String(filters.yearFrom));
        } else {
            queryParams.set('filter[year]', `${filters.yearFrom}..${filters.yearTo}`);
        }
    } else if (filters.yearFrom !== null) {
        queryParams.set('filter[year]', `${filters.yearFrom}..`);
    } else if (filters.yearTo !== null) {
        queryParams.set('filter[year]', `..${filters.yearTo}`);
    }
}

export function filterByGenres(animeList = [], genres = []) {
    if (!Array.isArray(animeList) || genres.length === 0) {
        return animeList || [];
    }

    const targetGenres = genres.map((g) => g.toLowerCase());
    return animeList.filter((anime) => {
        const names = (anime.genres || []).map((g) =>
            (typeof g === 'string' ? g : g.name || '').toLowerCase()
        );
        return targetGenres.every((sg) => names.includes(sg));
    });
}

export function filterAnimeList(animeList = [], rawFilters = {}) {
    if (!Array.isArray(animeList)) return [];

    const filters = parseFilterParams(rawFilters);
    let result = animeList;

    if (filters.textQuery) {
        const q = filters.textQuery.toLowerCase();
        result = result.filter((anime) => (anime.title || '').toLowerCase().includes(q));
    }

    if (filters.genres.length > 0) {
        result = filterByGenres(result, filters.genres);
    }

    if (filters.status) {
        const targetStatus = filters.status.toLowerCase();
        result = result.filter((anime) => (anime.status || '').toLowerCase() === targetStatus);
    }

    if (filters.yearFrom !== null) {
        result = result.filter((anime) => anime.year && anime.year >= filters.yearFrom);
    }

    if (filters.yearTo !== null) {
        result = result.filter((anime) => anime.year && anime.year <= filters.yearTo);
    }

    return result;
}
