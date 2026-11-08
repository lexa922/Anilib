import "./AnimeSection.css";
import AnimeCard from './AnimeCard';
import AnimeListSkeleton from './AnimeListSkeleton';
import SortControl from './SortControl';
import FilterPanel from './filters/FilterPanel.jsx';
import { useState, useEffect, useMemo, useRef } from "react";
import { animeApiClient } from "../services/index.js";

function AnimeSection({
    animeList = [],
    currentPage = 1,
    onPageChange,
    sort = '-averageRating',
    onSortChange,
    searchQuery = '',
    onSearchChange,
    filters = {},
    onFiltersChange,
    onResetFilters,
    loading = false
}) {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let isMounted = true;
        animeApiClient.getCategories().then((cats) => {
            if (isMounted && Array.isArray(cats)) {
                setCategories(cats);
            }
        }).catch((err) => {
            console.error('Failed to load categories:', err);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const allAvailableGenres = useMemo(() => {
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
    }, [categories, animeList]);

    const isFiltered = Boolean(
        (searchQuery && searchQuery.trim()) ||
        (Array.isArray(filters.genres) && filters.genres.length > 0) ||
        (filters.status && filters.status !== 'all') ||
        filters.yearFrom ||
        filters.yearTo
    );

    const filterKey = `${(filters.genres || []).join(',')}|${filters.status || 'all'}|${filters.yearFrom || ''}|${filters.yearTo || ''}`;

    const searchInputRef = useRef(null);

    const handleClearSearch = () => {
        if (onSearchChange) {
            onSearchChange('');
        }
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    return (
        <div className="Anime-section">
            <div className="Anime-list-container">
                <div className="Anime-results-header">
                    {onSearchChange && (
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
                                onChange={(e) => onSearchChange(e.target.value)}
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
                    )}

                    <div className="Anime-results-meta">
                        <div className="Anime-results-info">
                            <span>
                                {loading ? (
                                    'Пошук тайтлів...'
                                ) : (
                                    <>Показано: <strong>{animeList.length}</strong> {animeList.length === 1 ? 'тайтл' : (animeList.length >= 2 && animeList.length <= 4 ? 'тайтли' : 'тайтлів')}</>
                                )}
                            </span>
                            {isFiltered && (
                                <button
                                    className="Anime-reset-btn"
                                    onClick={onResetFilters}
                                    disabled={loading}
                                    title="Скинути всі активні фільтри та пошук"
                                >
                                    Скинути ✕
                                </button>
                            )}
                        </div>

                        {onSortChange && (
                            <SortControl
                                sort={sort}
                                onSortChange={onSortChange}
                                disabled={loading}
                            />
                        )}
                    </div>
                </div>

                {loading ? (
                    <AnimeListSkeleton count={12} />
                ) : (
                    <div className="Anime-list-section">
                        {animeList.map((anime) => (
                            <AnimeCard anime={anime} key={anime.id} />
                        ))}
                        {animeList.length === 0 && (
                            <div className="Anime-empty-msg">
                                <p>За вказаними фільтрами не знайдено жодного тайтла.</p>
                                <button className="Anime-reset-btn" onClick={onResetFilters}>
                                    Скинути фільтри
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {onPageChange && (
                    <div className="Pagination-controls">
                        <button
                            className="Pagination-btn"
                            disabled={currentPage <= 1 || loading}
                            onClick={() => onPageChange(currentPage - 1)}
                        >
                            ← Попередня
                        </button>
                        <span className="Pagination-info">
                            Сторінка <strong>{currentPage}</strong> {loading && ' (Завантаження...)'}
                        </span>
                        <button
                            className="Pagination-btn"
                            disabled={loading || animeList.length < 12}
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            Наступна (+12) →
                        </button>
                    </div>
                )}
            </div>

            <FilterPanel
                key={filterKey}
                initialGenres={filters.genres || []}
                initialStatus={filters.status || 'all'}
                initialYearFrom={filters.yearFrom || ''}
                initialYearTo={filters.yearTo || ''}
                categories={allAvailableGenres}
                onApply={onFiltersChange}
                onReset={onResetFilters}
                disabled={loading}
            />
        </div>
    );
}

export default AnimeSection;
