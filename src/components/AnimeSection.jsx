import "./AnimeSection.css";
import AnimeCard from './AnimeCard';
import AnimeListSkeleton from './AnimeListSkeleton';
import SortControl from './SortControl';
import FilterPanel from './filters/FilterPanel.jsx';
import { useMemo, useRef, useCallback } from "react";
import { animeApiClient } from "../services/index.js";
import { useFetch } from "../hooks/index.js";
import {
    useDashboardStore,
    selectHasActiveFilters,
    selectSort,
    selectCurrentPage
} from '../store/index.js';

function AnimeSection({
    animeList = [],
    loading = false,
    pageSize = 12
}) {
    const searchQuery = useDashboardStore((state) => state.filters.query);
    const hasActiveFilters = useDashboardStore(selectHasActiveFilters);
    const sort = useDashboardStore(selectSort);
    const currentPage = useDashboardStore(selectCurrentPage);

    const setFilter = useDashboardStore((state) => state.setFilter);
    const resetFilters = useDashboardStore((state) => state.resetFilters);
    const setSort = useDashboardStore((state) => state.setSort);
    const setCurrentPage = useDashboardStore((state) => state.setCurrentPage);

    const fetchCategories = useCallback((signal) => {
        return animeApiClient.getCategories(40, signal);
    }, []);
    const { data: categoriesData } = useFetch(fetchCategories, []);

    const allAvailableGenres = useMemo(() => {
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        const set = new Set();
        categories.forEach((cat) => {
            const name = typeof cat === 'string' ? cat : (cat.title || cat.name || cat.slug);
            if (name) set.add(name);
        });
        animeList.forEach((anime) => {
            (anime.genres || []).forEach((g) => {
                const name = typeof g === 'string' ? g : g.name;
                if (name) set.add(name);
            });
        });
        return Array.from(set).sort();
    }, [categoriesData, animeList]);

    const searchInputRef = useRef(null);

    const handleClearSearch = () => {
        setFilter('query', '');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleSortChange = (nextSort) => {
        setSort(nextSort);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 1) return;
        setCurrentPage(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isNextDisabled = loading || animeList.length < pageSize;

    const countNoun = animeList.length === 1
        ? 'тайтл'
        : (animeList.length >= 2 && animeList.length <= 4 ? 'тайтли' : 'тайтлів');

    return (
        <div className="Anime-section">
            <div className="Anime-list-container">
                <div className="Anime-results-header">
                    <div className="Anime-search-wrap">
                        {loading ? (
                            <span className="Anime-search-spinner" aria-hidden="true" />
                        ) : (
                            <span className="Anime-search-icon" aria-hidden="true">🔍</span>
                        )}
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="Anime-search-input"
                            placeholder="Пошук аніме за назвою..."
                            value={searchQuery}
                            onChange={(e) => setFilter('query', e.target.value)}
                            aria-label="Пошук аніме за назвою"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="Anime-search-clear"
                                onClick={handleClearSearch}
                                aria-label="Очистити пошук"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="Anime-results-meta">
                        <div className="Anime-results-info">
                            <span>
                                {loading ? (
                                    'Пошук тайтлів...'
                                ) : (
                                    <>
                                        Показано: <strong>{animeList.length}</strong> {countNoun}
                                    </>
                                )}
                            </span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className="Anime-reset-btn"
                                    onClick={resetFilters}
                                    disabled={loading}
                                    title="Скинути всі активні фільтри та пошук"
                                >
                                    Скинути ✕
                                </button>
                            )}
                        </div>

                        <SortControl
                            sort={sort}
                            onSortChange={handleSortChange}
                            disabled={loading}
                        />
                    </div>
                </div>

                {loading ? (
                    <AnimeListSkeleton count={pageSize} />
                ) : (
                    <div className="Anime-list-section">
                        {animeList.map((anime) => (
                            <AnimeCard anime={anime} key={anime.id} />
                        ))}
                        {animeList.length === 0 && (
                            <div className="Anime-empty-msg">
                                <p>За вказаними фільтрами не знайдено жодного тайтла.</p>
                                {hasActiveFilters && (
                                    <button type="button" className="Anime-reset-btn" onClick={resetFilters}>
                                        Скинути фільтри
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="Pagination-controls">
                    <button
                        type="button"
                        className="Pagination-btn"
                        disabled={currentPage <= 1 || loading}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        ← Попередня
                    </button>
                    <span className="Pagination-info">
                        Сторінка <strong>{currentPage}</strong> {loading && ' (Завантаження...)'}
                    </span>
                    <button
                        type="button"
                        className="Pagination-btn"
                        disabled={isNextDisabled}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        Наступна (+{pageSize}) →
                    </button>
                </div>
            </div>

            <FilterPanel
                categories={allAvailableGenres}
                disabled={loading}
            />
        </div>
    );
}

export default AnimeSection;
