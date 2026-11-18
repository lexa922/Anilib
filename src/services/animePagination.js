const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

export function normalizePagination(pagination = {}) {
    const rawPage = Number(pagination.page);
    const rawLimit = Number(pagination.limit);

    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
    const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

export function paginateAnime(animeList = [], pagination = {}) {
    if (!Array.isArray(animeList)) return [];
    const { offset, limit } = normalizePagination(pagination);
    return animeList.slice(offset, offset + limit);
}
