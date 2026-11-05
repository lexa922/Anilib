import { useState, useCallback, useTransition, use, Suspense } from 'react';
import CardSection from './components/CardSection';
import AnimeSection from './components/AnimeSection';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDisplay from './components/ErrorDisplay';
import DashboardSkeleton from './components/DashboardSkeleton';
import Toggle from './components/Toggle';
import { ThemeProvider } from './context/index.js';
import { animeApiClient } from './services/index.js';
import "./App.css";

const PAGE_SIZE = 12;

function DashboardContent({
    animePromise,
    currentPage,
    onPageChange,
    filters,
    onFiltersChange,
    isPending
}) {
    const currentPageAnime = use(animePromise);

    const globalAnimeList = animeApiClient.getAllLoadedAnime();

    return (
        <>
            <CardSection animeList={globalAnimeList} />
            <AnimeSection
                animeList={currentPageAnime}
                currentPage={currentPage}
                onPageChange={onPageChange}
                filters={filters}
                onFiltersChange={onFiltersChange}
                isPending={isPending}
            />
        </>
    );
}

function MainDashboard() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        genres: [],
        status: 'all',
        yearFrom: '',
        yearTo: ''
    });

    const [topAnimePromise, setTopAnimePromise] = useState(() =>
        animeApiClient.getTopAnime({ limit: PAGE_SIZE, page: 1, ...filters })
    );
    const [isPending, startTransition] = useTransition();

    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        startTransition(() => {
            setTopAnimePromise(
                animeApiClient.getTopAnime({
                    limit: PAGE_SIZE,
                    page: 1,
                    ...newFilters
                })
            );
        });
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage < 1) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        startTransition(() => {
            setCurrentPage(newPage);
            setTopAnimePromise(
                animeApiClient.getTopAnime({
                    limit: PAGE_SIZE,
                    page: newPage,
                    ...filters
                })
            );
        });
    }, [filters]);

    const handleRetry = useCallback(() => {
        setTopAnimePromise(
            animeApiClient.getTopAnime({
                limit: PAGE_SIZE,
                page: currentPage,
                ...filters
            })
        );
    }, [currentPage, filters]);

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
                    fallback={({ error, reset }) => (
                        <ErrorDisplay
                            error={error}
                            onRetry={() => {
                                handleRetry();
                                reset();
                            }}
                        />
                    )}
                >
                    <Suspense fallback={<DashboardSkeleton />}>
                        <DashboardContent
                            animePromise={topAnimePromise}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            isPending={isPending}
                        />
                    </Suspense>
                </ErrorBoundary>
            </main>
        </>
    );
}

function App() {
    return (
        <ThemeProvider>
            <MainDashboard />
        </ThemeProvider>
    );
}

export default App;
