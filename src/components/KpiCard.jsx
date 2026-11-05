import "./KpiCard.css";

function KpiCard({ title, value, change, unit = '' }) {
    const numChange = parseFloat(change);
    const isPositive = !isNaN(numChange) ? numChange >= 0 : true;
    const formattedChange = !isNaN(numChange) && isPositive ? `+${change}` : change;

    return (
        <div className="Kpi-card-body">
            <div>
                <span className="Kpi-title">{title}</span>
                <span className="Kpi-value">{value}</span>
            </div>
            {change !== undefined && change !== null && (
                <div className={`Kpi-change-value ${isPositive ? 'positive-change' : 'negative-change'}`}>
                    {formattedChange}{unit}
                </div>
            )}
        </div>
    );
}

export default KpiCard;
