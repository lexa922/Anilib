export function calculateKpis(animeList = []) {
    const BENCHMARK_SCORE = 7.50;

    if (!Array.isArray(animeList) || animeList.length === 0) {
        return [
            {
                id: 'kpi-avg-score',
                title: 'Середній бал вибірки',
                value: '0.00',
                change: '0.00',
                unit: ''
            },
            {
                id: 'kpi-top-score',
                title: 'Найвищий рейтинг',
                value: '0.00',
                change: '0.00',
                unit: ''
            },
            {
                id: 'kpi-airing-share',
                title: 'Частка онґоїнґів',
                value: '0',
                change: '0.0',
                unit: '%'
            }
        ];
    }

    const scoredAnime = animeList.filter((a) => a.score != null && !isNaN(Number(a.score)));

    const totalScore = scoredAnime.reduce((acc, curr) => acc + Number(curr.score), 0);
    const avgScore = scoredAnime.length > 0 ? totalScore / scoredAnime.length : 0;
    const avgScoreDelta = (avgScore - BENCHMARK_SCORE).toFixed(2);

    const scoreValues = scoredAnime.map((a) => Number(a.score));
    const maxScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
    const topScoreDelta = (maxScore - avgScore).toFixed(2);

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
            value: avgScore.toFixed(2),
            change: avgScoreDelta,
            unit: ''
        },
        {
            id: 'kpi-top-score',
            title: 'Найвищий рейтинг',
            value: maxScore.toFixed(2),
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
