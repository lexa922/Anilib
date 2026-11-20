import { useMemo } from 'react';
import KpiCard from './KpiCard.jsx';
import { calculateKpis } from '../utils/kpi.js';
import './CardSection.css';

function CardSection({
    animeList,
    kpiData,
    processedCount = 0,
    totalCount = 0,
    isStreaming = false,
    isComplete = false
}) {
    const metrics = useMemo(() => {
        if (kpiData) return kpiData;
        if (animeList) return calculateKpis(animeList);
        return calculateKpis([]);
    }, [kpiData, animeList]);

    const progressPercent = totalCount > 0
        ? Math.min(100, Math.round((processedCount / totalCount) * 100))
        : 0;

    let statusText = 'Глобальні показники бази Kitsu';
    if (isStreaming) {
        statusText = totalCount > 0
            ? `Фоновий аналіз бази Kitsu: ${processedCount.toLocaleString('uk-UA')} / ${totalCount.toLocaleString('uk-UA')} (${progressPercent}%)`
            : 'Фоновий аналіз бази Kitsu...';
    } else if (totalCount > 0) {
        statusText = isComplete
            ? `Повна база Kitsu (${totalCount.toLocaleString('uk-UA')} тайтлів)`
            : `Проаналізовано ${processedCount.toLocaleString('uk-UA')} з ${totalCount.toLocaleString('uk-UA')} тайтлів Kitsu`;
    }

    return (
        <section className="Card-section-container">
            <div className="Card-section-header">
                <div className="Card-section-title-wrap">
                    <h2 className="Card-section-heading">Метрики дашборду</h2>
                    <span className="Card-section-sub">{statusText}</span>
                </div>
                {isStreaming && totalCount > 0 && (
                    <div className="Card-section-progress" aria-label="Прогрес фонового аналізу">
                        <div
                            className="Card-section-progress-bar"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}
            </div>

            <div className="Card-section">
                {metrics.map((kpi) => (
                    <KpiCard
                        key={kpi.id}
                        title={kpi.title}
                        value={kpi.value}
                        change={kpi.change}
                        unit={kpi.unit}
                    />
                ))}
            </div>
        </section>
    );
}

export default CardSection;
