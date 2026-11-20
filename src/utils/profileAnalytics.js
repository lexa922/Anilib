export const PROFILE_TIMEFRAME_OPTIONS = [
    { value: 'all', label: 'За весь час', days: null },
    { value: '7d', label: '7 днів', days: 7 },
    { value: '30d', label: '30 днів', days: 30 },
    { value: '90d', label: '90 днів', days: 90 },
    { value: '365d', label: 'Рік', days: 365 }
];

export const LIBRARY_STATUS_SERIES = [
    { key: 'completed', label: 'Переглянуто', color: '#10b981' },
    { key: 'watching', label: 'Дивлюсь', color: '#3b82f6' },
    { key: 'plan_to_watch', label: 'У планах', color: '#f59e0b' },
    { key: 'dropped', label: 'Покинуто', color: '#ef4444' }
];

export function parseSqliteTimestamp(ts) {
    if (!ts) return null;
    if (ts instanceof Date) {
        return Number.isNaN(ts.getTime()) ? null : ts;
    }
    if (typeof ts === 'number') {
        const d = new Date(ts);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const trimmed = String(ts).trim();
    if (!trimmed) return null;

    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)
        ? `${trimmed.replace(' ', 'T')}Z`
        : trimmed;

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function extractItemGenres(item) {
    if (!item || !Array.isArray(item.genres)) return [];

    const seen = new Set();
    const list = [];
    for (const entry of item.genres) {
        const name = typeof entry === 'string'
            ? entry.trim()
            : String(entry?.name || entry?.title || '').trim();
        if (name && !seen.has(name)) {
            seen.add(name);
            list.push(name);
        }
    }
    return list;
}

export function filterLibraryByTimeframe(items = [], timeframe = 'all', now = Date.now()) {
    if (!Array.isArray(items)) return [];

    const option = PROFILE_TIMEFRAME_OPTIONS.find((opt) => opt.value === timeframe);
    if (!option || !option.days) {
        return items;
    }

    const cutoffMs = now - option.days * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
        const date = parseSqliteTimestamp(item?.updated_at || item?.created_at);
        return date ? date.getTime() >= cutoffMs : false;
    });
}

export function buildPersonalGenreStats(items = [], maxGenres = 10) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const buckets = new Map();

    for (const item of items) {
        if (!item) continue;
        const genres = extractItemGenres(item);
        if (genres.length === 0) continue;

        const episodes = Math.max(0, Number(item.episodes_watched) || 0);
        const userScore = Number(item.user_score);
        const hasScore = !Number.isNaN(userScore) && userScore > 0;
        const isCompleted = item.status === 'completed';

        for (const genre of genres) {
            if (!buckets.has(genre)) {
                buckets.set(genre, {
                    label: genre,
                    count: 0,
                    episodes: 0,
                    scoreSum: 0,
                    scoredCount: 0,
                    completedCount: 0
                });
            }

            const bucket = buckets.get(genre);
            bucket.count += 1;
            bucket.episodes += episodes;
            if (hasScore) {
                bucket.scoreSum += userScore;
                bucket.scoredCount += 1;
            }
            if (isCompleted) {
                bucket.completedCount += 1;
            }
        }
    }

    return Array.from(buckets.values())
        .map((bucket) => ({
            label: bucket.label,
            count: bucket.count,
            episodes: bucket.episodes,
            avgUserScore: bucket.scoredCount > 0
                ? Number((bucket.scoreSum / bucket.scoredCount).toFixed(2))
                : 0,
            completedCount: bucket.completedCount
        }))
        .sort((a, b) => (b.count - a.count) || (b.episodes - a.episodes) || (b.avgUserScore - a.avgUserScore))
        .slice(0, maxGenres);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

