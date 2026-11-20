const BENCHMARK_SCORE = 7.00;

export function createKpiAccumulator() {
    return {
        totalCount: 0,
        scoredCount: 0,
        scoreSum: 0,
        maxScore: 0,
        airingCount: 0
    };
}

export function accumulateKpiBatch(acc, items = []) {
    if (!Array.isArray(items) || items.length === 0) return acc;

    for (const item of items) {
        acc.totalCount += 1;

        const status = (item.status || '').toLowerCase();
        if (status === 'current' || status === 'airing') {
            acc.airingCount += 1;
        }

        if (item.score !== null && item.score !== undefined && item.score !== '' && item.score !== '?' && item.score !== 'N/A') {
            const num = Number(item.score);
            if (!Number.isNaN(num) && num > 0) {
                acc.scoredCount += 1;
                acc.scoreSum += num;
                if (num > acc.maxScore) {
                    acc.maxScore = num;
                }
            }
        }
    }

    return acc;
}

export function buildKpisFromAccumulator(acc) {
    if (!acc || acc.totalCount === 0) {
        return [
            {
                id: 'kpi-avg-score',
                title: 'Середній бал бази',
                value: 'N/A',
                change: null,
                unit: ''
            },
            {
                id: 'kpi-top-score',
                title: 'Найвищий рейтинг',
                value: 'N/A',
                change: null,
                unit: ''
            },
            {
                id: 'kpi-airing-share',
                title: 'Частка онґоїнґів',
                value: '0 / 0',
                change: '0.0',
                unit: '%'
            }
        ];
    }

    let avgScoreValue = 'N/A';
    let avgScoreDelta = null;
    let maxScoreValue = 'N/A';
    let topScoreDelta = null;

    if (acc.scoredCount > 0) {
        const avgScore = acc.scoreSum / acc.scoredCount;
        avgScoreValue = avgScore.toFixed(2);
        avgScoreDelta = (avgScore - BENCHMARK_SCORE).toFixed(2);

        maxScoreValue = acc.maxScore.toFixed(2);
        topScoreDelta = (acc.maxScore - avgScore).toFixed(2);
    }

    const airingPercentage = ((acc.airingCount / acc.totalCount) * 100).toFixed(1);

    return [
        {
            id: 'kpi-avg-score',
            title: 'Середній бал бази',
            value: avgScoreValue,
            change: avgScoreDelta,
            unit: ''
        },
        {
            id: 'kpi-top-score',
            title: 'Найвищий рейтинг',
            value: maxScoreValue,
            change: topScoreDelta,
            unit: ''
        },
        {
            id: 'kpi-airing-share',
            title: 'Частка онґоїнґів',
            value: `${acc.airingCount} / ${acc.totalCount}`,
            change: airingPercentage,
            unit: '%'
        }
    ];
}

export function calculateKpis(animeList = []) {
    if (!Array.isArray(animeList) || animeList.length === 0) {
        return buildKpisFromAccumulator(null);
    }
    const acc = createKpiAccumulator();
    accumulateKpiBatch(acc, animeList);
    return buildKpisFromAccumulator(acc);
}
