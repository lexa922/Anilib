import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { userLibraryService } from '../../api/userLibraryService.js';
import { useDashboardStore } from '../../store/index.js';
import { useFeedback } from '../../hooks/index.js';
import { LIBRARY_STATUS_LABELS } from '../../constants/filterConstants.js';
import './ProfileLibraryList.css';

export function ProfileLibraryList({ libraryItems = [], onDeleted }) {
    const resetRating = useDashboardStore((state) => state.resetRating);
    const [libraryFilter, setLibraryFilter] = useState('all');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [actionFeedback, showActionFeedback] = useFeedback();

    const filteredItems = useMemo(() => {
        if (!Array.isArray(libraryItems)) return [];
        if (libraryFilter === 'all') return libraryItems;
        return libraryItems.filter((item) => item.status === libraryFilter);
    }, [libraryItems, libraryFilter]);

    const handleDeleteItem = async (itemId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirmDeleteId !== itemId) {
            setConfirmDeleteId(itemId);
            return;
        }
        try {
            await userLibraryService.deleteLibraryEntry(itemId);
            setConfirmDeleteId(null);
            resetRating(itemId);
            if (onDeleted) onDeleted();
        } catch (err) {
            setConfirmDeleteId(null);
            showActionFeedback(err.message || 'Помилка видалення з бібліотеки', true, false);
        }
    };

    return (
        <div className="Profile-library-box">
            <div className="Profile-library-header">
                <h3 className="Profile-library-title">
                    Моя бібліотека тайтлів ({filteredItems.length})
                </h3>

                <div className="Profile-library-filters">
                    {['all', 'watching', 'completed', 'plan_to_watch', 'dropped'].map((statusKey) => (
                        <button
                            type="button"
                            key={statusKey}
                            className={`Profile-filter-tab ${libraryFilter === statusKey ? 'active' : ''}`}
                            onClick={() => setLibraryFilter(statusKey)}
                        >
                            {statusKey === 'all' ? 'Всі' : LIBRARY_STATUS_LABELS[statusKey]}
                        </button>
                    ))}
                </div>
            </div>

            {actionFeedback && (
                <div className={`Profile-feedback ${actionFeedback.isError ? 'error' : 'success'}`}>
                    {actionFeedback.message}
                </div>
            )}

            {filteredItems.length === 0 ? (
                <div className="Profile-library-empty">
                    <span className="Empty-icon">📭</span>
                    <h4>У цій категорії поки що немає збережених тайтлів</h4>
                    <p>Ви можете відкрити будь-яке аніме з каталогу та додати його до власної бібліотеки.</p>
                    <Link to="/" className="Profile-go-catalog-btn">
                        Перейти до каталогу аніме
                    </Link>
                </div>
            ) : (
                <div className="Profile-library-list">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="Profile-library-item">
                            <div className="Item-main-info">
                                <Link to={`/anime/${item.id}`} className="Item-title-link">
                                    {item.title}
                                </Link>
                                <div className="Item-meta-row">
                                    <span className={`Item-status-badge status-${item.status}`}>
                                        {LIBRARY_STATUS_LABELS[item.status] || item.status}
                                    </span>
                                    <span className="Item-episodes">
                                        Епізоди: {item.episodes_watched} сер.
                                    </span>
                                    {item.user_score > 0 && (
                                        <span className="Item-rating">
                                            ★ {item.user_score}/10
                                        </span>
                                    )}
                                </div>
                                {item.notes && (
                                    <p className="Item-notes">"{item.notes}"</p>
                                )}
                            </div>

                            <div className="Item-actions">
                                <Link to={`/anime/${item.id}`} className="Item-view-btn">
                                    Деталі →
                                </Link>
                                {confirmDeleteId === item.id ? (
                                    <>
                                        <button
                                            type="button"
                                            className="Item-delete-btn"
                                            onClick={(e) => handleDeleteItem(item.id, e)}
                                            title="Підтвердити видалення"
                                        >
                                            Підтвердити
                                        </button>
                                        <button
                                            type="button"
                                            className="Item-view-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setConfirmDeleteId(null);
                                            }}
                                        >
                                            Скасувати
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="Item-delete-btn"
                                        onClick={(e) => handleDeleteItem(item.id, e)}
                                        title="Видалити з бібліотеки"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProfileLibraryList;
