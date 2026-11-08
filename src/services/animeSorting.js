export const ALLOWED_SORT_KEYS = [
    '-averageRating',
    'averageRating',
    '-startDate',
    'startDate',
    '-userCount'
];

export function resolveServerSort(sort = '-averageRating') {
    return ALLOWED_SORT_KEYS.includes(sort) ? sort : '-averageRating';
}

export function sortAnime(animeList = [], sort = '-averageRating') {
    if (!Array.isArray(animeList)) return [];
    const copy = [...animeList];

    switch (sort) {
        case '-averageRating':
            return copy.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
        case 'averageRating':
            return copy.sort((a, b) => Number(a.score || 0) - Number(b.score || 0));
        case '-startDate':
            return copy.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
        case 'startDate':
            return copy.sort((a, b) => Number(a.year || 0) - Number(b.year || 0));
        case '-userCount':
            return copy.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        default:
            return copy;
    }
}
