import { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { animeApiClient } from '../services/index.js';
import { userLibraryService } from '../api/userLibraryService.js';
import useFetch from '../hooks/useFetch.js';
import RatingCounter from '../components/RatingCounter.jsx';
import { useRatings } from '../context/index.js';
import './AnimeDetailPage.css';

export function AnimeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getRating, setRating } = useRatings();

    const [libraryStatus, setLibraryStatus] = useState('plan_to_watch');
    const [episodesWatched, setEpisodesWatched] = useState(0);
    const [episodesInput, setEpisodesInput] = useState('0');
    const [notes, setNotes] = useState('');
    const [libraryRating, setLibraryRating] = useState(0);
    const [inLibrary, setInLibrary] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [librarySaving, setLibrarySaving] = useState(false);

    const fetchAnime = useCallback((signal) => {
        return animeApiClient.getAnimeById(id, signal);
    }, [id]);

    const { data: anime, loading, error, refetch } = useFetch(fetchAnime, [id]);

    const totalEpisodes = useMemo(() => {
        if (!anime?.episodes) return null;
        const parsed = parseInt(anime.episodes, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [anime?.episodes]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        userLibraryService.getLibraryEntry(id, controller.signal)
            .then((entry) => {
                if (!isMounted) return;
                if (entry) {
                    setInLibrary(true);
                    setLibraryStatus(entry.status || 'plan_to_watch');
                    const ep = Math.max(0, parseInt(entry.episodes_watched, 10) || 0);
                    setEpisodesWatched(ep);
                    setEpisodesInput(String(ep));
                    setNotes(entry.notes || '');
                    const score = entry.user_score !== undefined && entry.user_score !== null ? Number(entry.user_score) : 0;
                    setLibraryRating(score);
                    setRating(id, score);
                } else {
                    setInLibrary(false);
                    const currentRating = getRating(id);
                    setLibraryRating(currentRating);
                }
            })
            .catch(() => {
                // Ignore gracefully if backend offline
            });

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [id, setRating, getRating]);

    const showFeedback = (msg, isErr = false) => {
        setFeedback({ message: msg, isError: isErr });
        setTimeout(() => setFeedback(null), 3500);
    };

    const handleRatingChange = (newVal) => {
        setLibraryRating(newVal);
        setRating(id, newVal);
    };

    const handleStepDown = () => {
        const next = Math.max(0, episodesWatched - 1);
        setEpisodesWatched(next);
        setEpisodesInput(String(next));
    };

    const handleStepUp = () => {
        const max = totalEpisodes ?? Infinity;
        const next = Math.min(max, episodesWatched + 1);
        setEpisodesWatched(next);
        setEpisodesInput(String(next));
    };

    const handleMarkAllEpisodes = () => {
        if (!totalEpisodes) return;
        setEpisodesWatched(totalEpisodes);
        setEpisodesInput(String(totalEpisodes));
    };

    const handleEpisodesKeyDown = (e) => {
        // Prevent typing characters that could break integer input
        if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleEpisodesChange = (e) => {
        const raw = e.target.value;
        if (raw === '') {
            setEpisodesInput('');
            setEpisodesWatched(0);
            return;
        }

        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            setEpisodesInput('');
            setEpisodesWatched(0);
            return;
        }

        let parsed = parseInt(digits, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
            parsed = 0;
        }
        if (totalEpisodes !== null && parsed > totalEpisodes) {
            parsed = totalEpisodes;
        }

        setEpisodesInput(String(parsed));
        setEpisodesWatched(parsed);
    };

    const handleEpisodesBlur = () => {
        let parsed = parseInt(episodesInput, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
            parsed = 0;
        }
        if (totalEpisodes !== null && parsed > totalEpisodes) {
            parsed = totalEpisodes;
        }
        setEpisodesWatched(parsed);
        setEpisodesInput(String(parsed));
    };

    const handleSaveLibraryDetails = async () => {
        if (!anime) return;
        setLibrarySaving(true);

        const safeEpisodes = Math.max(
            0,
            totalEpisodes !== null ? Math.min(totalEpisodes, episodesWatched) : episodesWatched
        );

        try {
            await userLibraryService.saveLibraryEntry(id, {
                title: anime.title,
                user_score: libraryRating,
                status: libraryStatus,
                episodes_watched: safeEpisodes,
                notes
            });
            setRating(id, libraryRating);
            setInLibrary(true);
            showFeedback('✓ Дані бібліотеки успішно збережено');
        } catch (err) {
            showFeedback(err.message || 'Помилка збереження даних', true);
        } finally {
            setLibrarySaving(false);
        }
    };

    const handleDeleteFromLibrary = async () => {
        setLibrarySaving(true);
        try {
            await userLibraryService.deleteLibraryEntry(id);
            setInLibrary(false);
            setLibraryStatus('plan_to_watch');
            setEpisodesWatched(0);
            setEpisodesInput('0');
            setNotes('');
            setLibraryRating(0);
            setRating(id, 0);
            showFeedback('Тайтл видалено з вашої бібліотеки');
        } catch (err) {
            showFeedback(err.message || 'Помилка видалення з бібліотеки', true);
        } finally {
            setLibrarySaving(false);
        }
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    if (loading) {
        return (
            <div className="Anime-detail-container">
                <div className="Anime-detail-nav">
                    <button type="button" className="Anime-detail-back-btn" onClick={handleBack}>
                        ← Назад
                    </button>
                    <div className="Anime-detail-breadcrumbs">
                        <Link to="/">Головна</Link>
                        <span>/</span>
                        <span>Завантаження...</span>
                    </div>
                </div>

                <div className="Anime-detail-loading-skeleton">
                    <div className="Detail-skeleton-banner" />
                    <div className="Detail-skeleton-content">
                        <div className="Detail-skeleton-poster" />
                        <div className="Detail-skeleton-info">
                            <div className="Detail-skeleton-line title" />
                            <div className="Detail-skeleton-line meta" />
                            <div className="Detail-skeleton-line text" />
                            <div className="Detail-skeleton-line text" />
                            <div className="Detail-skeleton-line text short" />
                        </div>
                    </div>
                </div>
            </div>
        );
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

    const statusMap = {
        current: 'Онґоїнґ',
        finished: 'Завершено',
        upcoming: 'Анонс',
        unreleased: 'Анонс'
    };
    const normalizedStatus = (anime.status || '').toLowerCase().trim();
    const isUpcoming = normalizedStatus === 'upcoming' || normalizedStatus === 'unreleased' || normalizedStatus === 'анонс';
    const statusText = statusMap[normalizedStatus] || anime.status || 'Невідомо';

    const subtypeMap = {
        tv: 'TV Серіал',
        movie: 'Повнометражний фільм',
        ova: 'OVA',
        ona: 'ONA',
        special: 'Спешл',
        music: 'Музичне відео'
    };
    const subtypeText = subtypeMap[(anime.subtype || '').toLowerCase()] || anime.subtype || 'Серіал';

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

                    {!isUpcoming ? (
                        <div className="Anime-detail-library-box">
                            <div className="Detail-library-header">
                                <span className="Detail-library-title">📚 Моя бібліотека</span>
                                {inLibrary && (
                                    <span className="Detail-library-saved-tag">У списку</span>
                                )}
                            </div>

                            <div className="Detail-library-field">
                                <label htmlFor="lib-status-select" className="Detail-library-label">
                                    Статус перегляду:
                                </label>
                                <select
                                    id="lib-status-select"
                                    className="Detail-library-select"
                                    value={libraryStatus}
                                    onChange={(e) => setLibraryStatus(e.target.value)}
                                    disabled={librarySaving}
                                >
                                    <option value="plan_to_watch">У планах</option>
                                    <option value="watching">Дивлюсь</option>
                                    <option value="completed">Переглянуто</option>
                                    <option value="dropped">Покинуто</option>
                                </select>
                            </div>

                            <div className="Detail-library-field">
                                <label htmlFor="lib-episodes-input" className="Detail-library-label">
                                    Переглянуто серій:
                                </label>
                                <div className="Detail-library-episodes-row">
                                    <button
                                        type="button"
                                        className="Detail-episodes-step-btn"
                                        onClick={handleStepDown}
                                        disabled={librarySaving || episodesWatched <= 0}
                                        title="Зменшити на 1"
                                    >
                                        −
                                    </button>
                                    <input
                                        id="lib-episodes-input"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="Detail-library-input episodes-input"
                                        value={episodesInput}
                                        onChange={handleEpisodesChange}
                                        onBlur={handleEpisodesBlur}
                                        onKeyDown={handleEpisodesKeyDown}
                                        disabled={librarySaving}
                                    />
                                    <button
                                        type="button"
                                        className="Detail-episodes-step-btn"
                                        onClick={handleStepUp}
                                        disabled={librarySaving || (totalEpisodes !== null && episodesWatched >= totalEpisodes)}
                                        title="Збільшити на 1"
                                    >
                                        +
                                    </button>
                                    <span className="Detail-library-episodes-total">
                                        / {totalEpisodes !== null ? `${totalEpisodes} сер.` : '?'}
                                    </span>
                                    {totalEpisodes !== null && (
                                        <button
                                            type="button"
                                            className="Detail-library-all-btn"
                                            title="Позначити всі серії переглянутими"
                                            onClick={handleMarkAllEpisodes}
                                            disabled={librarySaving || episodesWatched === totalEpisodes}
                                        >
                                            Всі
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="Detail-library-field">
                                <label className="Detail-library-label">
                                    Ваша оцінка: {libraryRating > 0 ? `(${libraryRating}/10)` : ''}
                                </label>
                                <RatingCounter
                                    key={anime.id}
                                    value={libraryRating}
                                    onChange={handleRatingChange}
                                    showSubmitButton={false}
                                />
                            </div>

                            <div className="Detail-library-field">
                                <label htmlFor="lib-notes-input" className="Detail-library-label">
                                    Нотатки та враження:
                                </label>
                                <textarea
                                    id="lib-notes-input"
                                    rows="3"
                                    className="Detail-library-textarea"
                                    placeholder="Залиште коментар або нотатку..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={librarySaving}
                                />
                            </div>

                            <div className="Detail-library-actions">
                                <button
                                    type="button"
                                    className="Detail-library-save-btn"
                                    onClick={handleSaveLibraryDetails}
                                    disabled={librarySaving}
                                >
                                    {librarySaving ? 'Збереження...' : (inLibrary ? 'Зберегти зміни' : 'Додати в бібліотеку')}
                                </button>

                                {inLibrary && (
                                    <button
                                        type="button"
                                        className="Detail-library-delete-btn"
                                        onClick={handleDeleteFromLibrary}
                                        disabled={librarySaving}
                                        title="Видалити запис з локальної бази"
                                    >
                                        Видалити
                                    </button>
                                )}
                            </div>

                            {feedback && (
                                <div className={`Detail-library-feedback ${feedback.isError ? 'error' : 'success'}`}>
                                    {feedback.message}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="Anime-detail-upcoming-notice">
                            <span className="Upcoming-notice-icon">📢</span>
                            <div className="Upcoming-notice-text">
                                <strong>Тайтл в анонсі</strong>
                                <p>Оцінювання та відлік переглянутих серій стануть доступними після прем'єри.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="Anime-detail-content">
                    <div className="Anime-detail-header-block">
                        <div className="Anime-detail-scores-row">
                            <div className="Anime-detail-score-pill">
                                ★ {anime.score ? `${anime.score} / 10` : 'Без оцінки'}
                            </div>
                            {!isUpcoming && libraryRating > 0 && (
                                <div className="Anime-detail-user-score-pill">
                                    ★ Ваша оцінка: {libraryRating} / 10
                                </div>
                            )}
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
