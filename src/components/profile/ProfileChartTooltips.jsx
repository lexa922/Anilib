import { LIBRARY_STATUS_SERIES } from '../../utils/profileAnalytics.js';
import './ProfileChartTooltips.css';

export function ProfileStatusTooltip({ active, payload, label }) {
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

export function ProfileGenreStatusTooltip({ active, payload, label, isRelative }) {
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

export function ProfileCritiqueTooltip({ active, payload, label }) {
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
