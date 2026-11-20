import { useState, useMemo } from 'react';
import { buildChartDataset } from '../../utils/chartTransformers.js';
import {
    useDashboardStore,
    selectChartType,
    selectChartGroupBy,
    selectHasActiveFilters
} from '../../store/index.js';
import ChartTypeSwitcher from './ChartTypeSwitcher.jsx';
import AnimeChart from './AnimeChart.jsx';
import './AnalyticsChartSection.css';

const DIMENSION_TABS = [
    { value: 'hypeVsQuality', label: 'Хайп vs Якість' },
    { value: 'cultRatio', label: 'Культовість' },
    { value: 'marathon', label: 'Марафонність' },
    { value: 'seasons', label: 'Сезонність' },
    { value: 'scoreDist', label: 'Розподіл оцінок' },
    { value: 'ageAndSubtype', label: 'Вік і формати' }
];

const DIMENSION_HINTS = {
    hypeVsQuality: 'Популярність (аудиторія) проти рейтингу: виявляє недооцінені перлини та мейнстрімні хіти.',
    cultRatio: 'Коефіцієнт культовості (Favorites / Users × 100%): частка глядачів, яка додала тайтл в «Обране».',
    marathon: 'Залежність середнього балу та частки релізів від кількості серій (від фільмів до марафонів 60+).',
    seasons: 'Сезонність виходу (Зима, Весна, Літо, Осінь): кількість релізів і середній бал кожного сезону.',
    scoreDist: 'Крива якості вибірки: зсув піку оцінок при зміні жанрів чи інших фільтрів.',
    ageAndSubtype: 'Порівняння середньої аудиторії та рейтингу за віковим цензом (G/PG/R/R18) або форматом.'
};

export function AnalyticsChartSection({
    animeList = [],
    loading = false,
    processedCount = 0,
    totalCount = 0,
    isStreaming = false,
    isComplete = false,
    rateLimited = false,
    onRefreshCache = null
}) {
    const chartType = useDashboardStore(selectChartType);
    const chartGroupBy = useDashboardStore(selectChartGroupBy);
    const hasActiveFilters = useDashboardStore(selectHasActiveFilters);

    const setChartType = useDashboardStore((state) => state.setChartType);
    const setChartGroupBy = useDashboardStore((state) => state.setChartGroupBy);

    const [breakdownBy, setBreakdownBy] = useState('age');

    const dataset = useMemo(
        () => buildChartDataset(animeList, chartGroupBy, { breakdownBy }),
        [animeList, chartGroupBy, breakdownBy]
    );

    const progressPercent = totalCount > 0
        ? Math.min(100, Math.round((processedCount / totalCount) * 100))
        : 0;

    let subtitleText = `Поточна вибірка: ${animeList.length.toLocaleString('uk-UA')} тайтлів`;
    if (hasActiveFilters) {
        subtitleText = `Відфільтровано з кешу Kitsu: ${animeList.length.toLocaleString('uk-UA')} тайтлів`;
        if (isStreaming && totalCount > 0) {
            subtitleText += ` (кешування БД: ${progressPercent}%)`;
        }
    } else if (isStreaming) {
        subtitleText = totalCount > 0
            ? `Кеш всієї БД Kitsu: ${processedCount.toLocaleString('uk-UA')} / ${totalCount.toLocaleString('uk-UA')} (${progressPercent}%)`
            : 'Кешування бази Kitsu...';
    } else if (totalCount > 0) {
        subtitleText = isComplete
            ? `Повний кеш БД Kitsu (${totalCount.toLocaleString('uk-UA')} тайтлів)`
            : `Кеш БД Kitsu: ${processedCount.toLocaleString('uk-UA')} з ${totalCount.toLocaleString('uk-UA')} тайтлів`;
    }

    const hintText = DIMENSION_HINTS[chartGroupBy] || '';

    return (
        <section className="Analytics-chart-section" aria-label="Аналітика бази Kitsu">
            <div className="Analytics-chart-header">
                <div className="Analytics-chart-title-wrap">
                    <h2 className="Analytics-chart-heading">Аналітика бази Kitsu</h2>
                    <div className="Analytics-chart-sub-row">
                        <span className="Analytics-chart-sub">{subtitleText}</span>
                        {isStreaming && totalCount > 0 && (
                            <div className="Analytics-cache-progress" aria-label="Прогрес кешування">
                                <div
                                    className="Analytics-cache-progress-bar"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        )}
                        {!isStreaming && onRefreshCache && (
                            <button
                                type="button"
                                className="Analytics-cache-refresh-btn"
                                onClick={onRefreshCache}
                                title={rateLimited ? 'Продовжити дозавантаження кешу' : 'Оновити повний кеш БД Kitsu'}
                            >
                                {rateLimited ? '↻ Продовжити' : '↻ Оновити кеш'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="Analytics-chart-controls">
                    <ChartTypeSwitcher
                        value={chartType}
                        onChange={setChartType}
                        allowScatter={Boolean(dataset.scatterConfig)}
                    />
                </div>
            </div>

            <div className="Analytics-toolbar-row">
                <div className="Analytics-dimension-tabs" role="group" aria-label="Аналітичні зрізи">
                    {DIMENSION_TABS.map((tab) => {
                        const isActive = chartGroupBy === tab.value;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                className={`Analytics-dimension-tab ${isActive ? 'active' : ''}`}
                                onClick={() => setChartGroupBy(tab.value)}
                                aria-pressed={isActive}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {chartGroupBy === 'ageAndSubtype' && (
                    <div className="Analytics-subtoggle" role="group" aria-label="Розбиття за цензом або форматом">
                        <button
                            type="button"
                            className={`Analytics-subtoggle-btn ${breakdownBy === 'age' ? 'active' : ''}`}
                            onClick={() => setBreakdownBy('age')}
                        >
                            Віковий ценз
                        </button>
                        <button
                            type="button"
                            className={`Analytics-subtoggle-btn ${breakdownBy === 'subtype' ? 'active' : ''}`}
                            onClick={() => setBreakdownBy('subtype')}
                        >
                            Формати
                        </button>
                    </div>
                )}
            </div>

            {hintText && (
                <p className="Analytics-chart-hint">{hintText}</p>
            )}

            <AnimeChart
                data={dataset.data}
                scatterData={dataset.scatterData}
                scatterConfig={dataset.scatterConfig}
                chartType={chartType}
                xKey={dataset.xKey}
                series={dataset.series}
                leftAxis={dataset.leftAxis}
                rightAxis={dataset.rightAxis}
                emptyMessage={dataset.emptyMessage}
                loading={loading}
            />
        </section>
    );
}

export default AnalyticsChartSection;
