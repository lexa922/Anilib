import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userLibraryService } from '../api/userLibraryService.js';
import { useFetch, useBackNavigation, useEnrichedLibrary } from '../hooks/index.js';
import { useDashboardStore, selectFavoritesCount } from '../store/index.js';
import KpiCard from '../components/KpiCard.jsx';
import ProfileSkeleton from '../components/profile/ProfileSkeleton.jsx';
import ProfileEditorCard from '../components/profile/ProfileEditorCard.jsx';
import ProfileAnalyticsSection from '../components/profile/ProfileAnalyticsSection.jsx';
import ProfileLibraryList from '../components/profile/ProfileLibraryList.jsx';
import ProfileFavoritesList from '../components/profile/ProfileFavoritesList.jsx';
import './ProfilePage.css';

export function ProfilePage() {
    const handleBack = useBackNavigation('/');
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'favorites' ? 'favorites' : 'library';

    const favoritesCount = useDashboardStore(selectFavoritesCount);

    const fetchStats = useCallback((signal) => {
        return userLibraryService.getLibraryStats(signal);
    }, []);
    const {
        data: stats,
        loading: statsLoading,
        error: statsError,
        refetch: refetchStats
    } = useFetch(fetchStats, []);

    const fetchLibrary = useCallback((signal) => {
        return userLibraryService.getLibrary(signal);
    }, []);
    const {
        data: libraryItems,
        loading: libraryLoading,
        error: libraryError,
        refetch: refetchLibrary
    } = useFetch(fetchLibrary, []);

    const { items: enrichedLibraryItems, isEnriching } = useEnrichedLibrary(libraryItems || []);

    const handleRetry = () => {
        refetchStats();
        refetchLibrary();
    };

    const handleSelectTab = (tabName) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tabName === 'favorites') {
                next.set('tab', 'favorites');
            } else {
                next.delete('tab');
            }
            return next;
        }, { replace: true });
    };

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

    const isInitialLoading = (statsLoading || libraryLoading) && (!stats && !libraryItems);
    if (isInitialLoading) {
        return <ProfileSkeleton />;
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
        },
        {
            id: 'stat-favorites',
            title: 'В обраному',
            value: favoritesCount,
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
                <ProfileEditorCard />

                <div className="Profile-stats-content">
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

                    <ProfileAnalyticsSection
                        libraryItems={enrichedLibraryItems}
                        isEnriching={isEnriching}
                    />

                    <div className="Profile-collections-box">
                        <div className="Profile-collections-tabs" role="tablist" aria-label="Колекції профілю">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'library'}
                                className={`Profile-collection-tab ${activeTab === 'library' ? 'active' : ''}`}
                                onClick={() => handleSelectTab('library')}
                            >
                                📚 Моя бібліотека ({(libraryItems || []).length})
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'favorites'}
                                className={`Profile-collection-tab fav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                                onClick={() => handleSelectTab('favorites')}
                            >
                                ♥ Обрані тайтли ({favoritesCount})
                            </button>
                        </div>

                        {activeTab === 'favorites' ? (
                            <ProfileFavoritesList />
                        ) : (
                            <ProfileLibraryList
                                libraryItems={enrichedLibraryItems}
                                onDeleted={handleRetry}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
