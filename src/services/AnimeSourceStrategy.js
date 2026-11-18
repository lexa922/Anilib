import { filterAnimeList } from './animeFiltering.js';
import { paginateAnime } from './animePagination.js';

export function createAnimeSourceStrategy() {
    return {
        async getAnime() {
            throw new Error('getAnime(filters) must be implemented by concrete AnimeSourceStrategy');
        },
        async getAnimePage(filters = {}, pagination = {}, signal = null) {
            const list = await this.getAnime(filters, signal);
            return this.paginateAnime(list, pagination);
        },
        async getTopAnime(filters = {}, signal = null) {
            return this.getAnime({ ...filters, sort: '-averageRating' }, signal);
        },
        filterAnime(animeList, filters) {
            return filterAnimeList(animeList, filters);
        },
        paginateAnime(animeList, pagination) {
            return paginateAnime(animeList, pagination);
        },
        sortAnime() {
            throw new Error('sortAnime(animeList, sort) must be implemented by concrete AnimeSourceStrategy');
        },
        async getCategories() {
            return [];
        }
    };
}
