import "./AnimeSection.css";
import AnimeCard from './AnimeCard';
import AnimeListSkeleton from './AnimeListSkeleton';
import { useState, useEffect, useMemo } from "react";
import { animeApiClient } from "../services/index.js";

const STATUS_OPTIONS = [
    { value: 'all', label: 'Всі статуси' },
    { value: 'current', label: 'Онґоїнґ (Current)' },
    { value: 'finished', label: 'Завершено (Finished)' },
    { value: 'upcoming', label: 'Анонсовано (Upcoming)' }
];

function AnimeSection({
    animeList = [],
    currentPage = 1,
    onPageChange,
    filters = { genres: [], status: 'all', yearFrom: '', yearTo: '' },
    onFiltersChange,
    isPending = false
}) {
    const [apiGenres, setApiGenres] = useState([]);

    useEffect(() => {
        let isMounted = true;
        animeApiClient.getCategories().then((cats) => {
            if (isMounted && Array.isArray(cats)) {
                setApiGenres(cats.map((c) => c.title));
            }
        }).catch((err) => {
            console.error('Failed to load categories:', err);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const allAvailableGenres = useMemo(() => {
        const set = new Set(apiGenres);
        animeList.forEach((anime) => {
            (anime.genres || []).forEach((g) => {
                const name = typeof g === 'string' ? g : g.name;
                if (name) set.add(name);
            });
        });
        return Array.from(set).sort();
    }, [apiGenres, animeList]);

    const selectedGenres = filters.genres || [];
    const selectedStatus = filters.status || 'all';
    const yearFrom = filters.yearFrom || '';
    const yearTo = filters.yearTo || '';

    const handleGenreToggle = (genre) => {
        if (!onFiltersChange) return;
        const newGenres = selectedGenres.includes(genre)
            ? selectedGenres.filter((g) => g !== genre)
            : [...selectedGenres, genre];

        onFiltersChange({
            ...filters,
            genres: newGenres
        });
    };

    const handleStatusChange = (status) => {
        if (!onFiltersChange) return;
        onFiltersChange({
            ...filters,
            status
        });
    };

    const handleYearChange = (field, val) => {
        if (!onFiltersChange) return;
        onFiltersChange({
            ...filters,
            [field]: val
        });
    };

    const handleResetFilters = () => {
        if (!onFiltersChange) return;
        onFiltersChange({
            genres: [],
            status: 'all',
            yearFrom: '',
            yearTo: ''
        });
    };

    const isFiltered = selectedGenres.length > 0 || selectedStatus !== 'all' || yearFrom !== '' || yearTo !== '';

    return (
        <div className="Anime-section">
            <div className="Anime-list-container">
                <div className="Anime-results-header">
                    <span>
                        {isPending ? (
                            'Пошук тайтлів...'
                        ) : (
                            <>Показано: <strong>{animeList.length}</strong> {animeList.length === 12 ? 'тайтлів (повна сторінка)' : 'тайтлів'}</>
                        )}
                    </span>
                    {isFiltered && (
                        <button className="Anime-reset-btn" onClick={handleResetFilters} disabled={isPending}>
                            Скинути фільтри ✕
                        </button>
                    )}
                </div>

                {isPending ? (
                    <AnimeListSkeleton count={12} />
                ) : (
                    <div className="Anime-list-section">
                        {animeList.map((anime) => (
                            <AnimeCard anime={anime} key={anime.id} />
                        ))}
                        {animeList.length === 0 && (
                            <div className="Anime-empty-msg">
                                <p>За вказаними фільтрами не знайдено жодного тайтла.</p>
                                <button className="Anime-reset-btn" onClick={handleResetFilters}>
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
                            disabled={currentPage <= 1 || isPending}
                            onClick={() => onPageChange(currentPage - 1)}
                        >
                            ← Попередня
                        </button>
                        <span className="Pagination-info">
                            Сторінка <strong>{currentPage}</strong> {isPending && ' (Завантаження...)'}
                        </span>
                        <button
                            className="Pagination-btn"
                            disabled={isPending || animeList.length < 12}
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            Наступна →
                        </button>
                    </div>
                )}
            </div>

            <aside className="Anime-filter-section">
                <div className="Anime-filter-body">
                    <h3 className="Filter-heading">Фільтрація</h3>

                    <div className="Filter-group">
                        <label className="Filter-label">Статус:</label>
                        <select
                            className="Anime-filter-select"
                            value={selectedStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isPending}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option value={opt.value} key={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="Filter-group">
                        <label className="Filter-label">Рік випуску:</label>
                        <div className="Year-range-inputs">
                            <input
                                type="number"
                                placeholder="Від (напр. 2010)"
                                className="Year-input"
                                value={yearFrom}
                                onChange={(e) => handleYearChange('yearFrom', e.target.value)}
                                min="1960"
                                max="2030"
                                disabled={isPending}
                            />
                            <span className="Year-separator">—</span>
                            <input
                                type="number"
                                placeholder="До (напр. 2026)"
                                className="Year-input"
                                value={yearTo}
                                onChange={(e) => handleYearChange('yearTo', e.target.value)}
                                min="1960"
                                max="2030"
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <div className="Filter-group">
                        <div className="Filter-genres-header">
                            <label className="Filter-label">
                                Жанри {selectedGenres.length > 0 && `(${selectedGenres.length})`}:
                            </label>
                            {selectedGenres.length > 0 && (
                                <button
                                    type="button"
                                    className="Filter-clear-text-btn"
                                    onClick={() => onFiltersChange && onFiltersChange({ ...filters, genres: [] })}
                                    disabled={isPending}
                                >
                                    очистити
                                </button>
                            )}
                        </div>
                        <div className="Genres-pill-container">
                            {allAvailableGenres.map((genre) => {
                                const isSelected = selectedGenres.includes(genre);
                                return (
                                    <button
                                        type="button"
                                        key={genre}
                                        className={`Genre-pill ${isSelected ? 'Genre-pill-selected' : ''}`}
                                        onClick={() => handleGenreToggle(genre)}
                                        disabled={isPending}
                                    >
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default AnimeSection;
