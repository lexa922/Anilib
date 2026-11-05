export function normalizeAnime(rawItem) {
    if (!rawItem) return null;

    if (rawItem.attributes) {
        const attrs = rawItem.attributes;
        const rating = attrs.averageRating;
        const normalizedScore = rating ? (parseFloat(rating) / 10).toFixed(1) : null;
        const rawDate = attrs.startDate || null;
        const parsedYear = rawDate ? new Date(rawDate).getFullYear() : null;

        return {
            id: String(rawItem.id),
            title: attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || attrs.titles?.ja_jp || 'Без назви',
            score: normalizedScore,
            episodes: attrs.episodeCount ?? null,
            status: attrs.status ?? '',
            poster: attrs.posterImage?.medium || attrs.posterImage?.small || attrs.posterImage?.original || '',
            synopsis: attrs.synopsis || '',
            genres: rawItem.genres || [],
            startDate: rawDate,
            endDate: attrs.endDate || null,
            year: parsedYear
        };
    }

    const id = rawItem.id ?? rawItem.mal_id;
    const score = rawItem.score != null ? Number(rawItem.score).toFixed(1) : null;
    const poster = rawItem.poster || rawItem.images?.jpg?.image_url || '';
    const mockYear = rawItem.year ?? null;

    return {
        id: String(id),
        title: rawItem.title || 'Без назви',
        score: score,
        episodes: rawItem.episodes ?? null,
        status: rawItem.status ?? '',
        poster: poster,
        synopsis: rawItem.synopsis || '',
        genres: rawItem.genres || [],
        startDate: mockYear ? `${mockYear}-01-01` : null,
        endDate: null,
        year: mockYear
    };
}
