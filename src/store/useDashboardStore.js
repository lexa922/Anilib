import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_FILTERS } from '../constants/filterConstants.js';
import { DEFAULT_SORT } from '../constants/sortOptions.js';

const VALID_CHART_TYPES = new Set(['bar', 'line', 'area', 'scatter']);
const VALID_CHART_DIMENSIONS = new Set([
    'hypeVsQuality',
    'cultRatio',
    'marathon',
    'seasons',
    'scoreDist',
    'ageAndSubtype'
]);

function applyThemeToDocument(theme) {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function getInitialTheme() {
    try {
        if (typeof localStorage !== 'undefined') {
            const legacy = localStorage.getItem('anilib_theme');
            if (legacy === 'light') {
                return 'light';
            }
        }
    } catch (err) {
        void err;
    }
    return 'dark';
}

function createFreshFilters() {
    return {
        ...INITIAL_FILTERS,
        genres: []
    };
}

function toCompactFavorite(anime) {
    return {
        id: String(anime.id),
        title: anime.title || 'Без назви',
        score: anime.score ?? null,
        episodes: anime.episodes ?? null,
        status: anime.status ?? '',
        subtype: anime.subtype || '',
        startDate: anime.startDate || null,
        year: anime.year ?? null,
        userCount: anime.userCount || 0,
        poster: anime.poster || '',
        genres: Array.isArray(anime.genres) ? [...anime.genres] : []
    };
}

export const useDashboardStore = create(
    persist(
        (set) => ({
            theme: getInitialTheme(),
            filters: createFreshFilters(),
            sort: DEFAULT_SORT,
            currentPage: 1,
            favorites: {},
            chartType: 'bar',
            chartGroupBy: 'hypeVsQuality',
            profileChartType: 'bar',

            toggleTheme: () => {
                set((state) => {
                    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
                    applyThemeToDocument(nextTheme);
                    return { theme: nextTheme };
                });
            },

            setTheme: (theme) => {
                if (theme !== 'dark' && theme !== 'light') return;
                applyThemeToDocument(theme);
                set({ theme });
            },

            setFilter: (key, value) => {
                set((state) => ({
                    filters: {
                        ...state.filters,
                        [key]: Array.isArray(value) ? [...value] : value
                    },
                    currentPage: 1
                }));
            },

            setFilters: (partial) => {
                if (!partial || typeof partial !== 'object') return;
                set((state) => ({
                    filters: {
                        ...state.filters,
                        ...partial,
                        genres: Array.isArray(partial.genres)
                            ? [...partial.genres]
                            : state.filters.genres
                    },
                    currentPage: 1
                }));
            },

            toggleGenre: (genreName) => {
                if (!genreName) return;
                set((state) => {
                    const currentGenres = state.filters.genres || [];
                    const exists = currentGenres.includes(genreName);
                    const nextGenres = exists
                        ? currentGenres.filter((g) => g !== genreName)
                        : [...currentGenres, genreName];

                    return {
                        filters: {
                            ...state.filters,
                            genres: nextGenres
                        },
                        currentPage: 1
                    };
                });
            },

            resetFilters: () => {
                set({
                    filters: createFreshFilters(),
                    currentPage: 1
                });
            },

            setSort: (sort) => {
                set({
                    sort: sort || DEFAULT_SORT,
                    currentPage: 1
                });
            },

            setCurrentPage: (page) => {
                set({
                    currentPage: Math.max(1, Number(page) || 1)
                });
            },

            hydrateFromUrl: (params = {}) => {
                set({
                    filters: {
                        query: params.query ?? INITIAL_FILTERS.query,
                        genres: Array.isArray(params.genres) ? [...params.genres] : [],
                        status: params.status || INITIAL_FILTERS.status,
                        yearFrom: params.yearFrom ?? INITIAL_FILTERS.yearFrom,
                        yearTo: params.yearTo ?? INITIAL_FILTERS.yearTo
                    },
                    sort: params.sort || DEFAULT_SORT,
                    currentPage: Math.max(1, Number(params.page) || 1)
                });
            },

            toggleFavorite: (anime) => {
                if (!anime?.id) return;
                const key = String(anime.id);
                set((state) => {
                    if (state.favorites[key]) {
                        const nextFavorites = { ...state.favorites };
                        delete nextFavorites[key];
                        return { favorites: nextFavorites };
                    }
                    return {
                        favorites: {
                            ...state.favorites,
                            [key]: toCompactFavorite(anime)
                        }
                    };
                });
            },

            removeFavorite: (id) => {
                if (!id) return;
                const key = String(id);
                set((state) => {
                    if (!state.favorites[key]) return state;
                    const nextFavorites = { ...state.favorites };
                    delete nextFavorites[key];
                    return { favorites: nextFavorites };
                });
            },

            clearFavorites: () => {
                set({ favorites: {} });
            },

            setChartType: (chartType) => {
                if (!VALID_CHART_TYPES.has(chartType)) return;
                set({ chartType });
            },

            setChartGroupBy: (chartGroupBy) => {
                if (!VALID_CHART_DIMENSIONS.has(chartGroupBy)) return;
                set({ chartGroupBy });
            },

            setProfileChartType: (profileChartType) => {
                if (!VALID_CHART_TYPES.has(profileChartType)) return;
                set({ profileChartType });
            }
        }),
        {
            name: 'anilib-dashboard-store',
            partialize: (state) => ({
                theme: state.theme,
                favorites: state.favorites,
                chartType: state.chartType,
                chartGroupBy: state.chartGroupBy,
                profileChartType: state.profileChartType
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.theme) {
                    applyThemeToDocument(state.theme);
                }
                if (state && !VALID_CHART_DIMENSIONS.has(state.chartGroupBy)) {
                    state.setChartGroupBy('hypeVsQuality');
                }
                if (state && !VALID_CHART_TYPES.has(state.chartType)) {
                    state.setChartType('bar');
                }
            }
        }
    )
);

applyThemeToDocument(useDashboardStore.getState().theme);

export const selectTheme = (state) => state.theme;
export const selectFilters = (state) => state.filters;
export const selectSort = (state) => state.sort;
export const selectCurrentPage = (state) => state.currentPage;
export const selectFavorites = (state) => state.favorites;
export const selectFavoritesCount = (state) => Object.keys(state.favorites).length;
export const selectIsFavorite = (id) => (state) => Boolean(id && state.favorites[String(id)]);
export const selectChartType = (state) => state.chartType;
export const selectChartGroupBy = (state) => state.chartGroupBy;
export const selectProfileChartType = (state) => state.profileChartType;
export const selectHasActiveFilters = (state) => Boolean(
    state.filters.query.trim() ||
    state.filters.genres.length > 0 ||
    (state.filters.status && state.filters.status !== 'all') ||
    state.filters.yearFrom ||
    state.filters.yearTo
);
