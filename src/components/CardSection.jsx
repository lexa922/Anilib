import { useMemo } from 'react';
import KpiCard from "./KpiCard.jsx";
import { calculateKpis } from "../utils/kpi.js";
import "./CardSection.css";

function CardSection({ animeList, kpiData, totalCount }) {
    const metrics = useMemo(() => {
        if (kpiData) return kpiData;
        if (animeList) return calculateKpis(animeList);
        return calculateKpis([]);
    }, [kpiData, animeList]);

    const countLabel = totalCount || (animeList ? animeList.length : 0);

    return (
        <section className="Card-section-container">
            <div className="Card-section-header">
                <div className="Card-section-title-wrap">
                    <h2 className="Card-section-heading">Метрики дашборду</h2>
                    <span className="Card-section-sub">
                        Глобальні показники аналітики {countLabel > 0 ? `(${countLabel} завантажено)` : ''}
                    </span>
                </div>
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
