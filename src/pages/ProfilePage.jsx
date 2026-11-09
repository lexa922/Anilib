import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/index.js';
import { userLibraryService } from '../api/userLibraryService.js';
import useFetch from '../hooks/useFetch.js';
import KpiCard from '../components/KpiCard.jsx';
import './ProfilePage.css';

const AVATAR_PRESETS = [
    { label: 'AniBot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib' },
    { label: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
    { label: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
    { label: 'Kuro', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kuro' },
    { label: 'Sakura', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sakura' },
    { label: 'Star', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Star' }
];

const STATUS_LABELS = {
    plan_to_watch: 'У планах',
    watching: 'Дивлюсь',
    completed: 'Переглянуто',
    dropped: 'Покинуто'
};

export function ProfilePage() {
    const navigate = useNavigate();
    const { profile, updateProfile } = useProfile();

    // Profile form state with render-time sync
    const [prevProfile, setPrevProfile] = useState(profile);
    const [username, setUsername] = useState(profile.username || '');
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [isDirty, setIsDirty] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    if (prevProfile !== profile) {
        setPrevProfile(profile);
        if (!isDirty) {
            setUsername(profile.username || '');
            setAvatarUrl(profile.avatar_url || '');
            setBio(profile.bio || '');
        }
    }

    // Filter for personal library
    const [libraryFilter, setLibraryFilter] = useState('all');

    // Fetch personal stats
    const fetchStats = useCallback((signal) => {
        return userLibraryService.getLibraryStats(signal);
    }, []);
    const {
        data: stats,
        loading: statsLoading,
        error: statsError,
        refetch: refetchStats
    } = useFetch(fetchStats, []);

    // Fetch personal library list
    const fetchLibrary = useCallback((signal) => {
        return userLibraryService.getLibrary(signal);
    }, []);
    const {
        data: libraryItems,
        loading: libraryLoading,
        error: libraryError,
        refetch: refetchLibrary
    } = useFetch(fetchLibrary, []);

    const filteredItems = useMemo(() => {
        if (!libraryItems || !Array.isArray(libraryItems)) return [];
        if (libraryFilter === 'all') return libraryItems;
        return libraryItems.filter((item) => item.status === libraryFilter);
    }, [libraryItems, libraryFilter]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    const handleRetry = () => {
        refetchStats();
        refetchLibrary();
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const trimmedName = username.trim();
        if (!trimmedName) {
            setSaveFeedback({ message: "Ім'я користувача не може бути порожнім", isError: true });
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                username: trimmedName,
                avatar_url: avatarUrl.trim(),
                bio: bio.trim()
            });
            setIsDirty(false);
            setSaveFeedback({ message: '✓ Профіль успішно збережено в базі даних!', isError: false });
            setTimeout(() => setSaveFeedback(null), 3500);
        } catch (err) {
            setSaveFeedback({
                message: err.message || 'Не вдалося зберегти профіль на сервері (перевірте npm run server)',
                isError: true
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (itemId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Видалити цей тайтл з вашої бібліотеки?')) return;
        try {
            await userLibraryService.deleteLibraryEntry(itemId);
            refetchLibrary();
            refetchStats();
        } catch (err) {
            alert(err.message || 'Помилка видалення');
        }
    };

    // 1. Full-page error state when server is unreachable or fails
    if (statsError || libraryError) {
        const errorDetails = statsError?.message || libraryError?.message || 'Не вдалося встановити зв\'язок із сервером.';

        return (
            <div className="Profile-page">
                <div className="Profile-nav">
                    <button type="button" className="Profile-back-btn" onClick={handleBack}>
                        ← Назад
                    </button>
                    <div className="Profile-breadcrumbs">
                        <Link to="/">Головна</Link>
                        <span>/</span>
                        <span className="Profile-breadcrumb-current">Помилка з'єднання</span>
                    </div>
                </div>

                <div className="Profile-error-card">
                    <div className="Profile-error-icon">🔌</div>
                    <h2 className="Profile-error-title">Сервер бази даних недоступний</h2>
                    <p className="Profile-error-desc">
                        Не вдалося встановити з'єднання з бекендом (Node.js + SQLite). Переконайтеся, що сервер запущено на порті 3001 командою <code>npm run server</code>.
                    </p>
                    <span className="Profile-error-technical">Деталі помилки: {errorDetails}</span>
                    <div className="Profile-error-actions">
                        <button
                            type="button"
                            className="Profile-btn-primary"
                            onClick={handleRetry}
                        >
                            ↻ Спробувати знову
                        </button>
                        <Link to="/" className="Profile-btn-secondary">
                            Повернутися до каталогу
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Full-page skeleton loading state
    const isInitialLoading = (statsLoading || libraryLoading) && (!stats && !libraryItems);

    if (isInitialLoading) {
        return (
            <div className="Profile-page" aria-busy="true" aria-label="Завантаження профілю">
                <div className="Profile-nav">
                    <button type="button" className="Profile-back-btn" disabled>
                        ← Назад
                    </button>
                    <div className="Profile-breadcrumbs">
                        <Link to="/">Головна</Link>
                        <span>/</span>
                        <span>Завантаження кабінету...</span>
                    </div>
                </div>

                <div className="Profile-skeleton-layout">
                    {/* Left Column: Profile Card Skeleton */}
                    <div className="Profile-skeleton-user-card">
                        <div className="Skeleton-avatar-row">
                            <div className="Skeleton-avatar" />
                            <div className="Skeleton-user-lines">
                                <div className="Skeleton-line title" />
                                <div className="Skeleton-line sub" />
                            </div>
                        </div>

                        <div className="Skeleton-form-group">
                            <div className="Skeleton-line label" />
                            <div className="Skeleton-input" />
                        </div>

                        <div className="Skeleton-form-group">
                            <div className="Skeleton-line label" />
                            <div className="Skeleton-presets-row">
                                <div className="Skeleton-preset-circle" />
                                <div className="Skeleton-preset-circle" />
                                <div className="Skeleton-preset-circle" />
                                <div className="Skeleton-preset-circle" />
                                <div className="Skeleton-preset-circle" />
                            </div>
                        </div>

                        <div className="Skeleton-form-group">
                            <div className="Skeleton-line label" />
                            <div className="Skeleton-input" />
                        </div>

                        <div className="Skeleton-form-group">
                            <div className="Skeleton-line label" />
                            <div className="Skeleton-textarea" />
                        </div>

                        <div className="Skeleton-btn" />
                    </div>

                    {/* Right Column: KPIs & Library Skeletons */}
                    <div className="Profile-skeleton-content">
                        <div className="Profile-skeleton-kpis-box">
                            <div className="Skeleton-line header-title" />
                            <div className="Skeleton-line header-sub" />
                            <div className="Skeleton-kpis-grid">
                                <div className="Skeleton-kpi-card" />
                                <div className="Skeleton-kpi-card" />
                                <div className="Skeleton-kpi-card" />
                                <div className="Skeleton-kpi-card" />
                            </div>
                        </div>

                        <div className="Profile-skeleton-library-box">
                            <div className="Skeleton-library-header-row">
                                <div className="Skeleton-line header-title" />
                                <div className="Skeleton-tabs-row">
                                    <div className="Skeleton-tab" />
                                    <div className="Skeleton-tab" />
                                    <div className="Skeleton-tab" />
                                </div>
                            </div>

                            <div className="Skeleton-library-rows">
                                <div className="Skeleton-library-row" />
                                <div className="Skeleton-library-row" />
                                <div className="Skeleton-library-row" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const kpiCards = [
        {
            id: 'stat-completed',
            title: 'Завершено перегляд',
            value: statsLoading ? '...' : (stats?.completedCount ?? 0),
            unit: ' тайтлів'
        },
        {
            id: 'stat-avg-score',
            title: 'Сер. власна оцінка',
            value: statsLoading ? '...' : (stats?.averageScore > 0 ? stats.averageScore : '—'),
            unit: stats?.averageScore > 0 ? ' / 10' : ''
        },
        {
            id: 'stat-episodes',
            title: 'Переглянуто серій',
            value: statsLoading ? '...' : (stats?.totalEpisodesWatched ?? 0),
            unit: ' серій'
        },
        {
            id: 'stat-total',
            title: 'Усього в бібліотеці',
            value: statsLoading ? '...' : (stats?.totalCount ?? 0),
            unit: ' тайтлів'
        }
    ];

    return (
        <div className="Profile-page">
            <div className="Profile-nav">
                <button type="button" className="Profile-back-btn" onClick={handleBack}>
                    ← Назад
                </button>
                <div className="Profile-breadcrumbs">
                    <Link to="/">Головна</Link>
                    <span>/</span>
                    <span className="Profile-breadcrumb-current">Особистий кабінет</span>
                </div>
            </div>

            <div className="Profile-layout">
                {/* Left Column: User Profile Editor */}
                <div className="Profile-user-card">
                    <div className="Profile-avatar-preview-wrap">
                        <img
                            src={avatarUrl || profile.avatar_url || AVATAR_PRESETS[0].url}
                            alt="Avatar"
                            className="Profile-avatar-preview"
                            onError={(e) => {
                                e.target.src = AVATAR_PRESETS[0].url;
                            }}
                        />
                        <div className="Profile-user-info-text">
                            <h2 className="Profile-username-display">{username || profile.username || 'Anime Fan'}</h2>
                            <p className="Profile-bio-display">{bio || profile.bio || 'Учасник спільноти AniLib'}</p>
                        </div>
                    </div>

                    <form className="Profile-form" onSubmit={handleSaveProfile}>
                        <h3 className="Profile-section-title">Налаштування профілю</h3>

                        <div className="Profile-field">
                            <label htmlFor="profile-username" className="Profile-label">
                                Ім'я користувача:
                            </label>
                            <input
                                id="profile-username"
                                type="text"
                                className="Profile-input"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setIsDirty(true);
                                }}
                                placeholder="Ваш нікнейм..."
                                maxLength={30}
                                disabled={isSaving}
                            />
                        </div>

                        <div className="Profile-field">
                            <label className="Profile-label">
                                Оберіть аватарку з пресетів:
                            </label>
                            <div className="Profile-presets-list">
                                {AVATAR_PRESETS.map((preset) => (
                                    <button
                                        type="button"
                                        key={preset.url}
                                        className={`Profile-preset-btn ${avatarUrl === preset.url ? 'active' : ''}`}
                                        onClick={() => {
                                            setAvatarUrl(preset.url);
                                            setIsDirty(true);
                                        }}
                                        title={preset.label}
                                    >
                                        <img src={preset.url} alt={preset.label} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="Profile-field">
                            <label htmlFor="profile-avatar-url" className="Profile-label">
                                Або вкажіть пряме посилання на аватарку (URL):
                            </label>
                            <input
                                id="profile-avatar-url"
                                type="url"
                                className="Profile-input"
                                value={avatarUrl}
                                onChange={(e) => {
                                    setAvatarUrl(e.target.value);
                                    setIsDirty(true);
                                }}
                                placeholder="https://example.com/avatar.jpg"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="Profile-field">
                            <label htmlFor="profile-bio" className="Profile-label">
                                Про себе / Статус:
                            </label>
                            <textarea
                                id="profile-bio"
                                className="Profile-textarea"
                                rows="3"
                                value={bio}
                                onChange={(e) => {
                                    setBio(e.target.value);
                                    setIsDirty(true);
                                }}
                                placeholder="Розкажіть про свої улюблені жанри чи тайтли..."
                                maxLength={200}
                                disabled={isSaving}
                            />
                        </div>

                        <button
                            type="submit"
                            className="Profile-save-btn"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Збереження...' : 'Зберегти профіль'}
                        </button>

                        {saveFeedback && (
                            <div className={`Profile-feedback ${saveFeedback.isError ? 'error' : 'success'}`}>
                                {saveFeedback.message}
                            </div>
                        )}
                    </form>
                </div>

                {/* Right Column: Personal Metrics & Saved Library */}
                <div className="Profile-stats-content">
                    {/* Personal Stats Section */}
                    <div className="Profile-kpis-box">
                        <div className="Profile-kpis-header">
                            <div>
                                <h3 className="Profile-kpis-title">Базові особисті метрики</h3>
                            </div>
                            <button
                                type="button"
                                className="Profile-refresh-stats-btn"
                                onClick={handleRetry}
                                title="Оновити дані"
                            >
                                ↻ Оновити
                            </button>
                        </div>

                        <div className="Profile-kpis-grid">
                            {kpiCards.map((card) => (
                                <KpiCard
                                    key={card.id}
                                    title={card.title}
                                    value={card.value}
                                    unit={card.unit}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Saved Library Drilldown Section */}
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
                                        {statusKey === 'all' ? 'Всі' : STATUS_LABELS[statusKey]}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                                    {STATUS_LABELS[item.status] || item.status}
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
                                            <button
                                                type="button"
                                                className="Item-delete-btn"
                                                onClick={(e) => handleDeleteItem(item.id, e)}
                                                title="Видалити з бібліотеки"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
