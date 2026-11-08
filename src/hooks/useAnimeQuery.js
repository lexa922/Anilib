import { useState, useCallback, useEffect, useMemo } from 'react';
import { animeApiClient } from '../services/index.js';
import { useUrlParams } from './useUrlParams.js';
import { useDebounce } from './useDebounce.js';
import { useFetch } from './useFetch.js';
import { INITIAL_FILTERS, DEFAULT_SEARCH_QUERY } from '../constants/filterConstants.js';

const PAGE_SIZE = 12;

export function useAnimeQuery(initialOptions = {}) {
    const limit = initialOptions.limit || PAGE_SIZE;
    const [urlParams, updateUrlParams] = useUrlParams();

    const [searchQuery, setSearchQuery] = useState(urlParams.query || DEFAULT_SEARCH_QUERY);
    const debouncedSearchQuery = useDebounce(searchQuery, 400);

    const [filters, setFilters] = useState(() => ({
        genres: urlParams.genres || INITIAL_FILTERS.genres,
        status: urlParams.status || INITIAL_FILTERS.status,
        yearFrom: urlParams.yearFrom || INITIAL_FILTERS.yearFrom,
        yearTo: urlParams.yearTo || INITIAL_FILTERS.yearTo
    }));

    const [sort, setSort] = useState(urlParams.sort || '-averageRating');
    const [currentPage, setCurrentPage] = useState(urlParams.page || 1);

    const fetchExecutor = useCallback((signal) => {
        return animeApiClient.getTopAnime({
            query: debouncedSearchQuery,
            ...filters,
            sort,
            page: currentPage,
            limit
        }, signal);
    }, [debouncedSearchQuery, filters, sort, currentPage, limit]);

    const { data, loading, error, refetch } = useFetch(
        fetchExecutor,
        [debouncedSearchQuery, filters, sort, currentPage, limit]
    );

    const globalAnimeList = useMemo(() => {
        const all = animeApiClient.getAllLoadedAnime();
        return all.length > 0 ? all : (data || []);
    }, [data]);

    useEffect(() => {
        updateUrlParams({
            query: debouncedSearchQuery,
            category: filters.genres && filters.genres.length > 0 ? filters.genres.join(',') : 'all',
            status: filters.status,
            yearFrom: filters.yearFrom,
            yearTo: filters.yearTo,
            genres: filters.genres,
            sort,
            page: currentPage
        });
    }, [debouncedSearchQuery, filters, sort, currentPage, updateUrlParams]);

    const handleSearchChange = useCallback((newQuery) => {
        animeApiClient.clearCache();
        setSearchQuery(newQuery);
        setCurrentPage(1);
    }, []);

    const handleFiltersChange = useCallback((newFilters) => {
        animeApiClient.clearCache();
        setFilters(newFilters);
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleResetFilters = useCallback(() => {
        animeApiClient.clearCache();
        setFilters(INITIAL_FILTERS);
        setSearchQuery(DEFAULT_SEARCH_QUERY);
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleSortChange = useCallback((newSort) => {
        setSort(newSort);
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage < 1) return;
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return {
        data: data || [],
        globalAnimeList,
        loading,
        error,
        refetch,
        searchQuery,
        onSearchChange: handleSearchChange,
        filters,
        onFiltersChange: handleFiltersChange,
        onResetFilters: handleResetFilters,
        sort,
        onSortChange: handleSortChange,
        currentPage,
        onPageChange: handlePageChange
    };
}
