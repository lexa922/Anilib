import { useState } from 'react';
import CardSection from '../components/CardSection.jsx';
import AnimeSection from '../components/AnimeSection.jsx';
import DashboardSkeleton from '../components/DashboardSkeleton.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import { useAnimeQuery, useGlobalKpis } from '../hooks/index.js';
import './DashboardPage.css';

export function DashboardPage() {
    const {
        data: animeList,
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

    const {
        kpiData,
        processedCount,
        totalCount,
        isStreaming,
        isComplete
    } = useGlobalKpis();

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    if (!loading && !hasLoadedOnce) {
        setHasLoadedOnce(true);
    }

    const isInitialLoad = loading && !hasLoadedOnce;

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
                            processedCount={processedCount}
                            totalCount={totalCount}
                            isStreaming={isStreaming}
                            isComplete={isComplete}
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
