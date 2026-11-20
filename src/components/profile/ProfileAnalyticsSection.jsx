import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    PROFILE_TIMEFRAME_OPTIONS,
    LIBRARY_STATUS_SERIES,
    filterLibraryByTimeframe,
    buildPersonalGenreStats,
    buildStatusTimeline,
    buildGenreStatusComparison,
    buildUserVsKitsuComparison,
    summarizeUserCritique
} from '../../utils/profileAnalytics.js';
import { useDashboardStore, selectProfileChartType } from '../../store/index.js';
import ChartTypeSwitcher from '../charts/ChartTypeSwitcher.jsx';
import AnimeChart from '../charts/AnimeChart.jsx';
import {
    ProfileStatusTooltip,
    ProfileGenreStatusTooltip,
    ProfileCritiqueTooltip
} from './ProfileChartTooltips.jsx';
import './ProfileAnalyticsSection.css';

const ANALYTICS_MODES = [
    { value: 'critique', label: 'Моя оцінка vs Kitsu' },
    { value: 'genres', label: 'По жанрах' },
    { value: 'timeline', label: 'Динаміка за часом' },
    { value: 'genreStatus', label: 'Жанри × Статуси' }
];

export function ProfileAnalyticsSection({ libraryItems = [], isEnriching = false }) {
    const profileChartType = useDashboardStore(selectProfileChartType);
    const setProfileChartType = useDashboardStore((state) => state.setProfileChartType);

    const [activeMode, setActiveMode] = useState('critique');
    const [timeframe, setTimeframe] = useState('all');
    const [genreMetric, setGenreMetric] = useState('count');
    const [timelineStatus, setTimelineStatus] = useState('all');
    const [isRelativeMode, setIsRelativeMode] = useState(true);

    const timeframeFiltered = useMemo(
        () => filterLibraryByTimeframe(libraryItems, timeframe),
        [libraryItems, timeframe]
    );

    const genreData = useMemo(
        () => buildPersonalGenreStats(timeframeFiltered, 10),
        [timeframeFiltered]
    );

    const timelineData = useMemo(
        () => buildStatusTimeline(timeframeFiltered, timeframe),
        [timeframeFiltered, timeframe]
    );

    const genreStatusData = useMemo(
        () => buildGenreStatusComparison(timeframeFiltered, { maxGenres: 8, relative: isRelativeMode }),
        [timeframeFiltered, isRelativeMode]
    );

    const critiqueData = useMemo(
        () => buildUserVsKitsuComparison(timeframeFiltered, 15),
        [timeframeFiltered]
    );

    const critiqueSummary = useMemo(
        () => summarizeUserCritique(critiqueData),
        [critiqueData]
    );

    const visibleTimelineSeries = useMemo(() => {
        if (timelineStatus === 'all') return LIBRARY_STATUS_SERIES;
        return LIBRARY_STATUS_SERIES.filter((s) => s.key === timelineStatus);
    }, [timelineStatus]);

    const chartConfig = useMemo(() => {
        if (activeMode === 'critique') {
            return {
                data: critiqueData,
                scatterData: critiqueData,
                scatterConfig: {
                    xKey: 'kitsuScore',
                    xName: 'Оцінка Kitsu',
                    xDomain: [0, 10],
                    yKey: 'userScore',
                    yName: 'Ваша оцінка',
                    yDomain: [0, 10],
                    diagonalReference: true,
                    seriesName: 'Ваша оцінка (Y) vs Kitsu (X)'
                },
                series: [
                    {
                        dataKey: 'userScore',
                        name: 'Ваша оцінка',
                        yAxisId: 'left',
                        color: 'var(--accent-color)',
                        kind: 'bar',
                        maxBarSize: 32
                    },
                    {
                        dataKey: 'kitsuScore',
                        name: 'Глобальна Kitsu',
                        yAxisId: 'left',
                        color: 'var(--chart-secondary)',
                        kind: 'bar',
                        maxBarSize: 32
                    }
                ],
                leftAxis: { domain: [0, 10], allowDecimals: true },
                rightAxis: null,
                tooltipContent: <ProfileCritiqueTooltip />,
                scatterTooltipContent: <ProfileCritiqueTooltip />,
                loading: isEnriching && critiqueData.length === 0,
                emptyMessage: isEnriching
                    ? 'Завантаження глобальних оцінок Kitsu для порівняння...'
                    : 'Поставте власні оцінки (від 1 до 10) тайтлам у бібліотеці, щоб порівняти їх із рейтингом Kitsu.'
            };
        }

        if (activeMode === 'genres') {
            return {
                data: genreData,
                series: [
                    {
                        dataKey: genreMetric,
                        name: genreMetric === 'episodes' ? 'Переглянуто серій' : 'Кількість тайтлів',
                        yAxisId: 'left',
                        color: 'var(--chart-secondary)',
                        kind: 'bar',
                        unit: genreMetric === 'episodes' ? ' сер.' : ' шт.'
                    },
                    {
                        dataKey: 'avgUserScore',
                        name: 'Середня ваша оцінка',
                        yAxisId: 'right',
                        color: 'var(--accent-color)',
                        kind: 'line',
                        unit: ' / 10'
                    }
                ],
                leftAxis: { domain: [0, 'auto'], allowDecimals: false },
                rightAxis: { domain: [0, 10], allowDecimals: true },
                loading: isEnriching && genreData.length === 0,
                emptyMessage: 'Для тайтлів за цей період ще не завантажено жанри.'
            };
        }

        if (activeMode === 'timeline') {
            const stackId = timelineStatus === 'all' ? 'timelineStatus' : undefined;
            return {
                data: timelineData,
                series: visibleTimelineSeries.map((s) => ({
                    dataKey: s.key,
                    name: s.label,
                    yAxisId: 'left',
                    color: s.color,
                    kind: 'bar',
                    stackId,
                    maxBarSize: 44
                })),
                leftAxis: { domain: [0, 'auto'], allowDecimals: false },
                rightAxis: null,
                tooltipContent: <ProfileStatusTooltip />,
                loading: false,
                emptyMessage: 'Недостатньо датованих записів для побудови часової динаміки.'
            };
        }

        return {
            data: genreStatusData,
            series: LIBRARY_STATUS_SERIES.map((s) => ({
                dataKey: s.key,
                name: s.label,
                yAxisId: 'left',
                color: s.color,
                kind: 'bar',
                stackId: 'genreStatus',
                maxBarSize: 48
            })),
            leftAxis: {
                domain: isRelativeMode ? [0, 100] : [0, 'auto'],
                allowDecimals: false,
                tickFormatter: isRelativeMode ? (v) => `${v}%` : undefined
            },
            rightAxis: null,
            tooltipContent: <ProfileGenreStatusTooltip isRelative={isRelativeMode} />,
            loading: isEnriching && genreStatusData.length === 0,
            emptyMessage: isEnriching
                ? 'Завантаження жанрів для тайтлів бібліотеки...'
                : 'Для порівняння жанрів за статусами потрібні жанри у збережених тайтлах.'
        };
    }, [
        activeMode,
        critiqueData,
        genreData,
        genreMetric,
        timelineData,
        timelineStatus,
        visibleTimelineSeries,
        genreStatusData,
        isRelativeMode,
        isEnriching
    ]);

    const avgDeltaSign = critiqueSummary.avgDelta > 0
        ? `+${critiqueSummary.avgDelta}`
        : String(critiqueSummary.avgDelta);

    const renderBody = () => {
        if (libraryItems.length === 0) {
            return (
                <div className="Profile-analytics-empty">
                    <span className="Profile-analytics-empty-icon" aria-hidden="true">📊</span>
                    <p>Додайте тайтли до своєї бібліотеки, щоб побачити персоналізовану аналітику перегляду.</p>
                    <Link to="/" className="Profile-go-catalog-btn">
                        Перейти до каталогу аніме
                    </Link>
                </div>
            );
        }

        if (timeframeFiltered.length === 0) {
            return (
                <div className="Profile-analytics-empty">
                    <span className="Profile-analytics-empty-icon" aria-hidden="true">🕒</span>
                    <p>За обраний період змін у бібліотеці не знайдено.</p>
                    <button
                        type="button"
                        className="Profile-analytics-reset-btn"
                        onClick={() => setTimeframe('all')}
                    >
                        Показати за весь час
                    </button>
                </div>
            );
        }

        return (
            <>
                {activeMode === 'critique' && critiqueData.length > 0 && (
                    <div className="Profile-critique-summary">
                        <span className="Critique-badge">
                            Середній зсув: <strong>{avgDeltaSign}</strong>
                        </span>
                        <span className="Critique-badge positive">
                            Вище за Kitsu: <strong>{critiqueSummary.overratedCount}</strong>
                        </span>
                        <span className="Critique-badge neutral">
                            Збігаються (±0.25): <strong>{critiqueSummary.alignedCount}</strong>
                        </span>
                        <span className="Critique-badge negative">
                            Жорсткіше за Kitsu: <strong>{critiqueSummary.underratedCount}</strong>
                        </span>
                    </div>
                )}

                <AnimeChart
                    data={chartConfig.data}
                    scatterData={chartConfig.scatterData || null}
                    scatterConfig={chartConfig.scatterConfig || null}
                    chartType={profileChartType}
                    xKey="label"
                    series={chartConfig.series}
                    leftAxis={chartConfig.leftAxis}
                    rightAxis={chartConfig.rightAxis}
                    tooltipContent={chartConfig.tooltipContent || null}
                    scatterTooltipContent={chartConfig.scatterTooltipContent || null}
                    loading={chartConfig.loading}
                    emptyMessage={chartConfig.emptyMessage}
                />
            </>
        );
    };

    return (
        <section className="Profile-analytics-box" aria-label="Персональна аналітика перегляду">
            <div className="Profile-analytics-header">
                <div className="Profile-analytics-title-wrap">
                    <h3 className="Profile-analytics-title">Персональна аналітика перегляду</h3>
                    <span className="Profile-analytics-sub">
                        Записів у періоді: <strong>{timeframeFiltered.length}</strong> з {libraryItems.length}
                        {isEnriching ? ' • оновлення метаданих...' : ''}
                    </span>
                </div>

                <div className="Profile-analytics-controls">
                    <div className="Profile-timeframe-pills" role="group" aria-label="Часові рамки">
                        {PROFILE_TIMEFRAME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`Profile-timeframe-btn ${timeframe === opt.value ? 'active' : ''}`}
                                onClick={() => setTimeframe(opt.value)}
                                aria-pressed={timeframe === opt.value}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="Profile-analytics-toolbar">
                <div className="Profile-mode-tabs" role="group" aria-label="Режим аналітики">
                    {ANALYTICS_MODES.map((mode) => (
                        <button
                            key={mode.value}
                            type="button"
                            className={`Profile-mode-tab ${activeMode === mode.value ? 'active' : ''}`}
                            onClick={() => setActiveMode(mode.value)}
                            aria-pressed={activeMode === mode.value}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                <div className="Profile-analytics-subcontrols">
                    {activeMode === 'genres' && (
                        <div className="Profile-subswitch" role="group" aria-label="Метрика жанрів">
                            <button
                                type="button"
                                className={`Profile-subswitch-btn ${genreMetric === 'count' ? 'active' : ''}`}
                                onClick={() => setGenreMetric('count')}
                            >
                                Тайтли
                            </button>
                            <button
                                type="button"
                                className={`Profile-subswitch-btn ${genreMetric === 'episodes' ? 'active' : ''}`}
                                onClick={() => setGenreMetric('episodes')}
                            >
                                Серії
                            </button>
                        </div>
                    )}

                    {activeMode === 'timeline' && (
                        <div className="Profile-subswitch" role="group" aria-label="Фільтр статусу динаміки">
                            <button
                                type="button"
                                className={`Profile-subswitch-btn ${timelineStatus === 'all' ? 'active' : ''}`}
                                onClick={() => setTimelineStatus('all')}
                            >
                                Всі
                            </button>
                            {LIBRARY_STATUS_SERIES.map((series) => (
                                <button
                                    key={series.key}
                                    type="button"
                                    className={`Profile-subswitch-btn ${timelineStatus === series.key ? 'active' : ''}`}
                                    onClick={() => setTimelineStatus(series.key)}
                                >
                                    {series.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeMode === 'genreStatus' && (
                        <div className="Profile-subswitch" role="group" aria-label="Режим порівняння статусів">
                            <button
                                type="button"
                                className={`Profile-subswitch-btn ${isRelativeMode ? 'active' : ''}`}
                                onClick={() => setIsRelativeMode(true)}
                            >
                                Відносно (%)
                            </button>
                            <button
                                type="button"
                                className={`Profile-subswitch-btn ${!isRelativeMode ? 'active' : ''}`}
                                onClick={() => setIsRelativeMode(false)}
                            >
                                Кількість (шт.)
                            </button>
                        </div>
                    )}

                    <ChartTypeSwitcher
                        value={profileChartType}
                        onChange={setProfileChartType}
                        allowScatter={activeMode === 'critique'}
                    />
                </div>
            </div>

            {renderBody()}
        </section>
    );
}

export default ProfileAnalyticsSection;
