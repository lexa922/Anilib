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
            canonicalTitle: attrs.canonicalTitle || '',
            englishTitle: attrs.titles?.en || '',
            japaneseTitle: attrs.titles?.ja_jp || '',
            score: normalizedScore,
            episodes: attrs.episodeCount ?? null,
            episodeLength: attrs.episodeLength ?? null,
            totalLength: attrs.totalLength ?? null,
            status: attrs.status ?? '',
            subtype: attrs.subtype || attrs.showType || '',
            ageRating: attrs.ageRating || '',
            ageRatingGuide: attrs.ageRatingGuide || '',
            userCount: attrs.userCount || 0,
            favoritesCount: attrs.favoritesCount || 0,
            popularityRank: attrs.popularityRank ?? null,
            ratingRank: attrs.ratingRank ?? null,
            youtubeVideoId: attrs.youtubeVideoId || '',
            poster: attrs.posterImage?.large || attrs.posterImage?.medium || attrs.posterImage?.small || attrs.posterImage?.original || '',
            coverImage: attrs.coverImage?.large || attrs.coverImage?.original || attrs.coverImage?.small || '',
            synopsis: attrs.synopsis || attrs.description || '',
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
        canonicalTitle: rawItem.title || '',
        englishTitle: rawItem.englishTitle || '',
        japaneseTitle: rawItem.japaneseTitle || '',
        score: score,
        episodes: rawItem.episodes ?? null,
        episodeLength: rawItem.episodeLength ?? null,
        totalLength: rawItem.totalLength ?? null,
        status: rawItem.status ?? '',
        subtype: rawItem.subtype || rawItem.type || 'TV',
        ageRating: rawItem.ageRating || '',
        ageRatingGuide: rawItem.ageRatingGuide || '',
        userCount: rawItem.userCount || 0,
        favoritesCount: rawItem.favoritesCount || 0,
        popularityRank: rawItem.popularityRank ?? null,
        ratingRank: rawItem.ratingRank ?? null,
        youtubeVideoId: rawItem.youtubeVideoId || '',
        poster: poster,
        coverImage: rawItem.coverImage || '',
        synopsis: rawItem.synopsis || '',
        genres: rawItem.genres || [],
        startDate: mockYear ? `${mockYear}-01-01` : null,
        endDate: null,
        year: mockYear
    };
}
