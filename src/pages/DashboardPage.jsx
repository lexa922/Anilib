import { useMemo } from 'react';
import CardSection from '../components/CardSection.jsx';
import AnimeSection from '../components/AnimeSection.jsx';
import DashboardSkeleton from '../components/DashboardSkeleton.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import { useAnimeQuery } from '../hooks/index.js';
import { calculateKpis } from '../utils/kpi.js';
import './DashboardPage.css';

export function DashboardPage() {
    const {
        data: animeList,
        globalAnimeList,
        loading,
        error,
        refetch,
        searchQuery,
        onSearchChange,
        filters,
        onFiltersChange,
        onResetFilters,
        sort,
        onSortChange,
        currentPage,
        onPageChange,
        pageSize
    } = useAnimeQuery();

    const kpiData = useMemo(() => {
        return calculateKpis(globalAnimeList);
    }, [globalAnimeList]);

    const isInitialLoad = loading && animeList.length === 0 && globalAnimeList.length === 0;

    return (
        <div className="Dashboard-page">
            <ErrorBoundary
                fallback={({ error: boundaryError, reset }) => (
                    <ErrorDisplay
                        error={boundaryError}
                        onRetry={() => {
                            refetch();
                            reset();
                        }}
                    />
                )}
            >
                {error ? (
                    <ErrorDisplay error={error} onRetry={refetch} />
                ) : isInitialLoad ? (
                    <DashboardSkeleton pageSize={pageSize} />
                ) : (
                    <>
                        <CardSection
                            kpiData={kpiData}
                            totalCount={globalAnimeList.length}
                        />

                        <AnimeSection
                            animeList={animeList}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            onPageChange={onPageChange}
                            sort={sort}
                            onSortChange={onSortChange}
                            searchQuery={searchQuery}
                            onSearchChange={onSearchChange}
                            filters={filters}
                            onFiltersChange={onFiltersChange}
                            onResetFilters={onResetFilters}
                            loading={loading}
                        />
                    </>
                )}
            </ErrorBoundary>
        </div>
    );
}

export default DashboardPage;
