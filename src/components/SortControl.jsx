import { SORT_OPTIONS } from '../constants/sortOptions.js';
import './SortControl.css';

function SortControl({ sort, onSortChange, disabled = false }) {
    return (
        <div className="sort-control-container">
            <label htmlFor="anime-sort-select" className="sort-control-label">
                <span className="sort-icon" aria-hidden="true">⇅</span>
                <span>Сортування:</span>
            </label>
            <select
                id="anime-sort-select"
                className="sort-select"
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                disabled={disabled}
                aria-label="Оберіть порядок сортування аніме"
            >
                {SORT_OPTIONS.map((opt) => (
                    <option value={opt.value} key={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default SortControl;
