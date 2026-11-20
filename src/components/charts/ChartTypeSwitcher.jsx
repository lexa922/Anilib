import './ChartTypeSwitcher.css';

const CHART_TYPE_OPTIONS = [
    {
        value: 'bar',
        label: 'Стовпчикова',
        icon: (
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <rect x="2" y="10" width="4" height="8" rx="1" />
                <rect x="8" y="4" width="4" height="14" rx="1" />
                <rect x="14" y="7" width="4" height="11" rx="1" />
            </svg>
        )
    },
    {
        value: 'line',
        label: 'Лінійна',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2 14 7 9 12 12 18 4" />
                <circle cx="2" cy="14" r="1.5" fill="currentColor" />
                <circle cx="7" cy="9" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="18" cy="4" r="1.5" fill="currentColor" />
            </svg>
        )
    },
    {
        value: 'area',
        label: 'Область',
        icon: (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 16 L2 12 L7 8 L12 11 L18 5 L18 16 Z" fill="currentColor" fillOpacity="0.28" />
                <polyline points="2 12 7 8 12 11 18 5" />
            </svg>
        )
    },
    {
        value: 'scatter',
        label: 'Точковий',
        scatterOnly: true,
        icon: (
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <circle cx="4.5" cy="14" r="2" />
                <circle cx="8" cy="8" r="2" />
                <circle cx="12.5" cy="11.5" r="2" />
                <circle cx="15.5" cy="5" r="2.2" />
            </svg>
        )
    }
];

export function ChartTypeSwitcher({
    value = 'bar',
    onChange,
    allowScatter = false,
    disabled = false
}) {
    const visibleOptions = allowScatter
        ? CHART_TYPE_OPTIONS
        : CHART_TYPE_OPTIONS.filter((opt) => !opt.scatterOnly);

    const activeValue = !allowScatter && value === 'scatter' ? 'bar' : value;

    return (
        <div className="Chart-type-switcher" role="group" aria-label="Тип візуалізації">
            {visibleOptions.map((option) => {
                const isActive = activeValue === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        className={`Chart-type-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onChange?.(option.value)}
                        aria-pressed={isActive}
                        disabled={disabled}
                    >
                        <span className="Chart-type-btn-icon">{option.icon}</span>
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default ChartTypeSwitcher;
