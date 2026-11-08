export function createAnimeSourceStrategy() {
    return {
        async getTopAnime() {
            throw new Error('getTopAnime(params) must be implemented by concrete AnimeSourceStrategy');
        },
        sortAnime() {
            throw new Error('sortAnime(animeList, sort) must be implemented by concrete AnimeSourceStrategy');
        },
        async getCategories() {
            return [];
        }
    };
}
