import './Toggle.css';
import { useTheme } from '../context/index.js';

function Toggle({ isChecked, onToggle }) {
    const themeContext = useTheme();

    const checked = isChecked !== undefined ? isChecked : themeContext.isDark;
    const handleToggle = onToggle || themeContext.toggleTheme;

    return (
        <label className="toggle-wrapper" title={checked ? "Перемкнути на світлу тему" : "Перемкнути на темну тему"}>
            <span className="toggle-label-icon">{checked ? '🌙' : '☀️'}</span>
            <input
                type="checkbox"
                className="toggle-checkbox"
                checked={checked}
                onChange={(e) => handleToggle(e.target.checked)}
            />
            <span className={`toggle-slider ${checked ? 'Dark-toggle' : 'Light-toggle'}`}>
                <span className="toggle-thumb" />
            </span>
            <span className="toggle-text">
                {checked ? 'Темна' : 'Світла'}
            </span>
        </label>
    );
}

export default Toggle;