export function buildStatusTimeline(items = [], timeframe = 'all') {
    if (!Array.isArray(items) || items.length === 0) return [];

    const datedEntries = [];
    for (const item of items) {
        const date = parseSqliteTimestamp(item?.updated_at || item?.created_at);
        if (date) {
            datedEntries.push({ item, date });
        }
    }

    if (datedEntries.length === 0) return [];

    let minTime = Infinity;
    let maxTime = -Infinity;
    for (const entry of datedEntries) {
        const ms = entry.date.getTime();
        if (ms < minTime) minTime = ms;
        if (ms > maxTime) maxTime = ms;
    }
    const spanDays = (maxTime - minTime) / (24 * 60 * 60 * 1000);

    let granularity = 'month';
    if (timeframe === '7d' || timeframe === '30d' || (timeframe === 'all' && spanDays <= 45)) {
        granularity = 'day';
    } else if (timeframe === '90d' || (timeframe === 'all' && spanDays <= 120)) {
        granularity = 'week';
    }

    const monthFormatter = new Intl.DateTimeFormat('uk-UA', {
        month: 'short',
        year: 'numeric'
    });

    const buckets = new Map();

    for (const { item, date } of datedEntries) {
        let sortKey;
        let label;

        if (granularity === 'day') {
            const y = date.getFullYear();
            const m = pad2(date.getMonth() + 1);
            const d = pad2(date.getDate());
            sortKey = `${y}-${m}-${d}`;
            label = `${d}.${m}`;
        } else if (granularity === 'week') {
            const day = date.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday);
            const y = monday.getFullYear();
            const m = pad2(monday.getMonth() + 1);
            const d = pad2(monday.getDate());
            sortKey = `${y}-${m}-${d}`;
            label = `Тиж. ${d}.${m}`;
        } else {
            const y = date.getFullYear();
            const m = pad2(date.getMonth() + 1);
            sortKey = `${y}-${m}`;
            label = monthFormatter.format(date).replace(/\.$/, '');
        }

        if (!buckets.has(sortKey)) {
            buckets.set(sortKey, {
                label,
                sortKey,
                completed: 0,
                watching: 0,
                plan_to_watch: 0,
                dropped: 0,
                total: 0
            });
        }

        const bucket = buckets.get(sortKey);
        const status = item.status || 'plan_to_watch';
        if (Object.hasOwn(bucket, status)) {
            bucket[status] += 1;
        }
        bucket.total += 1;
    }

    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function buildGenreStatusComparison(items = [], { maxGenres = 8, relative = true } = {}) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const buckets = new Map();

    for (const item of items) {
        if (!item) continue;
        const genres = extractItemGenres(item);
        if (genres.length === 0) continue;

        const status = item.status || 'plan_to_watch';

        for (const genre of genres) {
            if (!buckets.has(genre)) {
                buckets.set(genre, {
                    label: genre,
                    completedCount: 0,
                    watchingCount: 0,
                    plan_to_watchCount: 0,
                    droppedCount: 0,
                    total: 0
                });
            }

            const bucket = buckets.get(genre);
            if (status === 'completed') bucket.completedCount += 1;
            else if (status === 'watching') bucket.watchingCount += 1;
            else if (status === 'plan_to_watch') bucket.plan_to_watchCount += 1;
            else if (status === 'dropped') bucket.droppedCount += 1;

            bucket.total += 1;
        }
    }

    const topBuckets = Array.from(buckets.values())
        .sort((a, b) => (b.total - a.total) || (b.completedCount - a.completedCount))
        .slice(0, maxGenres);

    return topBuckets.map((bucket) => {
        if (!relative || bucket.total === 0) {
            return {
                ...bucket,
                completed: bucket.completedCount,
                watching: bucket.watchingCount,
                plan_to_watch: bucket.plan_to_watchCount,
                dropped: bucket.droppedCount
            };
        }

        const keys = ['completed', 'watching', 'plan_to_watch', 'dropped'];
        const counts = {
            completed: bucket.completedCount,
            watching: bucket.watchingCount,
            plan_to_watch: bucket.plan_to_watchCount,
            dropped: bucket.droppedCount
        };

        const percentages = {};
        let sum = 0;
        let maxKey = null;
        let maxCount = -1;

        for (const k of keys) {
            const pct = Number(((counts[k] / bucket.total) * 100).toFixed(1));
            percentages[k] = pct;
            sum += pct;
            if (counts[k] > maxCount) {
                maxCount = counts[k];
                maxKey = k;
            }
        }

        if (maxKey && maxCount > 0 && Math.abs(100 - sum) > 0.01) {
            percentages[maxKey] = Number((percentages[maxKey] + (100 - sum)).toFixed(1));
        }

        return {
            ...bucket,
            ...percentages
        };
    });
}

export function buildUserVsKitsuComparison(items = [], maxItems = 15) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const valid = [];
    for (const item of items) {
        if (!item) continue;
        const userScore = Number(item.user_score);
        const kitsuScore = Number(item.kitsu_score);
        if (
            Number.isNaN(userScore) || userScore <= 0 ||
            Number.isNaN(kitsuScore) || kitsuScore <= 0
        ) {
            continue;
        }

        const rawTitle = String(item.title || 'Без назви').trim();
        const label = rawTitle.length > 16 ? `${rawTitle.slice(0, 15)}…` : rawTitle;
        const cleanUser = Number(userScore.toFixed(2));
        const cleanKitsu = Number(kitsuScore.toFixed(2));
        const delta = Number((cleanUser - cleanKitsu).toFixed(2));

        valid.push({
            id: String(item.id),
            label,
            fullTitle: rawTitle,
            userScore: cleanUser,
            kitsuScore: cleanKitsu,
            delta
        });
    }

    return valid
        .sort((a, b) => (b.delta - a.delta) || (b.userScore - a.userScore))
        .slice(0, maxItems);
}

export function summarizeUserCritique(comparisonData = []) {
    if (!Array.isArray(comparisonData) || comparisonData.length === 0) {
        return { count: 0, avgDelta: 0, overratedCount: 0, underratedCount: 0, alignedCount: 0 };
    }

    let deltaSum = 0;
    let overratedCount = 0;
    let underratedCount = 0;
    let alignedCount = 0;

    for (const row of comparisonData) {
        const d = Number(row.delta) || 0;
        deltaSum += d;
        if (d > 0.25) overratedCount += 1;
        else if (d < -0.25) underratedCount += 1;
        else alignedCount += 1;
    }

    return {
        count: comparisonData.length,
        avgDelta: Number((deltaSum / comparisonData.length).toFixed(2)),
        overratedCount,
        underratedCount,
        alignedCount
    };
}