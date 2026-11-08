export function calculateKpis(animeList = []) {
    const BENCHMARK_SCORE = 7.00;

    if (!Array.isArray(animeList) || animeList.length === 0) {
        return [
            {
                id: 'kpi-avg-score',
                title: 'Середній бал вибірки',
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

    const scoredAnime = animeList.filter((a) => {
        if (a.score == null || a.score === '' || a.score === '?' || a.score === 'N/A') return false;
        const num = Number(a.score);
        return !isNaN(num) && num > 0;
    });

    let avgScoreValue = 'N/A';
    let avgScoreDelta = null;
    let maxScoreValue = 'N/A';
    let topScoreDelta = null;

    if (scoredAnime.length > 0) {
        const totalScore = scoredAnime.reduce((acc, curr) => acc + Number(curr.score), 0);
        const avgScore = totalScore / scoredAnime.length;
        avgScoreValue = avgScore.toFixed(2);
        avgScoreDelta = (avgScore - BENCHMARK_SCORE).toFixed(2);

        const scoreValues = scoredAnime.map((a) => Number(a.score));
        const maxScore = Math.max(...scoreValues);
        maxScoreValue = maxScore.toFixed(2);
        topScoreDelta = (maxScore - avgScore).toFixed(2);
    }

    const airingAnime = animeList.filter((a) => {
        const s = (a.status || '').toLowerCase();
        return s === 'current' || s === 'airing';
    });
    const airingCount = airingAnime.length;
    const airingPercentage = ((airingCount / animeList.length) * 100).toFixed(1);

    return [
        {
            id: 'kpi-avg-score',
            title: 'Середній бал вибірки',
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
            value: `${airingCount} / ${animeList.length}`,
            change: airingPercentage,
            unit: '%'
        }
    ];
}
