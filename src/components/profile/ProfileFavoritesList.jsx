import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ANIME_STATUS_LABELS } from '../../constants/filterConstants.js';
import { useDashboardStore, selectFavorites } from '../../store/index.js';
import FavoriteButton from '../common/FavoriteButton.jsx';
import './ProfileFavoritesList.css';

const FAVORITE_STATUS_TABS = [
    { value: 'all', label: 'Всі' },
    { value: 'current', label: 'Онґоїнґ' },
    { value: 'finished', label: 'Завершено' },
    { value: 'upcoming', label: 'Анонс' }
];

export function ProfileFavoritesList() {
    const favoritesMap = useDashboardStore(selectFavorites);
    const clearFavorites = useDashboardStore((state) => state.clearFavorites);

    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmClear, setConfirmClear] = useState(false);

    const favoriteItems = useMemo(
        () => Object.values(favoritesMap || {}),
        [favoritesMap]
    );

    const filteredItems = useMemo(() => {
        if (statusFilter === 'all') return favoriteItems;
        return favoriteItems.filter((item) => {
            const norm = String(item.status || '').toLowerCase().trim();
            if (statusFilter === 'upcoming') {
                return norm === 'upcoming' || norm === 'unreleased';
            }
            return norm === statusFilter;
        });
    }, [favoriteItems, statusFilter]);

    const handleClearAll = () => {
        if (!confirmClear) {
            setConfirmClear(true);
            return;
        }
        clearFavorites();
        setConfirmClear(false);
    };

    return (
        <div className="Profile-favorites-section">
            <div className="Profile-favorites-header">
                <h3 className="Profile-library-title">
                    Обрані тайтли ({filteredItems.length})
                </h3>

                <div className="Profile-favorites-controls">
                    <div className="Profile-library-filters">
                        {FAVORITE_STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                className={`Profile-filter-tab ${statusFilter === tab.value ? 'active' : ''}`}
                                onClick={() => setStatusFilter(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {favoriteItems.length > 0 && (
                        confirmClear ? (
                            <div className="Fav-clear-confirm-row">
                                <button
                                    type="button"
                                    className="Fav-clear-btn confirm"
                                    onClick={handleClearAll}
                                >
                                    Підтвердити очищення
                                </button>
                                <button
                                    type="button"
                                    className="Item-view-btn"
                                    onClick={() => setConfirmClear(false)}
                                >
                                    Скасувати
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="Fav-clear-btn"
                                onClick={handleClearAll}
                            >
                                Очистити обране
                            </button>
                        )
                    )}
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="Profile-library-empty">
                    <span className="Empty-icon">♥</span>
                    <h4>
                        {favoriteItems.length === 0
                            ? 'Список обраного порожній'
                            : 'У цій категорії немає обраних тайтлів'}
                    </h4>
                    <p>
                        Натискайте на іконку сердечка на картках у каталозі або на сторінці деталей, щоб додати улюблені аніме сюди.
                    </p>
                    <Link to="/" className="Profile-go-catalog-btn">
                        Перейти до каталогу аніме
                    </Link>
                </div>
            ) : (
                <div className="Profile-favorites-list">
                    {filteredItems.map((anime) => {
                        const normStatus = String(anime.status || '').toLowerCase();
                        const statusText = ANIME_STATUS_LABELS[normStatus] || anime.status;
                        const genres = Array.isArray(anime.genres)
                            ? anime.genres
                                .map((g) => (typeof g === 'string' ? g : g?.name))
                                .filter(Boolean)
                                .slice(0, 4)
                            : [];

                        return (
                            <div key={anime.id} className="Profile-favorite-item">
                                <div className="Fav-item-left">
                                    {anime.poster ? (
                                        <img
                                            src={anime.poster}
                                            alt={anime.title}
                                            className="Fav-item-poster"
                                        />
                                    ) : (
                                        <div className="Fav-item-poster placeholder">🎬</div>
                                    )}

                                    <div className="Item-main-info">
                                        <Link to={`/anime/${anime.id}`} className="Item-title-link">
                                            {anime.title}
                                        </Link>
                                        <div className="Item-meta-row">
                                            {Boolean(anime.score) && (
                                                <span className="Fav-item-score">★ {anime.score}</span>
                                            )}
                                            {Boolean(anime.year) && (
                                                <span className="Fav-item-year">{anime.year}</span>
                                            )}
                                            {Boolean(statusText) && (
                                                <span className={`Item-status-badge status-${normStatus}`}>
                                                    {statusText}
                                                </span>
                                            )}
                                        </div>
                                        {genres.length > 0 && (
                                            <div className="Fav-item-genres">
                                                {genres.map((name) => (
                                                    <span key={name} className="Fav-item-genre-tag">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="Item-actions">
                                    <Link to={`/anime/${anime.id}`} className="Item-view-btn">
                                        Деталі →
                                    </Link>
                                    <FavoriteButton anime={anime} variant="icon" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ProfileFavoritesList;
