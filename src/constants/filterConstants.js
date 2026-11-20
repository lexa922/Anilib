export const MIN_YEAR = 1917;
export const MAX_YEAR = 2035;

export const INITIAL_FILTERS = {
    query: '',
    genres: [],
    status: 'all',
    yearFrom: '',
    yearTo: ''
};

export const DEFAULT_SEARCH_QUERY = '';

export function isValidYearString(value) {
    const trimmed = value !== undefined && value !== null ? String(value).trim() : '';
    if (!/^\d{4}$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return !Number.isNaN(num) && num >= MIN_YEAR && num <= MAX_YEAR;
}

export function validateYears(from, to) {
    const trimmedFrom = from !== undefined && from !== null ? String(from).trim() : '';
    const trimmedTo = to !== undefined && to !== null ? String(to).trim() : '';

    if (trimmedFrom !== '' && !isValidYearString(trimmedFrom)) {
        return {
            field: 'from',
            message: `Початковий рік має бути 4-значним числом від ${MIN_YEAR} до ${MAX_YEAR}`
        };
    }

    if (trimmedTo !== '' && !isValidYearString(trimmedTo)) {
        return {
            field: 'to',
            message: `Кінцевий рік має бути 4-значним числом від ${MIN_YEAR} до ${MAX_YEAR}`
        };
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

export const STATUS_OPTIONS = [
    { value: 'all', label: 'Всі статуси' },
    { value: 'current', label: 'Онґоїнґ (Airing)' },
    { value: 'finished', label: 'Завершено (Finished)' },
    { value: 'upcoming', label: 'Анонсовано (Upcoming)' }
];

export const ANIME_STATUS_LABELS = {
    current: 'Онґоїнґ',
    finished: 'Завершено',
    upcoming: 'Анонс',
    unreleased: 'Анонс'
};

export const LIBRARY_STATUS_LABELS = {
    plan_to_watch: 'У планах',
    watching: 'Дивлюсь',
    completed: 'Переглянуто',
    dropped: 'Покинуто'
};

export const LIBRARY_STATUS_OPTIONS = Object.entries(LIBRARY_STATUS_LABELS).map(
    ([value, label]) => ({ value, label })
);
