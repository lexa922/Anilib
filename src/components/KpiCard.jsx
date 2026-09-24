import "../componentsStyles/KpiCard.css"

function KpiCard({title, value, change}){

    const isPositive = change >= 0;
    const formattedChange = isPositive ? `+${change}` : change;

    return (
        <div className="Kpi-card-body">
            <div>
                <span className="Kpi-title">{title}</span>:
                <span className="Kpi-value">{value}</span>
            </div>
            <div className={`Kpi-change-value ${isPositive ? 'positive-change' : 'negative-change'}`}>
                {formattedChange}%
            </div>
        </div>
    );
}

export default KpiCard;