import '../componentsStyles/ThemeToggle.css';

function Toggle({ isChecked, onToggle }) {
    return (
        <label className="toggle-wrapper">
            <input
                type="checkbox"
                className="toggle-checkbox"
                checked={isChecked}
                onChange={(e) => onToggle(e.target.checked)}
            />
            <span className={`toggle-slider ${isChecked ? 'Light-toggle' : 'Dark-toggle'}`}>
                <span className={`toggle-thumb ${isChecked ? 'Dark-toggle' : 'Light-toggle'}`} />
            </span>
        </label>
    );
}

export default Toggle;