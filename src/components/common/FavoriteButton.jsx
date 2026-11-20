import { useDashboardStore, selectIsFavorite } from '../../store/index.js';
import './FavoriteButton.css';

export function FavoriteButton({ anime, variant = 'icon', className = '' }) {
    const isFavorite = useDashboardStore(selectIsFavorite(anime?.id));
    const toggleFavorite = useDashboardStore((state) => state.toggleFavorite);

    if (!anime?.id) {
        return null;
    }

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(anime);
    };

    const label = isFavorite ? 'Прибрати з обраного' : 'Додати в обране';

    return (
        <button
            type="button"
            className={`Favorite-btn Favorite-btn--${variant} ${isFavorite ? 'Favorite-btn--active' : ''} ${className}`.trim()}
            onClick={handleClick}
            aria-pressed={isFavorite}
            aria-label={label}
            title={label}
        >
            <svg
                className="Favorite-btn-icon"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {variant === 'button' && (
                <span className="Favorite-btn-text">
                    {isFavorite ? 'В обраному' : 'Додати в обране'}
                </span>
            )}
        </button>
    );
}

export default FavoriteButton;
