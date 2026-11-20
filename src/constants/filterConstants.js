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
