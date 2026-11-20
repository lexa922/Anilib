import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { animeApiClient } from '../services/index.js';
import { useFetch, useBackNavigation } from '../hooks/index.js';
import { ANIME_STATUS_LABELS } from '../constants/filterConstants.js';
import { useDashboardStore, selectUserRating } from '../store/index.js';
import AnimeDetailSkeleton from '../components/anime/AnimeDetailSkeleton.jsx';
import AnimeLibraryPanel from '../components/anime/AnimeLibraryPanel.jsx';
import FavoriteButton from '../components/common/FavoriteButton.jsx';
import './AnimeDetailPage.css';

const SUBTYPE_LABELS = {
    tv: 'TV Серіал',
    movie: 'Повнометражний фільм',
    ova: 'OVA',
    ona: 'ONA',
    special: 'Спешл',
    music: 'Музичне відео'
};

export function AnimeDetailPage() {
    const { id } = useParams();
    const handleBack = useBackNavigation('/');
    const userRating = useDashboardStore(selectUserRating(id));

    const fetchAnime = useCallback((signal) => {
        return animeApiClient.getAnimeById(id, signal);
    }, [id]);

    const { data: anime, loading, error, refetch } = useFetch(fetchAnime, [id]);

    if (loading) {
        return <AnimeDetailSkeleton onBack={handleBack} />;
    }

    if (error || !anime) {
        const is404 = error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('не знайдено');

        return (
            <div className="Anime-detail-container">
                <div className="Anime-detail-nav">
                    <button type="button" className="Anime-detail-back-btn" onClick={handleBack}>
                        ← Назад
                    </button>
                    <div className="Anime-detail-breadcrumbs">
                        <Link to="/">Головна</Link>
                        <span>/</span>
                        <span>Помилка</span>
                    </div>
                </div>

                <div className="Anime-detail-error-card">
                    <div className="Detail-error-icon">{is404 ? '🔍' : '⚠️'}</div>
                    <h2 className="Detail-error-title">
                        {is404 ? 'Тайтл не знайдено (404)' : 'Не вдалося завантажити тайтл'}
                    </h2>
                    <p className="Detail-error-desc">
                        {is404
                            ? `Аніме з ідентифікатором "${id}" не існує або було видалено з каталогу.`
                            : (error?.message || 'Виникла непередбачена помилка під час запиту до API.')}
                    </p>
                    <div className="Detail-error-actions">
                        <Link to="/" className="Detail-btn-primary">
                            Повернутися до каталогу
                        </Link>
                        <button type="button" className="Detail-btn-secondary" onClick={refetch}>
                            Спробувати знову
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const normalizedStatus = (anime.status || '').toLowerCase().trim();
    const isUpcoming = normalizedStatus === 'upcoming' || normalizedStatus === 'unreleased' || normalizedStatus === 'анонс';
    const statusText = ANIME_STATUS_LABELS[normalizedStatus] || anime.status || 'Невідомо';
    const subtypeText = SUBTYPE_LABELS[(anime.subtype || '').toLowerCase()] || anime.subtype || 'Серіал';

    return (
        <div className="Anime-detail-container">
            <div className="Anime-detail-nav">
                <button type="button" className="Anime-detail-back-btn" onClick={handleBack}>
                    ← Назад
                </button>
                <div className="Anime-detail-breadcrumbs">
                    <Link to="/">Головна</Link>
                    <span>/</span>
                    <span className="Anime-detail-breadcrumb-current">{anime.title}</span>
                </div>
            </div>

            {anime.coverImage && (
                <div className="Anime-detail-cover">
                    <img src={anime.coverImage} alt={`${anime.title} cover`} />
                    <div className="Anime-detail-cover-gradient" />
                </div>
            )}

            <div className={`Anime-detail-main ${anime.coverImage ? 'has-cover' : ''}`}>
                <div className="Anime-detail-left">
                    {anime.poster && (
                        <img
                            src={anime.poster}
                            alt={anime.title}
                            className="Anime-detail-poster"
                        />
                    )}

                    <div className="Anime-detail-meta-box">
                        <div className="Detail-meta-row">
                            <span className="Detail-meta-label">Статус:</span>
                            <span className={`Anime-card-badge status-${(anime.status || '').toLowerCase()}`}>
                                {statusText}
                            </span>
                        </div>

                        <div className="Detail-meta-row">
                            <span className="Detail-meta-label">Формат:</span>
                            <span className="Detail-meta-val">{subtypeText}</span>
                        </div>

                        <div className="Detail-meta-row">
                            <span className="Detail-meta-label">Епізоди:</span>
                            <span className="Detail-meta-val">
                                {anime.episodes ? `${anime.episodes} серій` : 'Онґоїнґ / Невідомо'}
                            </span>
                        </div>

                        {Boolean(anime.episodeLength && anime.episodeLength > 0) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Тривалість серії:</span>
                                <span className="Detail-meta-val">{anime.episodeLength} хв.</span>
                            </div>
                        )}

                        {Boolean(anime.totalLength && anime.totalLength > 0) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Загальний хронометраж:</span>
                                <span className="Detail-meta-val">{anime.totalLength} хв.</span>
                            </div>
                        )}

                        {Boolean(anime.ageRating) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Віковий рейтинг:</span>
                                <span className="Detail-meta-val">
                                    {anime.ageRating} {anime.ageRatingGuide ? `(${anime.ageRatingGuide})` : ''}
                                </span>
                            </div>
                        )}

                        <div className="Detail-meta-row">
                            <span className="Detail-meta-label">Прем'єра:</span>
                            <span className="Detail-meta-val">{anime.startDate || 'Невідомо'}</span>
                        </div>

                        {Boolean(anime.endDate) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Завершення:</span>
                                <span className="Detail-meta-val">{anime.endDate}</span>
                            </div>
                        )}

                        {Boolean(anime.popularityRank && anime.popularityRank > 0) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Популярність:</span>
                                <span className="Detail-meta-val rank">#{anime.popularityRank}</span>
                            </div>
                        )}

                        {Boolean(anime.ratingRank && anime.ratingRank > 0) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Рейтинг у списку:</span>
                                <span className="Detail-meta-val rank">#{anime.ratingRank}</span>
                            </div>
                        )}

                        {Boolean(anime.userCount && anime.userCount > 0) && (
                            <div className="Detail-meta-row">
                                <span className="Detail-meta-label">Учасників:</span>
                                <span className="Detail-meta-val">{anime.userCount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <AnimeLibraryPanel
                        animeId={id}
                        animeTitle={anime.title}
                        totalEpisodesRaw={anime.episodes}
                        isUpcoming={isUpcoming}
                        animeScore={anime.score}
                        animeGenres={anime.genres}
                        animePoster={anime.poster}
                        animeSubtype={anime.subtype}
                        animeYear={anime.year}
                    />
                </div>

                <div className="Anime-detail-content">
                    <div className="Anime-detail-header-block">
                        <div className="Anime-detail-scores-row">
                            <div className="Anime-detail-score-pill">
                                ★ {anime.score ? `${anime.score} / 10` : 'Без оцінки'}
                            </div>
                            {!isUpcoming && userRating > 0 && (
                                <div className="Anime-detail-user-score-pill">
                                    ★ Ваша оцінка: {userRating} / 10
                                </div>
                            )}
                            <FavoriteButton anime={anime} variant="button" className="Anime-detail-fav-btn" />
                        </div>
                        <h1 className="Anime-detail-title">{anime.title}</h1>

                        {(anime.englishTitle || anime.japaneseTitle) && (
                            <div className="Anime-detail-alt-titles">
                                {anime.englishTitle && (
                                    <span className="Detail-alt-en">EN: {anime.englishTitle}</span>
                                )}
                                {anime.japaneseTitle && (
                                    <span className="Detail-alt-ja">JA: {anime.japaneseTitle}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="Anime-detail-genres-block">
                        <h4 className="Anime-detail-section-subtitle">Жанри та категорії:</h4>
                        <div className="Anime-detail-genres-list">
                            {anime.genres && anime.genres.length > 0 ? (
                                anime.genres.map((g, idx) => {
                                    const name = typeof g === 'string' ? g : g.name;
                                    const key = typeof g === 'object' ? (g.id || name) : `${name}-${idx}`;
                                    return (
                                        <span key={key} className="Detail-genre-tag">
                                            {name}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="Detail-genre-empty">Категорії не вказано</span>
                            )}
                        </div>
                    </div>

                    <div className="Anime-detail-synopsis-block">
                        <h3 className="Anime-detail-section-title">Опис та сюжет</h3>
                        <p className="Anime-detail-synopsis-text">
                            {anime.synopsis || 'Опис для цього аніме наразі відсутній.'}
                        </p>
                    </div>

                    <div className="Anime-detail-trailer-block">
                        <h3 className="Anime-detail-section-title">Офіційний трейлер</h3>
                        {anime.youtubeVideoId ? (
                            <div className="Anime-detail-trailer-wrap">
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${anime.youtubeVideoId}`}
                                    title={`Trailer: ${anime.title}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="Anime-trailer-placeholder">
                                <span className="Anime-trailer-placeholder-icon">🍿📺✨</span>
                                <h4 className="Anime-trailer-placeholder-title">Трейлер ісекайнувся в інший світ!</h4>
                                <p className="Anime-trailer-placeholder-text">
                                    Схоже, вантажівка-сан перехопила відеострічку по дорозі до нашої бази даних.
                                    Або режисери вирішили зберегти абсолютну інтригу до самого перегляду.
                                </p>
                                <span className="Anime-trailer-placeholder-badge">(Офіційний трейлер не надано Kitsu API)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnimeDetailPage;
