export const INITIAL_FILTERS = {
    genres: [],
    status: 'all',
    yearFrom: '',
    yearTo: ''
};

export const DEFAULT_SEARCH_QUERY = '';

export const STATUS_OPTIONS = [
    { value: 'all', label: 'Всі статуси' },
    { value: 'current', label: 'Онґоїнґ (Airing)' },
    { value: 'finished', label: 'Завершено (Finished)' },
    { value: 'upcoming', label: 'Анонсовано (Upcoming)' }
];
