import "./ErrorDisplay.css";

function ErrorDisplay({ error, onRetry }) {
    return (
        <div className="error-display">
            <h3 className="error-display-title">Не вдалося завантажити дані</h3>
            <p className="error-display-message">
                {error?.message || 'Сталася непередбачена помилка при зверненні до API.'}
            </p>
            {onRetry && (
                <button className="error-display-retry-btn" onClick={onRetry}>
                    Спробувати знову
                </button>
            )}
        </div>
    );
}

export default ErrorDisplay;
