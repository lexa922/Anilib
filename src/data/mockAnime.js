export const MOCK_KPI_DATA = [
    {
        id: 'kpi-top-score',
        title: 'Найвищий рейтинг',
        value: '9.10',
        change: 0.05,
        unit: 'MAL Score'
    },
    {
        id: 'kpi-avg-score',
        title: 'Середній бал топу',
        value: '8.92',
        change: 1.4,
        unit: '%'
    },
    {
        id: 'kpi-active-airing',
        title: 'Активні онгоінги',
        value: '24',
        change: -2,
        unit: 'тайтлів'
    }
];

export const MOCK_GENRES = [
    'Всі',
    'Action',
    'Drama',
    'Fantasy',
    'Sci-Fi'
];

export const MOCK_ANIME_LIST = [
    {
        mal_id: 5114,
        title: 'Fullmetal Alchemist: Brotherhood',
        score: 9.10,
        episodes: 64,
        status: 'Finished Airing',
        season: 'spring',
        year: 2009,
        genres: [
            { mal_id: 1, name: 'Action' },
            { mal_id: 2, name: 'Adventure' },
            { mal_id: 10, name: 'Fantasy' }
        ],
        images: {
            jpg: {
                image_url: 'https://cdn.myanimelist.net/images/anime/1208/94745.jpg'
            }
        }
    },
    {
        mal_id: 9253,
        title: 'Steins;Gate',
        score: 9.07,
        episodes: 24,
        status: 'Finished Airing',
        season: 'spring',
        year: 2011,
        genres: [
            { mal_id: 8, name: 'Drama' },
            { mal_id: 24, name: 'Sci-Fi' },
            { mal_id: 41, name: 'Suspense' }
        ],
        images: {
            jpg: {
                image_url: 'https://cdn.myanimelist.net/images/anime/1935/127974.jpg'
            }
        }
    },
    {
        mal_id: 38524,
        title: 'Shingeki no Kyojin Season 3 Part 2',
        score: 9.05,
        episodes: 10,
        status: 'Finished Airing',
        season: 'spring',
        year: 2019,
        genres: [
            { mal_id: 1, name: 'Action' },
            { mal_id: 8, name: 'Drama' },
            { mal_id: 41, name: 'Suspense' }
        ],
        images: {
            jpg: {
                image_url: 'https://cdn.myanimelist.net/images/anime/1517/100633.jpg'
            }
        }
    },
    {
        mal_id: 28977,
        title: 'Gintama°',
        score: 9.04,
        episodes: 51,
        status: 'Finished Airing',
        season: 'spring',
        year: 2015,
        genres: [
            { mal_id: 1, name: 'Action' },
            { mal_id: 4, name: 'Comedy' },
            { mal_id: 24, name: 'Sci-Fi' }
        ],
        images: {
            jpg: {
                image_url: 'https://cdn.myanimelist.net/images/anime/3/72078.jpg'
            }
        }
    },
    {
        mal_id: 52991,
        title: 'Sousou no Frieren',
        score: 9.14,
        episodes: 28,
        status: 'Finished Airing',
        season: 'fall',
        year: 2023,
        genres: [
            { mal_id: 2, name: 'Adventure' },
            { mal_id: 8, name: 'Drama' },
            { mal_id: 10, name: 'Fantasy' }
        ],
        images: {
            jpg: {
                image_url: 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg'
            }
        }
    }
];