export const SUBTYPE_CHART_LABELS = {
    TV: 'TV',
    MOVIE: 'Фільм',
    OVA: 'OVA',
    ONA: 'ONA',
    SPECIAL: 'Спешл',
    MUSIC: 'Музика'
};

export const AGE_RATING_ORDER = ['G', 'PG', 'R', 'R18'];

export const AGE_RATING_LABELS = {
    G: 'G (Для всіх)',
    PG: 'PG (10+)',
    R: 'R (17+)',
    R18: 'R18 (18+)'
};

export function formatCompactNumber(val) {
    const num = Number(val) || 0;
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${Math.round(num / 1_000)}k`;
    }
    return String(num);
}

export function truncateTitle(title, maxLen = 16) {
    const clean = String(title || '').trim();
    if (clean.length <= maxLen) return clean;
    return `${clean.slice(0, maxLen - 1)}…`;
}

export function parseNumericScore(score) {
    if (score === null || score === undefined || score === '' || score === '?' || score === 'N/A') {
        return null;
    }
    const parsed = Number(score);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
}

export function extractStartMonth(anime) {
    if (!anime || typeof anime.startDate !== 'string') return null;
    const match = anime.startDate.match(/^\d{4}-(\d{2})/);
    if (!match) return null;
    const month = parseInt(match[1], 10);
    return month >= 1 && month <= 12 ? month : null;
}

function computeMedian(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

export function groupHypeVsQuality(animeList = [], { maxBarItems = 12, maxScatterItems = 140 } = {}) {
    if (!Array.isArray(animeList) || animeList.length === 0) {
        return { barData: [], scatterData: [], medianUsers: 0, medianScore: 0 };
    }

    const valid = animeList
        .map((item) => {
            const score = parseNumericScore(item?.score);
            const userCount = Number(item?.userCount) || 0;
            if (score === null || userCount <= 0) return null;
            return {
                id: String(item.id),
                fullTitle: item.title || 'Без назви',
                label: truncateTitle(item.title || 'Без назви', 15),
                score: Number(score.toFixed(2)),
                userCount,
                favoritesCount: Number(item.favoritesCount) || 0
            };
        })
        .filter(Boolean);

    if (valid.length === 0) {
        return { barData: [], scatterData: [], medianUsers: 0, medianScore: 0 };
    }

    const medianUsers = Math.round(computeMedian(valid.map((v) => v.userCount)));
    const medianScore = Number(computeMedian(valid.map((v) => v.score)).toFixed(2));

    const classifyInsight = (item) => {
        const highScore = item.score >= Math.max(medianScore, 7.6);
        const highUsers = item.userCount >= medianUsers;
        if (highScore && !highUsers) return '💎 Недооцінена перлина';
        if (highScore && highUsers) return '🔥 Визнаний хіт';
        if (!highScore && highUsers) return '📢 Мейнстрім-хайп';
        return '📌 Нішевий тайтл';
    };

    const annotated = valid.map((item) => ({
        ...item,
        insight: classifyInsight(item)
    }));

    const byPopularity = [...annotated].sort((a, b) => b.userCount - a.userCount);
    const half = Math.ceil(maxBarItems / 2);
    const barSelection = [];
    const seenBarIds = new Set();

    for (const item of byPopularity.slice(0, half)) {
        seenBarIds.add(item.id);
        barSelection.push(item);
    }

    const gems = annotated
        .filter((item) => !seenBarIds.has(item.id))
        .sort((a, b) => (b.score - a.score) || (a.userCount - b.userCount));

    for (const item of gems) {
        if (barSelection.length >= maxBarItems) break;
        seenBarIds.add(item.id);
        barSelection.push(item);
    }

    const barData = barSelection.sort((a, b) => b.userCount - a.userCount);

    const scatterSelection = [];
    const seenScatterIds = new Set();
    const pushUnique = (list, limit) => {
        let added = 0;
        for (const item of list) {
            if (added >= limit || scatterSelection.length >= maxScatterItems) break;
            if (!seenScatterIds.has(item.id)) {
                seenScatterIds.add(item.id);
                scatterSelection.push(item);
                added += 1;
            }
        }
    };

    pushUnique(byPopularity, Math.floor(maxScatterItems / 3));
    pushUnique([...annotated].sort((a, b) => b.score - a.score), Math.floor(maxScatterItems / 3));

    const step = Math.max(1, Math.floor(annotated.length / Math.max(1, maxScatterItems - scatterSelection.length)));
    for (let i = 0; i < annotated.length && scatterSelection.length < maxScatterItems; i += step) {
        const item = annotated[i];
        if (!seenScatterIds.has(item.id)) {
            seenScatterIds.add(item.id);
            scatterSelection.push(item);
        }
    }

    return {
        barData,
        scatterData: scatterSelection,
        medianUsers,
        medianScore
    };
}

export function groupCultRatio(animeList = [], maxItems = 10) {
    if (!Array.isArray(animeList) || animeList.length === 0) return [];

    const withUsers = animeList.filter((item) => (Number(item?.userCount) || 0) > 0);
    if (withUsers.length === 0) return [];

    const substantial = withUsers.filter((item) => Number(item.userCount) >= 100);
    const pool = substantial.length >= Math.min(5, withUsers.length) ? substantial : withUsers;

    return pool
        .map((item) => {
            const userCount = Number(item.userCount);
            const favoritesCount = Math.max(0, Number(item.favoritesCount) || 0);
            const cultRatio = Number(((favoritesCount / userCount) * 100).toFixed(2));
            const score = parseNumericScore(item.score) ?? 0;

            return {
                id: String(item.id),
                label: truncateTitle(item.title || 'Без назви', 17),
                fullTitle: item.title || 'Без назви',
                cultRatio,
                score,
                favoritesCount,
                userCount
            };
        })
        .sort((a, b) => (b.cultRatio - a.cultRatio) || (b.score - a.score))
        .slice(0, maxItems);
}

export function groupByMarathonLength(animeList = []) {
    if (!Array.isArray(animeList) || animeList.length === 0) return [];

    const buckets = [
        { key: 'movie', label: 'Фільм (1)', count: 0, scoreSum: 0, scoredCount: 0, hoursSum: 0, hoursCount: 0 },
        { key: 'short', label: 'Короткі (2–13)', count: 0, scoreSum: 0, scoredCount: 0, hoursSum: 0, hoursCount: 0 },
        { key: 'standard', label: 'Стандарт (14–26)', count: 0, scoreSum: 0, scoredCount: 0, hoursSum: 0, hoursCount: 0 },
        { key: 'long', label: 'Довгі (27–60)', count: 0, scoreSum: 0, scoredCount: 0, hoursSum: 0, hoursCount: 0 },
        { key: 'marathon', label: 'Марафон (60+)', count: 0, scoreSum: 0, scoredCount: 0, hoursSum: 0, hoursCount: 0 }
    ];

    let totalCategorized = 0;

    for (const anime of animeList) {
        if (!anime) continue;
        const ep = anime.episodes !== null && anime.episodes !== undefined ? Number(anime.episodes) : null;
        const isMovie = String(anime.subtype || '').trim().toUpperCase() === 'MOVIE';

        let targetIdx = -1;
        if (ep === 1 || (isMovie && (!ep || ep <= 1))) {
            targetIdx = 0;
        } else if (ep !== null && !Number.isNaN(ep) && ep > 1) {
            if (ep <= 13) targetIdx = 1;
            else if (ep <= 26) targetIdx = 2;
            else if (ep <= 60) targetIdx = 3;
            else targetIdx = 4;
        }

        if (targetIdx === -1) continue;

        totalCategorized += 1;
        const bucket = buckets[targetIdx];
        bucket.count += 1;

        const score = parseNumericScore(anime.score);
        if (score !== null) {
            bucket.scoreSum += score;
            bucket.scoredCount += 1;
        }

        const epLen = Number(anime.episodeLength);
        const effEp = ep && ep > 0 ? ep : (isMovie ? 1 : 0);
        if (effEp > 0 && !Number.isNaN(epLen) && epLen > 0) {
            bucket.hoursSum += (effEp * epLen) / 60;
            bucket.hoursCount += 1;
        }
    }

    if (totalCategorized === 0) return [];

    return buckets
        .filter((bucket) => bucket.count > 0)
        .map((bucket) => ({
            label: bucket.label,
            avgScore: bucket.scoredCount > 0
                ? Number((bucket.scoreSum / bucket.scoredCount).toFixed(2))
                : 0,
            sharePct: Number(((bucket.count / totalCategorized) * 100).toFixed(1)),
            count: bucket.count,
            avgHours: bucket.hoursCount > 0
                ? Number((bucket.hoursSum / bucket.hoursCount).toFixed(1))
                : null
        }));
}

export function groupBySeason(animeList = []) {
    if (!Array.isArray(animeList) || animeList.length === 0) return [];

    const seasons = [
        { key: 'winter', label: 'Зима (01–03)', count: 0, scoreSum: 0, scoredCount: 0 },
        { key: 'spring', label: 'Весна (04–06)', count: 0, scoreSum: 0, scoredCount: 0 },
        { key: 'summer', label: 'Літо (07–09)', count: 0, scoreSum: 0, scoredCount: 0 },
        { key: 'fall', label: 'Осінь (10–12)', count: 0, scoreSum: 0, scoredCount: 0 }
    ];

    let totalDated = 0;

    for (const anime of animeList) {
        const month = extractStartMonth(anime);
        if (!month) continue;

        let idx;
        if (month <= 3) idx = 0;
        else if (month <= 6) idx = 1;
        else if (month <= 9) idx = 2;
        else idx = 3;

        totalDated += 1;
        const bucket = seasons[idx];
        bucket.count += 1;

        const score = parseNumericScore(anime.score);
        if (score !== null) {
            bucket.scoreSum += score;
            bucket.scoredCount += 1;
        }
    }

    if (totalDated === 0) return [];

    return seasons.map((s) => ({
        label: s.label,
        count: s.count,
        sharePct: Number(((s.count / totalDated) * 100).toFixed(1)),
        avgScore: s.scoredCount > 0
            ? Number((s.scoreSum / s.scoredCount).toFixed(2))
            : 0
    }));
}

export function groupScoreDistribution(animeList = []) {
    if (!Array.isArray(animeList) || animeList.length === 0) return [];

    const ranges = [
        { label: '< 6.5', test: (s) => s < 6.5, count: 0, popSum: 0 },
        { label: '6.5–7.0', test: (s) => s >= 6.5 && s < 7.0, count: 0, popSum: 0 },
        { label: '7.0–7.5', test: (s) => s >= 7.0 && s < 7.5, count: 0, popSum: 0 },
        { label: '7.5–8.0', test: (s) => s >= 7.5 && s < 8.0, count: 0, popSum: 0 },
        { label: '8.0–8.5', test: (s) => s >= 8.0 && s < 8.5, count: 0, popSum: 0 },
        { label: '8.5+', test: (s) => s >= 8.5, count: 0, popSum: 0 }
    ];

    let totalScored = 0;

    for (const anime of animeList) {
        const score = parseNumericScore(anime?.score);
        if (score === null) continue;

        const bucket = ranges.find((r) => r.test(score));
        if (!bucket) continue;

        totalScored += 1;
        bucket.count += 1;
        bucket.popSum += Number(anime.userCount) || 0;
    }

    if (totalScored === 0) return [];

    return ranges.map((r) => ({
        label: r.label,
        count: r.count,
        sharePct: Number(((r.count / totalScored) * 100).toFixed(1)),
        avgPopularity: r.count > 0 ? Math.round(r.popSum / r.count) : 0
    }));
}

export function groupByAgeRating(animeList = []) {
    if (!Array.isArray(animeList) || animeList.length === 0) return [];

    const buckets = new Map();
    for (const code of AGE_RATING_ORDER) {
        buckets.set(code, {
            code,
            label: AGE_RATING_LABELS[code] || code,
            count: 0,
            scoreSum: 0,
            scoredCount: 0,
            popSum: 0
        });
    }

    for (const anime of animeList) {
        if (!anime) continue;
        const code = String(anime.ageRating || '').trim().toUpperCase();
        if (!buckets.has(code)) continue;

        const bucket = buckets.get(code);
        bucket.count += 1;
        bucket.popSum += Number(anime.userCount) || 0;

        const score = parseNumericScore(anime.score);
        if (score !== null) {
            bucket.scoreSum += score;
            bucket.scoredCount += 1;
        }
    }

    return Array.from(buckets.values())
        .filter((b) => b.count > 0)
        .map((b) => ({
            label: b.label,
            count: b.count,
            avgScore: b.scoredCount > 0 ? Number((b.scoreSum / b.scoredCount).toFixed(2)) : 0,
            avgPopularity: Math.round(b.popSum / b.count)
        }));
}

export function groupBySubtypeMetrics(animeList = []) {
    if (!Array.isArray(animeList) || animeList.length === 0) return [];

    const buckets = new Map();

    for (const anime of animeList) {
        if (!anime) continue;
        const rawSubtype = String(anime.subtype || '').trim().toUpperCase();
        const label = SUBTYPE_CHART_LABELS[rawSubtype] || 'Інше';
        const key = SUBTYPE_CHART_LABELS[rawSubtype] ? rawSubtype : 'OTHER';

        if (!buckets.has(key)) {
            buckets.set(key, {
                label,
                count: 0,
                scoreSum: 0,
                scoredCount: 0,
                popSum: 0
            });
        }

        const bucket = buckets.get(key);
        bucket.count += 1;
        bucket.popSum += Number(anime.userCount) || 0;

        const score = parseNumericScore(anime.score);
        if (score !== null) {
            bucket.scoreSum += score;
            bucket.scoredCount += 1;
        }
    }

    return Array.from(buckets.values())
        .filter((b) => b.count > 0)
        .map((b) => ({
            label: b.label,
            count: b.count,
            avgScore: b.scoredCount > 0 ? Number((b.scoreSum / b.scoredCount).toFixed(2)) : 0,
            avgPopularity: Math.round(b.popSum / b.count)
        }))
        .sort((a, b) => (b.avgScore - a.avgScore) || (b.avgPopularity - a.avgPopularity));
}

export function buildChartDataset(animeList = [], groupBy = 'hypeVsQuality', options = {}) {
    switch (groupBy) {
        case 'hypeVsQuality': {
            const { barData, scatterData, medianUsers, medianScore } = groupHypeVsQuality(animeList);
            return {
                mode: 'hypeVsQuality',
                data: barData,
                scatterData,
                meta: { medianUsers, medianScore },
                xKey: 'label',
                series: [
                    {
                        dataKey: 'userCount',
                        name: 'Аудиторія (додали)',
                        yAxisId: 'left',
                        color: 'var(--chart-secondary)',
                        kind: 'bar',
                        unit: ' кор.'
                    },
                    {
                        dataKey: 'score',
                        name: 'Рейтинг Kitsu',
                        yAxisId: 'right',
                        color: 'var(--accent-color)',
                        kind: 'line',
                        unit: ' / 10'
                    }
                ],
                leftAxis: {
                    domain: [0, 'auto'],
                    allowDecimals: false,
                    tickFormatter: formatCompactNumber
                },
                rightAxis: {
                    domain: [0, 10],
                    allowDecimals: true
                },
                scatterConfig: {
                    xKey: 'userCount',
                    xName: 'Аудиторія (додали)',
                    yKey: 'score',
                    yName: 'Рейтинг Kitsu',
                    zKey: 'favoritesCount',
                    zName: 'У фаворитах',
                    xTickFormatter: formatCompactNumber,
                    yDomain: [0, 10],
                    refX: medianUsers,
                    refY: medianScore
                },
                emptyMessage: 'Недостатньо даних про популярність та оцінки для аналізу кореляції.'
            };
        }

        case 'cultRatio': {
            const data = groupCultRatio(animeList, 10);
            return {
                mode: 'cultRatio',
                data,
                xKey: 'label',
                series: [
                    {
                        dataKey: 'cultRatio',
                        name: 'Культовість (Favorites / Users)',
                        yAxisId: 'left',
                        color: 'var(--favorite-color)',
                        kind: 'bar',
                        unit: '%'
                    },
                    {
                        dataKey: 'score',
                        name: 'Рейтинг Kitsu',
                        yAxisId: 'right',
                        color: 'var(--accent-color)',
                        kind: 'line',
                        unit: ' / 10'
                    }
                ],
                leftAxis: {
                    domain: [0, 'auto'],
                    allowDecimals: true,
                    tickFormatter: (v) => `${v}%`
                },
                rightAxis: {
                    domain: [0, 10],
                    allowDecimals: true
                },
                emptyMessage: 'Відсутні дані favoritesCount / userCount у поточній вибірці.'
            };
        }

        case 'marathon': {
            const data = groupByMarathonLength(animeList);
            return {
                mode: 'marathon',
                data,
                xKey: 'label',
                series: [
                    {
                        dataKey: 'avgScore',
                        name: 'Середній рейтинг',
                        yAxisId: 'left',
                        color: 'var(--accent-color)',
                        kind: 'line',
                        unit: ' / 10'
                    },
                    {
                        dataKey: 'sharePct',
                        name: 'Частка у вибірці',
                        yAxisId: 'right',
                        color: 'var(--chart-secondary)',
                        kind: 'bar',
                        unit: '%'
                    }
                ],
                leftAxis: {
                    domain: [0, 10],
                    allowDecimals: true
                },
                rightAxis: {
                    domain: [0, 100],
                    allowDecimals: false,
                    tickFormatter: (v) => `${v}%`
                },
                emptyMessage: 'Недостатньо даних про кількість серій у поточній вибірці.'
            };
        }

        case 'seasons': {
            const data = groupBySeason(animeList);
            return {
                mode: 'seasons',
                data,
                xKey: 'label',
                series: [
                    {
                        dataKey: 'count',
                        name: 'Кількість релізів',
                        yAxisId: 'left',
                        color: 'var(--chart-secondary)',
                        kind: 'bar',
                        unit: ' шт.'
                    },
                    {
                        dataKey: 'avgScore',
                        name: 'Середній рейтинг сезону',
                        yAxisId: 'right',
                        color: 'var(--accent-color)',
                        kind: 'line',
                        unit: ' / 10'
                    }
                ],
                leftAxis: {
                    domain: [0, 'auto'],
                    allowDecimals: false
                },
                rightAxis: {
                    domain: [0, 10],
                    allowDecimals: true
                },
                emptyMessage: 'Відсутні дати прем’єр для групування за сезонами.'
            };
        }

        case 'scoreDist': {
            const data = groupScoreDistribution(animeList);
            return {
                mode: 'scoreDist',
                data,
                xKey: 'label',
                series: [
                    {
                        dataKey: 'sharePct',
                        name: 'Частка тайтлів у діапазоні',
                        yAxisId: 'left',
                        color: 'var(--accent-color)',
                        kind: 'bar',
                        unit: '%'
                    }
                ],
                leftAxis: {
                    domain: [0, 'auto'],
                    allowDecimals: false,
                    tickFormatter: (v) => `${v}%`
                },
                rightAxis: null,
                emptyMessage: 'Недостатньо оцінених тайтлів для побудови розподілу оцінок.'
            };
        }

        case 'ageAndSubtype': {
            const byAge = options.breakdownBy !== 'subtype';
            const data = byAge ? groupByAgeRating(animeList) : groupBySubtypeMetrics(animeList);
            return {
                mode: 'ageAndSubtype',
                data,
                xKey: 'label',
                series: [
                    {
                        dataKey: 'avgPopularity',
                        name: 'Сер. аудиторія',
                        yAxisId: 'left',
                        color: 'var(--chart-secondary)',
                        kind: 'bar',
                        unit: ' кор.'
                    },
                    {
                        dataKey: 'avgScore',
                        name: 'Середній бал',
                        yAxisId: 'right',
                        color: 'var(--accent-color)',
                        kind: 'line',
                        unit: ' / 10'
                    }
                ],
                leftAxis: {
                    domain: [0, 'auto'],
                    allowDecimals: false,
                    tickFormatter: formatCompactNumber
                },
                rightAxis: {
                    domain: [0, 10],
                    allowDecimals: true
                },
                emptyMessage: byAge
                    ? 'Відсутні дані вікового рейтингу (G/PG/R/R18) у поточній вибірці.'
                    : 'Відсутні дані про формат релізів у поточній вибірці.'
            };
        }

        default:
            return buildChartDataset(animeList, 'hypeVsQuality', options);
    }
}
