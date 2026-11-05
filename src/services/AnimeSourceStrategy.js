export class AnimeSourceStrategy {
    async getTopAnime(params = {}) { // eslint-disable-line no-unused-vars
        throw new Error('getTopAnime(params) must be implemented by concrete AnimeSourceStrategy');
    }

    async getCategories(limit = 40) { // eslint-disable-line no-unused-vars
        return [];
    }
}
