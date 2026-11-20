import { useState, useMemo, useId } from 'react';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    ReferenceLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
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
import './ProfileAnalyticsSection.css';

const ANALYTICS_MODES = [
    { value: 'critique', label: 'Моя оцінка vs Kitsu' },
    { value: 'genres', label: 'По жанрах' },
    { value: 'timeline', label: 'Динаміка за часом' },
    { value: 'genreStatus', label: 'Жанри × Статуси' }
];

function ProfileStatusTooltip({ active, payload, label }) {
    if (!active || !Array.isArray(payload) || payload.length === 0) {
        return null;
    }

    const total = payload.reduce((acc, entry) => acc + (Number(entry.value) || 0), 0);

    return (
        <div className="Profile-chart-tooltip">
            <div className="Profile-chart-tooltip-label">{label}</div>
            <div className="Profile-chart-tooltip-rows">
                {payload.map((entry) => (
                    <div key={entry.dataKey} className="Profile-chart-tooltip-row">
                        <span
                            className="Profile-chart-tooltip-dot"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="Profile-chart-tooltip-name">{entry.name}:</span>
                        <span className="Profile-chart-tooltip-val">{entry.value} шт.</span>
                    </div>
                ))}
                {payload.length > 1 && (
                    <div className="Profile-chart-tooltip-total">
                        <span>Разом за період:</span>
                        <strong>{total} шт.</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProfileGenreStatusTooltip({ active, payload, label, isRelative }) {
    if (!active || !Array.isArray(payload) || payload.length === 0) {
        return null;
    }

    const row = payload[0]?.payload || {};

    return (
        <div className="Profile-chart-tooltip">
            <div className="Profile-chart-tooltip-label">
                {label} <span className="Profile-chart-tooltip-count">({row.total || 0} шт.)</span>
            </div>
            <div className="Profile-chart-tooltip-rows">
                {LIBRARY_STATUS_SERIES.map((series) => {
                    const countVal = Number(row[`${series.key}Count`]) || 0;
                    const pctVal = row.total > 0 ? Number(((countVal / row.total) * 100).toFixed(1)) : 0;
                    return (
                        <div key={series.key} className="Profile-chart-tooltip-row">
                            <span
                                className="Profile-chart-tooltip-dot"
                                style={{ backgroundColor: series.color }}
                            />
                            <span className="Profile-chart-tooltip-name">{series.label}:</span>
                            <span className="Profile-chart-tooltip-val">
                                {isRelative ? `${pctVal}% (${countVal})` : `${countVal} шт. (${pctVal}%)`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ProfileCritiqueTooltip({ active, payload, label }) {
    if (!active || !Array.isArray(payload) || payload.length === 0) {
        return null;
    }

    const row = payload[0]?.payload || {};
    const delta = Number(row.delta) || 0;
    const deltaText = delta > 0 ? `+${delta}` : String(delta);

    return (
        <div className="Profile-chart-tooltip">
            <div className="Profile-chart-tooltip-label">{row.fullTitle || label}</div>
            <div className="Profile-chart-tooltip-rows">
                <div className="Profile-chart-tooltip-row">
                    <span className="Profile-chart-tooltip-dot" style={{ backgroundColor: 'var(--accent-color)' }} />
                    <span className="Profile-chart-tooltip-name">Ваша оцінка:</span>
                    <span className="Profile-chart-tooltip-val">{row.userScore} / 10</span>
                </div>
                <div className="Profile-chart-tooltip-row">
                    <span className="Profile-chart-tooltip-dot" style={{ backgroundColor: 'var(--chart-secondary)' }} />
                    <span className="Profile-chart-tooltip-name">Глобальна Kitsu:</span>
                    <span className="Profile-chart-tooltip-val">{row.kitsuScore} / 10</span>
                </div>
                <div className="Profile-chart-tooltip-total">
                    <span>Різниця:</span>
                    <strong>{deltaText}</strong>
                </div>
            </div>
        </div>
    );
}

export function ProfileAnalyticsSection({ libraryItems = [], isEnriching = false }) {
    const profileChartType = useDashboardStore(selectProfileChartType);
    const setProfileChartType = useDashboardStore((state) => state.setProfileChartType);

    const [activeMode, setActiveMode] = useState('critique');
    const [timeframe, setTimeframe] = useState('all');
    const [genreMetric, setGenreMetric] = useState('count');
    const [timelineStatus, setTimelineStatus] = useState('all');
    const [isRelativeMode, setIsRelativeMode] = useState(true);

    const rawId = useId();
    const uid = rawId.replace(/:/g, '');

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

    const renderCritiqueChart = () => {
        if (critiqueData.length === 0) {
            return (
                <div className="Profile-analytics-empty">
                    <span className="Profile-analytics-empty-icon" aria-hidden="true">⚖️</span>
                    <p>
                        {isEnriching
                            ? 'Завантаження глобальних оцінок Kitsu для порівняння...'
                            : 'Поставте власні оцінки (від 1 до 10) тайтлам у бібліотеці, щоб порівняти їх із рейтингом Kitsu.'}
                    </p>
                </div>
            );
        }

        const avgDeltaSign = critiqueSummary.avgDelta > 0
            ? `+${critiqueSummary.avgDelta}`
            : String(critiqueSummary.avgDelta);

        const commonMargins = { top: 10, right: 16, left: -12, bottom: 4 };
        const sharedAxes = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis
                    dataKey="label"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
                <YAxis
                    domain={[0, 10]}
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
                <Tooltip content={<ProfileCritiqueTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }} />
            </>
        );

        let chartElement;
        if (profileChartType === 'scatter') {
            chartElement = (
                <ScatterChart margin={{ top: 14, right: 20, left: -6, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                    <XAxis
                        type="number"
                        dataKey="kitsuScore"
                        name="Оцінка Kitsu"
                        domain={[0, 10]}
                        stroke="var(--text-muted)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        type="number"
                        dataKey="userScore"
                        name="Ваша оцінка"
                        domain={[0, 10]}
                        stroke="var(--text-muted)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                    />
                    <ReferenceLine
                        segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]}
                        stroke="var(--text-muted)"
                        strokeDasharray="4 4"
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ProfileCritiqueTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }} />
                    <Scatter
                        name="Ваша оцінка (Y) vs Kitsu (X)"
                        data={critiqueData}
                        fill="var(--accent-color)"
                    />
                </ScatterChart>
            );
        } else if (profileChartType === 'line') {
            chartElement = (
                <LineChart data={critiqueData} margin={commonMargins}>
                    {sharedAxes}
                    <Line
                        type="monotone"
                        dataKey="userScore"
                        name="Ваша оцінка"
                        stroke="var(--accent-color)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: 'var(--accent-color)', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="kitsuScore"
                        name="Глобальна Kitsu"
                        stroke="var(--chart-secondary)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: 'var(--chart-secondary)', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            );
        } else if (profileChartType === 'area') {
            chartElement = (
                <AreaChart data={critiqueData} margin={commonMargins}>
                    <defs>
                        <linearGradient id={`crit-user-${uid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.42} />
                            <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id={`crit-kitsu-${uid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--chart-secondary)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="var(--chart-secondary)" stopOpacity={0.03} />
                        </linearGradient>
                    </defs>
                    {sharedAxes}
                    <Area
                        type="monotone"
                        dataKey="userScore"
                        name="Ваша оцінка"
                        stroke="var(--accent-color)"
                        strokeWidth={2.2}
                        fillOpacity={1}
                        fill={`url(#crit-user-${uid})`}
                    />
                    <Area
                        type="monotone"
                        dataKey="kitsuScore"
                        name="Глобальна Kitsu"
                        stroke="var(--chart-secondary)"
                        strokeWidth={2.2}
                        fillOpacity={1}
                        fill={`url(#crit-kitsu-${uid})`}
                    />
                </AreaChart>
            );
        } else {
            chartElement = (
                <BarChart data={critiqueData} margin={commonMargins}>
                    {sharedAxes}
                    <Bar
                        dataKey="userScore"
                        name="Ваша оцінка"
                        fill="var(--accent-color)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={32}
                    />
                    <Bar
                        dataKey="kitsuScore"
                        name="Глобальна Kitsu"
                        fill="var(--chart-secondary)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={32}
                    />
                </BarChart>
            );
        }

        return (
            <>
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
                <div className="Profile-chart-canvas">
                    <ResponsiveContainer width="100%" height={320} minWidth={0}>
                        {chartElement}
                    </ResponsiveContainer>
                </div>
            </>
        );
    };

    const renderTimelineChart = () => {
        if (timelineData.length === 0) {
            return (
                <div className="Profile-analytics-empty">
                    <span className="Profile-analytics-empty-icon" aria-hidden="true">📅</span>
                    <p>Недостатньо датованих записів для побудови часової динаміки.</p>
                </div>
            );
        }

        const commonMargins = { top: 10, right: 16, left: -12, bottom: 4 };
        const stackKey = timelineStatus === 'all' ? 'timelineStatus' : undefined;

        const axes = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis
                    dataKey="label"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
                <Tooltip content={<ProfileStatusTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }} />
            </>
        );

        let chartElement;
        if (profileChartType === 'line') {
            chartElement = (
                <LineChart data={timelineData} margin={commonMargins}>
                    {axes}
                    {visibleTimelineSeries.map((series) => (
                        <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={2.4}
                            dot={{ r: 3.5, fill: series.color, strokeWidth: 0 }}
                            activeDot={{ r: 5.5 }}
                        />
                    ))}
                </LineChart>
            );
        } else if (profileChartType === 'area') {
            chartElement = (
                <AreaChart data={timelineData} margin={commonMargins}>
                    <defs>
                        {visibleTimelineSeries.map((series) => (
                            <linearGradient
                                key={series.key}
                                id={`tl-grad-${series.key}-${uid}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={series.color} stopOpacity={0.45} />
                                <stop offset="95%" stopColor={series.color} stopOpacity={0.04} />
                            </linearGradient>
                        ))}
                    </defs>
                    {axes}
                    {visibleTimelineSeries.map((series) => (
                        <Area
                            key={series.key}
                            type="monotone"
                            stackId={stackKey}
                            dataKey={series.key}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#tl-grad-${series.key}-${uid})`}
                        />
                    ))}
                </AreaChart>
            );
        } else {
            chartElement = (
                <BarChart data={timelineData} margin={commonMargins}>
                    {axes}
                    {visibleTimelineSeries.map((series) => (
                        <Bar
                            key={series.key}
                            stackId={stackKey}
                            dataKey={series.key}
                            name={series.label}
                            fill={series.color}
                            radius={stackKey ? [0, 0, 0, 0] : [5, 5, 0, 0]}
                            maxBarSize={44}
                        />
                    ))}
                </BarChart>
            );
        }

        return (
            <div className="Profile-chart-canvas">
                <ResponsiveContainer width="100%" height={320} minWidth={0}>
                    {chartElement}
                </ResponsiveContainer>
            </div>
        );
    };

    const renderGenreStatusChart = () => {
        if (genreStatusData.length === 0) {
            return (
                <div className="Profile-analytics-empty">
                    <span className="Profile-analytics-empty-icon" aria-hidden="true">🎭</span>
                    <p>
                        {isEnriching
                            ? 'Завантаження жанрів для тайтлів бібліотеки...'
                            : 'Для порівняння жанрів за статусами потрібні жанри у збережених тайтлах.'}
                    </p>
                </div>
            );
        }

        const commonMargins = { top: 10, right: 16, left: -10, bottom: 4 };

        const axes = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis
                    dataKey="label"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
                <YAxis
                    domain={isRelativeMode ? [0, 100] : [0, 'auto']}
                    allowDecimals={false}
                    tickFormatter={isRelativeMode ? (v) => `${v}%` : undefined}
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
                <Tooltip content={<ProfileGenreStatusTooltip isRelative={isRelativeMode} />} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }} />
            </>
        );

        let chartElement;
        if (profileChartType === 'line') {
            chartElement = (
                <LineChart data={genreStatusData} margin={commonMargins}>
                    {axes}
                    {LIBRARY_STATUS_SERIES.map((series) => (
                        <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={2.4}
                            dot={{ r: 3.5, fill: series.color, strokeWidth: 0 }}
                            activeDot={{ r: 5.5 }}
                        />
                    ))}
                </LineChart>
            );
        } else if (profileChartType === 'area') {
            chartElement = (
                <AreaChart data={genreStatusData} margin={commonMargins}>
                    <defs>
                        {LIBRARY_STATUS_SERIES.map((series) => (
                            <linearGradient
                                key={series.key}
                                id={`gs-grad-${series.key}-${uid}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={series.color} stopOpacity={0.5} />
                                <stop offset="95%" stopColor={series.color} stopOpacity={0.08} />
                            </linearGradient>
                        ))}
                    </defs>
                    {axes}
                    {LIBRARY_STATUS_SERIES.map((series) => (
                        <Area
                            key={series.key}
                            type="monotone"
                            stackId="genreStatus"
                            dataKey={series.key}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={1.8}
                            fillOpacity={1}
                            fill={`url(#gs-grad-${series.key}-${uid})`}
                        />
                    ))}
                </AreaChart>
            );
        } else {
            chartElement = (
                <BarChart data={genreStatusData} margin={commonMargins}>
                    {axes}
                    {LIBRARY_STATUS_SERIES.map((series) => (
                        <Bar
                            key={series.key}
                            stackId="genreStatus"
                            dataKey={series.key}
                            name={series.label}
                            fill={series.color}
                            maxBarSize={48}
                        />
                    ))}
                </BarChart>
            );
        }

        return (
            <div className="Profile-chart-canvas">
                <ResponsiveContainer width="100%" height={320} minWidth={0}>
                    {chartElement}
                </ResponsiveContainer>
            </div>
        );
    };

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

        if (activeMode === 'critique') {
            return renderCritiqueChart();
        }

        if (activeMode === 'genres') {
            return (
                <AnimeChart
                    data={genreData}
                    chartType={profileChartType}
                    xKey="label"
                    series={[
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
                    ]}
                    leftAxis={{ domain: [0, 'auto'], allowDecimals: false }}
                    rightAxis={{ domain: [0, 10], allowDecimals: true }}
                    loading={isEnriching && genreData.length === 0}
                    emptyMessage="Для тайтлів за цей період ще не завантажено жанри."
                />
            );
        }

        if (activeMode === 'timeline') {
            return renderTimelineChart();
        }

        return renderGenreStatusChart();
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
