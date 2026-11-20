import { useId } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    ZAxis,
    ReferenceLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import './AnimeChart.css';

function formatTooltipValue(val, unit = '') {
    if (typeof val === 'number') {
        return `${val.toLocaleString('uk-UA')}${unit}`;
    }
    return `${val}${unit}`;
}

function ChartTooltip({ active, payload, label, seriesMeta = [] }) {
    if (!active || !Array.isArray(payload) || payload.length === 0) {
        return null;
    }

    const row = payload[0]?.payload || {};
    const headerTitle = row.fullTitle || label;
    const unitByKey = new Map(seriesMeta.map((s) => [s.dataKey, s.unit || '']));
    const plottedKeys = new Set(seriesMeta.map((s) => s.dataKey));

    return (
        <div className="Anime-chart-tooltip">
            <div className="Anime-chart-tooltip-label">{headerTitle}</div>
            {row.insight && (
                <div className="Anime-chart-tooltip-insight">{row.insight}</div>
            )}
            <div className="Anime-chart-tooltip-rows">
                {payload.map((entry) => {
                    const unit = unitByKey.get(entry.dataKey) || '';
                    return (
                        <div key={entry.dataKey || entry.name} className="Anime-chart-tooltip-row">
                            <span
                                className="Anime-chart-tooltip-dot"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="Anime-chart-tooltip-name">{entry.name}:</span>
                            <span className="Anime-chart-tooltip-val">
                                {formatTooltipValue(entry.value, unit)}
                            </span>
                        </div>
                    );
                })}

                {row.count != null && !plottedKeys.has('count') && (
                    <div className="Anime-chart-tooltip-meta">
                        Тайтлів у групі: <strong>{Number(row.count).toLocaleString('uk-UA')}</strong>
                    </div>
                )}
                {row.avgHours != null && (
                    <div className="Anime-chart-tooltip-meta">
                        Сер. тривалість: <strong>~{row.avgHours} год</strong>
                    </div>
                )}
                {row.cultRatio != null && row.favoritesCount != null && (
                    <div className="Anime-chart-tooltip-meta">
                        У фаворитах: <strong>{Number(row.favoritesCount).toLocaleString('uk-UA')}</strong> з {Number(row.userCount || 0).toLocaleString('uk-UA')}
                    </div>
                )}
                {row.avgPopularity != null && !plottedKeys.has('avgPopularity') && (
                    <div className="Anime-chart-tooltip-meta">
                        Сер. аудиторія: <strong>{Number(row.avgPopularity).toLocaleString('uk-UA')}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

function ScatterPointTooltip({ active, payload }) {
    if (!active || !Array.isArray(payload) || payload.length === 0) {
        return null;
    }

    const row = payload[0]?.payload || {};

    return (
        <div className="Anime-chart-tooltip">
            <div className="Anime-chart-tooltip-label">{row.fullTitle || row.label}</div>
            {row.insight && (
                <div className="Anime-chart-tooltip-insight">{row.insight}</div>
            )}
            <div className="Anime-chart-tooltip-rows">
                <div className="Anime-chart-tooltip-row">
                    <span className="Anime-chart-tooltip-dot" style={{ backgroundColor: 'var(--accent-color)' }} />
                    <span className="Anime-chart-tooltip-name">Рейтинг Kitsu:</span>
                    <span className="Anime-chart-tooltip-val">{row.score} / 10</span>
                </div>
                <div className="Anime-chart-tooltip-row">
                    <span className="Anime-chart-tooltip-dot" style={{ backgroundColor: 'var(--chart-secondary)' }} />
                    <span className="Anime-chart-tooltip-name">Аудиторія:</span>
                    <span className="Anime-chart-tooltip-val">{Number(row.userCount || 0).toLocaleString('uk-UA')}</span>
                </div>
                {row.favoritesCount != null && (
                    <div className="Anime-chart-tooltip-row">
                        <span className="Anime-chart-tooltip-dot" style={{ backgroundColor: 'var(--favorite-color)' }} />
                        <span className="Anime-chart-tooltip-name">У фаворитах:</span>
                        <span className="Anime-chart-tooltip-val">{Number(row.favoritesCount).toLocaleString('uk-UA')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function AnimeChart({
    data = [],
    scatterData = null,
    scatterConfig = null,
    chartType = 'bar',
    xKey = 'label',
    series = null,
    leftAxis = null,
    rightAxis = null,
    primaryKey = 'avgScore',
    secondaryKey = 'count',
    primaryLabel = 'Середній рейтинг',
    secondaryLabel = 'Кількість тайтлів',
    loading = false,
    emptyMessage = 'Недостатньо даних для побудови графіка за поточними фільтрами.'
}) {
    const rawId = useId();
    const uid = rawId.replace(/:/g, '');

    const resolvedSeries = Array.isArray(series) && series.length > 0
        ? series
        : [
            {
                dataKey: primaryKey,
                name: primaryLabel,
                yAxisId: 'left',
                color: 'var(--accent-color)',
                kind: 'bar',
                unit: ''
            },
            {
                dataKey: secondaryKey,
                name: secondaryLabel,
                yAxisId: 'right',
                color: 'var(--chart-secondary)',
                kind: 'bar',
                unit: ''
            }
        ];

    const resolvedLeftAxis = leftAxis || {
        domain: [0, 10],
        allowDecimals: true
    };
    const resolvedRightAxis = series === null
        ? { domain: [0, 'auto'], allowDecimals: false }
        : rightAxis;

    const canScatter = Boolean(scatterConfig && Array.isArray(scatterData) && scatterData.length > 0);
    const effectiveChartType = chartType === 'scatter' && !canScatter ? 'bar' : chartType;
    const hasData = effectiveChartType === 'scatter'
        ? canScatter
        : (Array.isArray(data) && data.length > 0);

    if (loading && !hasData) {
        return (
            <div className="Anime-chart-loading" aria-busy="true" aria-label="Завантаження графіка">
                <div className="Anime-chart-skeleton skeleton-shimmer" />
            </div>
        );
    }

    if (!loading && !hasData) {
        return (
            <div className="Anime-chart-empty">
                <span className="Anime-chart-empty-icon" aria-hidden="true">📊</span>
                <p className="Anime-chart-empty-text">{emptyMessage}</p>
            </div>
        );
    }

    const commonMargins = { top: 12, right: 16, left: -6, bottom: 4 };
    const hasRightAxis = Boolean(resolvedRightAxis && resolvedSeries.some((s) => s.yAxisId === 'right'));

    const renderAxesAndGrid = () => (
        <>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
            <XAxis
                dataKey={xKey}
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickLine={false}
            />
            <YAxis
                yAxisId="left"
                domain={resolvedLeftAxis.domain || [0, 'auto']}
                allowDecimals={resolvedLeftAxis.allowDecimals ?? true}
                tickFormatter={resolvedLeftAxis.tickFormatter}
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickLine={false}
            />
            {hasRightAxis && (
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={resolvedRightAxis.domain || [0, 'auto']}
                    allowDecimals={resolvedRightAxis.allowDecimals ?? true}
                    tickFormatter={resolvedRightAxis.tickFormatter}
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                />
            )}
            <Tooltip content={<ChartTooltip seriesMeta={resolvedSeries} />} />
            <Legend wrapperStyle={{ fontSize: '0.84rem', paddingTop: '0.5rem' }} />
        </>
    );

    const renderChart = () => {
        if (effectiveChartType === 'scatter' && canScatter) {
            return (
                <ScatterChart margin={{ top: 14, right: 22, left: -4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                    <XAxis
                        type="number"
                        dataKey={scatterConfig.xKey}
                        name={scatterConfig.xName}
                        domain={scatterConfig.xDomain || ['auto', 'auto']}
                        tickFormatter={scatterConfig.xTickFormatter}
                        stroke="var(--text-muted)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        type="number"
                        dataKey={scatterConfig.yKey}
                        name={scatterConfig.yName}
                        domain={scatterConfig.yDomain || [0, 10]}
                        stroke="var(--text-muted)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                    />
                    {scatterConfig.zKey && (
                        <ZAxis
                            type="number"
                            dataKey={scatterConfig.zKey}
                            range={[55, 240]}
                            name={scatterConfig.zName}
                        />
                    )}
                    {scatterConfig.refX > 0 && (
                        <ReferenceLine
                            x={scatterConfig.refX}
                            stroke="var(--text-muted)"
                            strokeDasharray="4 4"
                        />
                    )}
                    {scatterConfig.refY > 0 && (
                        <ReferenceLine
                            y={scatterConfig.refY}
                            stroke="var(--text-muted)"
                            strokeDasharray="4 4"
                        />
                    )}
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={<ScatterPointTooltip />}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.84rem', paddingTop: '0.5rem' }} />
                    <Scatter
                        name={`${scatterConfig.yName} vs ${scatterConfig.xName}`}
                        data={scatterData}
                        fill="var(--accent-color)"
                        fillOpacity={0.82}
                    />
                </ScatterChart>
            );
        }

        if (effectiveChartType === 'line') {
            return (
                <LineChart data={data} margin={commonMargins}>
                    {renderAxesAndGrid()}
                    {resolvedSeries.map((s) => (
                        <Line
                            key={s.dataKey}
                            yAxisId={s.yAxisId || 'left'}
                            type="monotone"
                            dataKey={s.dataKey}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            );
        }

        if (effectiveChartType === 'area') {
            return (
                <AreaChart data={data} margin={commonMargins}>
                    <defs>
                        {resolvedSeries.map((s) => (
                            <linearGradient
                                key={s.dataKey}
                                id={`anime-chart-${s.dataKey}-${uid}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={s.color} stopOpacity={0.42} />
                                <stop offset="95%" stopColor={s.color} stopOpacity={0.03} />
                            </linearGradient>
                        ))}
                    </defs>
                    {renderAxesAndGrid()}
                    {resolvedSeries.map((s) => (
                        <Area
                            key={s.dataKey}
                            yAxisId={s.yAxisId || 'left'}
                            type="monotone"
                            dataKey={s.dataKey}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={2.2}
                            fillOpacity={1}
                            fill={`url(#anime-chart-${s.dataKey}-${uid})`}
                        />
                    ))}
                </AreaChart>
            );
        }

        const hasMixedKinds = resolvedSeries.some((s) => s.kind === 'line');
        const WrapperChart = hasMixedKinds ? ComposedChart : BarChart;

        return (
            <WrapperChart data={data} margin={commonMargins}>
                {renderAxesAndGrid()}
                {resolvedSeries.map((s) => (
                    s.kind === 'line' ? (
                        <Line
                            key={s.dataKey}
                            yAxisId={s.yAxisId || 'left'}
                            type="monotone"
                            dataKey={s.dataKey}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={2.6}
                            dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                        />
                    ) : (
                        <Bar
                            key={s.dataKey}
                            yAxisId={s.yAxisId || 'left'}
                            dataKey={s.dataKey}
                            name={s.name}
                            fill={s.color}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={42}
                        />
                    )
                ))}
            </WrapperChart>
        );
    };

    return (
        <div className={`Anime-chart-canvas ${loading ? 'is-updating' : ''}`}>
            <ResponsiveContainer width="100%" height={320} minWidth={0}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
}

export default AnimeChart;
