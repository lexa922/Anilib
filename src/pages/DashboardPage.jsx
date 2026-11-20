import { useState, useMemo } from 'react';
import CardSection from '../components/CardSection.jsx';
import AnalyticsChartSection from '../components/charts/AnalyticsChartSection.jsx';
import AnimeSection from '../components/AnimeSection.jsx';
import DashboardSkeleton from '../components/DashboardSkeleton.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import { useAnimeQuery, useDebounce, useGlobalCatalogCache } from '../hooks/index.js';
import { filterAnimeList } from '../services/animeFiltering.js';
import { isValidYearString, validateYears } from '../constants/filterConstants.js';
import { calculateKpis } from '../utils/kpi.js';
import { useDashboardStore, selectFilters } from '../store/index.js';
import './DashboardPage.css';

export function DashboardPage() {
    const {
        data: animeList,
        loading,
        error,
        refetch,
        pageSize
    } = useAnimeQuery();

    const {
        items: catalogItems,
        kpiData: globalKpiData,
        processedCount,
        totalCount,
        isStreaming,
        isComplete,
        rateLimited,
        refreshCatalogCache
    } = useGlobalCatalogCache();

    const filters = useDashboardStore(selectFilters);
    const debouncedQuery = useDebounce(filters.query, 400);

    const yearValidationError = useMemo(
        () => validateYears(filters.yearFrom, filters.yearTo),
        [filters.yearFrom, filters.yearTo]
    );
    const hasYearOrderError = yearValidationError?.field === 'both';
    const effectiveYearFrom = !hasYearOrderError && isValidYearString(filters.yearFrom)
        ? String(filters.yearFrom).trim()
        : '';
    const effectiveYearTo = !hasYearOrderError && isValidYearString(filters.yearTo)
        ? String(filters.yearTo).trim()
        : '';

    const hasEffectiveFilters = Boolean(
        debouncedQuery.trim() ||
        filters.genres.length > 0 ||
        (filters.status && filters.status !== 'all') ||
        effectiveYearFrom ||
        effectiveYearTo
    );

    const analyticsItems = useMemo(() => {
        if (!hasEffectiveFilters) {
            return catalogItems.length > 0 ? catalogItems : animeList;
        }

        const matched = filterAnimeList(catalogItems, {
            query: debouncedQuery,
            genres: filters.genres,
            status: filters.status,
            yearFrom: effectiveYearFrom,
            yearTo: effectiveYearTo
        });

        if (animeList.length === 0) {
            return matched;
        }

        const existingIds = new Set(matched.map((item) => String(item.id)));
        const merged = [...matched];
        for (const item of animeList) {
            if (!existingIds.has(String(item.id))) {
                merged.push(item);
            }
        }
        return merged;
    }, [
        hasEffectiveFilters,
        catalogItems,
        animeList,
        debouncedQuery,
        filters.genres,
        filters.status,
        effectiveYearFrom,
        effectiveYearTo
    ]);

    const filteredKpis = useMemo(
        () => (hasEffectiveFilters ? calculateKpis(analyticsItems) : null),
        [hasEffectiveFilters, analyticsItems]
    );

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    if (!loading && !hasLoadedOnce) {
        setHasLoadedOnce(true);
    }

    const isInitialLoad = loading && !hasLoadedOnce;

    const cardSectionSubtitle = hasEffectiveFilters
        ? `Відфільтровано з кешу Kitsu: ${analyticsItems.length.toLocaleString('uk-UA')} тайтлів`
        : null;

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
                            kpiData={hasEffectiveFilters ? filteredKpis : globalKpiData}
                            processedCount={processedCount}
                            totalCount={totalCount}
                            isStreaming={isStreaming}
                            isComplete={isComplete}
                            customSubtitle={cardSectionSubtitle}
                        />

                        <AnalyticsChartSection
                            animeList={analyticsItems}
                            loading={loading && analyticsItems.length === 0}
                            processedCount={processedCount}
                            totalCount={totalCount}
                            isStreaming={isStreaming}
                            isComplete={isComplete}
                            rateLimited={rateLimited}
                            hasActiveFilters={hasEffectiveFilters}
                            onRefreshCache={refreshCatalogCache}
                        />

                        <AnimeSection
                            animeList={animeList}
                            loading={loading}
                            pageSize={pageSize}
                        />
                    </>
                )}
            </ErrorBoundary>
        </div>
    );
}

export default DashboardPage;
