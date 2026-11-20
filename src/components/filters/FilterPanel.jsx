import './FilterPanel.css';
import { useMemo } from 'react';
import { STATUS_OPTIONS, validateYears } from '../../constants/filterConstants.js';
import {
    useDashboardStore,
    selectHasActiveFilters
} from '../../store/index.js';

export function FilterPanel({ categories = [], disabled = false }) {
    const status = useDashboardStore((state) => state.filters.status);
    const genres = useDashboardStore((state) => state.filters.genres);
    const yearFrom = useDashboardStore((state) => state.filters.yearFrom);
    const yearTo = useDashboardStore((state) => state.filters.yearTo);
    const hasActiveFilters = useDashboardStore(selectHasActiveFilters);

    const setFilter = useDashboardStore((state) => state.setFilter);
    const toggleGenre = useDashboardStore((state) => state.toggleGenre);
    const resetFilters = useDashboardStore((state) => state.resetFilters);

    const yearError = useMemo(() => validateYears(yearFrom, yearTo), [yearFrom, yearTo]);

    const orderedCategories = useMemo(() => {
        const rawList = categories.map((cat) =>
            typeof cat === 'string' ? cat : (cat.title || cat.name || cat.slug)
        ).filter(Boolean);

        const initialOrder = Array.from(new Set(rawList));

        const selected = initialOrder.filter((name) => genres.includes(name));
        const unselected = initialOrder.filter((name) => !genres.includes(name));

        return [...selected, ...unselected];
    }, [categories, genres]);

    const isFromError = yearError && (yearError.field === 'from' || yearError.field === 'both');
    const isToError = yearError && (yearError.field === 'to' || yearError.field === 'both');

    return (
        <aside className="Filter-panel-section">
            <form className="Filter-panel-card" onSubmit={(e) => e.preventDefault()} noValidate>
                <div className="Filter-panel-header">
                    <h3 className="Filter-panel-title">Фільтрація</h3>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="Filter-quick-reset"
                            onClick={resetFilters}
                            disabled={disabled}
                            title="Скинути до початкових значень"
                        >
                            Скинути ✕
                        </button>
                    )}
                </div>

                <div className="Filter-field-group">
                    <label className="Filter-field-label" htmlFor="filter-status-select">
                        Статус релізу:
                    </label>
                    <select
                        id="filter-status-select"
                        className="Filter-select-control"
                        value={status}
                        onChange={(e) => setFilter('status', e.target.value)}
                        disabled={disabled}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="Filter-field-group">
                    <label className="Filter-field-label">Рік випуску:</label>
                    <div className="Filter-year-row">
                        <input
                            type="number"
                            placeholder="Від (1917)"
                            className={`Filter-year-input ${isFromError ? 'Filter-year-input-error' : ''}`}
                            value={yearFrom}
                            onChange={(e) => setFilter('yearFrom', e.target.value)}
                            disabled={disabled}
                            aria-label="Рік випуску від"
                            aria-invalid={Boolean(isFromError)}
                        />
                        <span className="Filter-year-separator">—</span>
                        <input
                            type="number"
                            placeholder="До (2035)"
                            className={`Filter-year-input ${isToError ? 'Filter-year-input-error' : ''}`}
                            value={yearTo}
                            onChange={(e) => setFilter('yearTo', e.target.value)}
                            disabled={disabled}
                            aria-label="Рік випуску до"
                            aria-invalid={Boolean(isToError)}
                        />
                    </div>
                    {yearError && (
                        <div className="Filter-validation-error" role="alert">
                            <span className="Filter-error-icon">⚠</span>
                            <span>{yearError.message}</span>
                        </div>
                    )}
                </div>

                <div className="Filter-field-group">
                    <div className="Filter-genres-header">
                        <label className="Filter-field-label">
                            Жанри {genres.length > 0 && `(${genres.length})`}:
                        </label>
                        {genres.length > 0 && (
                            <button
                                type="button"
                                className="Filter-clear-text-btn"
                                onClick={() => setFilter('genres', [])}
                                disabled={disabled}
                            >
                                очистити
                            </button>
                        )}
                    </div>
                    <div className="Genres-pill-container">
                        {orderedCategories.map((name) => {
                            const isSelected = genres.includes(name);
                            return (
                                <button
                                    type="button"
                                    key={name}
                                    className={`Genre-pill ${isSelected ? 'Genre-pill-selected' : ''}`}
                                    onClick={() => toggleGenre(name)}
                                    disabled={disabled}
                                >
                                    {isSelected && <span className="Genre-pill-check" aria-hidden="true">✓ </span>}
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="Filter-actions-row">
                    <button
                        type="button"
                        className="Filter-reset-button"
                        onClick={resetFilters}
                        disabled={disabled || !hasActiveFilters}
                    >
                        Скинути фільтри
                    </button>
                </div>
            </form>
        </aside>
    );
}

export default FilterPanel;
