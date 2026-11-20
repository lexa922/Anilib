import { useCallback, useState, useMemo } from 'react';
import { userLibraryService } from '../../api/userLibraryService.js';
import { useFetch, useFeedback } from '../../hooks/index.js';
import { useRatings } from '../../context/index.js';
import RatingCounter from '../RatingCounter.jsx';
import './AnimeLibraryPanel.css';

export function AnimeLibraryPanel({ animeId, animeTitle, totalEpisodesRaw, isUpcoming }) {
    const { getRating, setRating, resetRating } = useRatings();

    const [libraryStatus, setLibraryStatus] = useState('plan_to_watch');
    const [episodesWatched, setEpisodesWatched] = useState(0);
    const [episodesInput, setEpisodesInput] = useState('0');
    const [notes, setNotes] = useState('');
    const [libraryRating, setLibraryRating] = useState(0);
    const [inLibrary, setInLibrary] = useState(false);
    const [feedback, showFeedback] = useFeedback();
    const [librarySaving, setLibrarySaving] = useState(false);

    const totalEpisodes = useMemo(() => {
        if (!totalEpisodesRaw) return null;
        const parsed = parseInt(totalEpisodesRaw, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [totalEpisodesRaw]);

    const fetchLibraryEntry = useCallback((signal) => {
        return userLibraryService.getLibraryEntry(animeId, signal);
    }, [animeId]);

    const { data: libraryEntry, loading: libraryLoading } = useFetch(fetchLibraryEntry, [animeId]);
    const [prevSyncedKey, setPrevSyncedKey] = useState(null);
    const syncKey = libraryLoading ? null : `${animeId}:${libraryEntry?.updated_at ?? 'none'}`;

    if (syncKey && prevSyncedKey !== syncKey) {
        setPrevSyncedKey(syncKey);
        if (libraryEntry) {
            setInLibrary(true);
            setLibraryStatus(libraryEntry.status || 'plan_to_watch');
            const ep = Math.max(0, parseInt(libraryEntry.episodes_watched, 10) || 0);
            setEpisodesWatched(ep);
            setEpisodesInput(String(ep));
            setNotes(libraryEntry.notes || '');
            const score = libraryEntry.user_score !== undefined && libraryEntry.user_score !== null
                ? Number(libraryEntry.user_score)
                : 0;
            setLibraryRating(score);
            setRating(animeId, score);
        } else {
            setInLibrary(false);
            setLibraryRating(getRating(animeId));
        }
    }

    if (isUpcoming) {
        return (
            <div className="Anime-detail-upcoming-notice">
                <span className="Upcoming-notice-icon">📢</span>
                <div className="Upcoming-notice-text">
                    <strong>Тайтл в анонсі</strong>
                    <p>Оцінювання та відлік переглянутих серій стануть доступними після прем'єри.</p>
                </div>
            </div>
        );
    }

    const handleRatingChange = (newVal) => {
        setLibraryRating(newVal);
        setRating(animeId, newVal);
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
        setLibrarySaving(true);
        const safeEpisodes = Math.max(
            0,
            totalEpisodes !== null ? Math.min(totalEpisodes, episodesWatched) : episodesWatched
        );
        setEpisodesWatched(safeEpisodes);
        setEpisodesInput(String(safeEpisodes));

        try {
            await userLibraryService.saveLibraryEntry(animeId, {
                title: animeTitle,
                user_score: libraryRating,
                status: libraryStatus,
                episodes_watched: safeEpisodes,
                notes
            });
            setRating(animeId, libraryRating);
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
            await userLibraryService.deleteLibraryEntry(animeId);
            setInLibrary(false);
            setLibraryStatus('plan_to_watch');
            setEpisodesWatched(0);
            setEpisodesInput('0');
            setNotes('');
            setLibraryRating(0);
            resetRating(animeId);
            showFeedback('Тайтл видалено з вашої бібліотеки');
        } catch (err) {
            showFeedback(err.message || 'Помилка видалення з бібліотеки', true);
        } finally {
            setLibrarySaving(false);
        }
    };

    return (
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
                    key={animeId}
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
    );
}

export default AnimeLibraryPanel;
