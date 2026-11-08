import './FilterPanel.css';
import { useState, useMemo } from 'react';
import { STATUS_OPTIONS } from '../../constants/filterConstants.js';

const MIN_YEAR = 1917;
const MAX_YEAR = 2035;

function validateYears(from, to) {
    const trimmedFrom = from ? String(from).trim() : '';
    const trimmedTo = to ? String(to).trim() : '';

    if (trimmedFrom !== '') {
        const numFrom = Number(trimmedFrom);
        if (!/^\d{4}$/.test(trimmedFrom) || isNaN(numFrom) || numFrom < MIN_YEAR || numFrom > MAX_YEAR) {
            return {
                field: 'from',
                message: `Початковий рік має бути 4-значним числом від ${MIN_YEAR} до ${MAX_YEAR}`
            };
        }
    }

    if (trimmedTo !== '') {
        const numTo = Number(trimmedTo);
        if (!/^\d{4}$/.test(trimmedTo) || isNaN(numTo) || numTo < MIN_YEAR || numTo > MAX_YEAR) {
            return {
                field: 'to',
                message: `Кінцевий рік має бути 4-значним числом від ${MIN_YEAR} до ${MAX_YEAR}`
            };
        }
    }

    if (trimmedFrom !== '' && trimmedTo !== '') {
        if (Number(trimmedFrom) > Number(trimmedTo)) {
            return {
                field: 'both',
                message: 'Початковий рік не може перевищувати кінцевий'
            };
        }
    }

    return null;
}

export function FilterPanel({
    initialGenres = [],
    initialStatus = 'all',
    initialYearFrom = '',
    initialYearTo = '',
    categories = [],
    onApply,
    onReset,
    disabled = false
}) {
    const [draftGenres, setDraftGenres] = useState(initialGenres);
    const [draftStatus, setDraftStatus] = useState(initialStatus);
    const [draftYearFrom, setDraftYearFrom] = useState(initialYearFrom);
    const [draftYearTo, setDraftYearTo] = useState(initialYearTo);
    const [yearError, setYearError] = useState(null);

    const handleGenreToggle = (genreName) => {
        setDraftGenres((prev) =>
            prev.includes(genreName)
                ? prev.filter((g) => g !== genreName)
                : [...prev, genreName]
        );
    };

    const handleClearGenres = () => {
        setDraftGenres([]);
    };

    const handleStatusChange = (val) => {
        setDraftStatus(val);
    };

    const handleYearFromChange = (e) => {
        setDraftYearFrom(e.target.value);
        if (yearError) setYearError(null);
    };

    const handleYearToChange = (e) => {
        setDraftYearTo(e.target.value);
        if (yearError) setYearError(null);
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const error = validateYears(draftYearFrom, draftYearTo);
        if (error) {
            setYearError(error);
            return;
        }
        setYearError(null);
        if (onApply) {
            onApply({
                genres: draftGenres,
                status: draftStatus,
                yearFrom: draftYearFrom ? String(draftYearFrom).trim() : '',
                yearTo: draftYearTo ? String(draftYearTo).trim() : ''
            });
        }
    };

    const handleResetClick = () => {
        setDraftGenres([]);
        setDraftStatus('all');
        setDraftYearFrom('');
        setDraftYearTo('');
        setYearError(null);
        if (onReset) onReset();
    };

    const orderedCategories = useMemo(() => {
        const rawList = categories.map((cat) =>
            typeof cat === 'string' ? cat : (cat.title || cat.name || cat.slug)
        ).filter(Boolean);

        const initialOrder = Array.from(new Set(rawList));

        const selected = initialOrder.filter((name) => draftGenres.includes(name));
        const unselected = initialOrder.filter((name) => !draftGenres.includes(name));

        return [...selected, ...unselected];
    }, [categories, draftGenres]);

    const isFromError = yearError && (yearError.field === 'from' || yearError.field === 'both');
    const isToError = yearError && (yearError.field === 'to' || yearError.field === 'both');

    const isFiltered = Boolean(
        draftGenres.length > 0 ||
        draftStatus !== 'all' ||
        draftYearFrom ||
        draftYearTo
    );

    return (
        <aside className="Filter-panel-section">
            <form className="Filter-panel-card" onSubmit={handleSubmit} noValidate>
                <div className="Filter-panel-header">
                    <h3 className="Filter-panel-title">Фільтрація</h3>
                    {isFiltered && (
                        <button
                            type="button"
                            className="Filter-quick-reset"
                            onClick={handleResetClick}
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
                        value={draftStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
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
                            value={draftYearFrom}
                            onChange={handleYearFromChange}
                            disabled={disabled}
                            aria-label="Рік випуску від"
                            aria-invalid={Boolean(isFromError)}
                        />
                        <span className="Filter-year-separator">—</span>
                        <input
                            type="number"
                            placeholder="До (2035)"
                            className={`Filter-year-input ${isToError ? 'Filter-year-input-error' : ''}`}
                            value={draftYearTo}
                            onChange={handleYearToChange}
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
                            Жанри {draftGenres.length > 0 && `(${draftGenres.length})`}:
                        </label>
                        {draftGenres.length > 0 && (
                            <button
                                type="button"
                                className="Filter-clear-text-btn"
                                onClick={handleClearGenres}
                                disabled={disabled}
                            >
                                очистити
                            </button>
                        )}
                    </div>
                    <div className="Genres-pill-container">
                        {orderedCategories.map((name) => {
                            const isSelected = draftGenres.includes(name);
                            return (
                                <button
                                    type="button"
                                    key={name}
                                    className={`Genre-pill ${isSelected ? 'Genre-pill-selected' : ''}`}
                                    onClick={() => handleGenreToggle(name)}
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
                        type="submit"
                        className="Filter-apply-button"
                        disabled={disabled}
                    >
                        Фільтрувати
                    </button>
                    <button
                        type="button"
                        className="Filter-reset-button"
                        onClick={handleResetClick}
                        disabled={disabled}
                    >
                        Скинути
                    </button>
                </div>
            </form>
        </aside>
    );
}

export default FilterPanel;
