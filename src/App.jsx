import { useMemo } from 'react';
import CardSection from './components/CardSection';
import AnimeSection from './components/AnimeSection';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDisplay from './components/ErrorDisplay';
import Toggle from './components/Toggle';
import { ThemeProvider } from './context/index.js';
import { useAnimeQuery } from './hooks/index.js';
import { calculateKpis } from './utils/kpi.js';
import "./App.css";

function MainDashboard() {
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
        onPageChange
    } = useAnimeQuery();

    const kpiData = useMemo(() => {
        return calculateKpis(globalAnimeList);
    }, [globalAnimeList]);

    return (
        <>
            <header className="app-header">
                <div className="app-brand">
                    <span className="brand-badge">AL</span>
                    <h1 className="brand-title">Ani<span>Lib</span></h1>
                    <span className="brand-subtitle">Аналітика та каталог аніме</span>
                </div>
                <Toggle />
            </header>

            <main className="app-main">
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
                    ) : (
                        <>
                            <CardSection
                                kpiData={kpiData}
                                totalCount={globalAnimeList.length}
                            />
                            <AnimeSection
                                animeList={animeList}
                                currentPage={currentPage}
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
            </main>
        </>
    );
}

export function App() {
    return (
        <ThemeProvider>
            <div className="app-container">
                <MainDashboard />
            </div>
        </ThemeProvider>
    );
}

export default App;
