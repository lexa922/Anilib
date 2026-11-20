import { useCallback, useEffect, useRef } from 'react';
import { animeApiClient } from '../services/index.js';
import { parseUrlParams, useUrlParams } from './useUrlParams.js';
import { useDebounce } from './useDebounce.js';
import { useFetch } from './useFetch.js';
import { mergeCatalogItems } from './useGlobalKpis.js';
import { isValidYearString, validateYears } from '../constants/filterConstants.js';
import {
    useDashboardStore,
    selectFilters,
    selectSort,
    selectCurrentPage
} from '../store/index.js';

const PAGE_SIZE = 12;

export function useAnimeQuery(initialOptions = {}) {
    const limit = initialOptions.limit || PAGE_SIZE;
    const [, updateUrlParams] = useUrlParams();

    const filters = useDashboardStore(selectFilters);
    const sort = useDashboardStore(selectSort);
    const currentPage = useDashboardStore(selectCurrentPage);

    const hydratedRef = useRef(false);
    const pendingHydrationSyncRef = useRef(false);

    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;

        if (typeof window !== 'undefined' && window.location.search.length > 1) {
            pendingHydrationSyncRef.current = true;
            useDashboardStore.getState().hydrateFromUrl(parseUrlParams(window.location.search));
        }
    }, []);

    const debouncedQuery = useDebounce(filters.query, 400);

    const yearValidationError = validateYears(filters.yearFrom, filters.yearTo);
    const hasYearOrderError = yearValidationError?.field === 'both';
    const effectiveYearFrom = !hasYearOrderError && isValidYearString(filters.yearFrom)
        ? String(filters.yearFrom).trim()
        : '';
    const effectiveYearTo = !hasYearOrderError && isValidYearString(filters.yearTo)
        ? String(filters.yearTo).trim()
        : '';

    useEffect(() => {
        if (pendingHydrationSyncRef.current) {
            if (filters.query !== debouncedQuery) {
                return;
            }
            pendingHydrationSyncRef.current = false;
        }

        updateUrlParams({
            query: debouncedQuery,
            status: filters.status,
            yearFrom: effectiveYearFrom,
            yearTo: effectiveYearTo,
            genres: filters.genres,
            sort,
            page: currentPage
        });
    }, [
        debouncedQuery,
        filters.query,
        filters.status,
        filters.genres,
        effectiveYearFrom,
        effectiveYearTo,
        sort,
        currentPage,
        updateUrlParams
    ]);

    const fetchExecutor = useCallback((signal) => {
        return animeApiClient.getAnimePage(
            {
                query: debouncedQuery,
                genres: filters.genres,
                status: filters.status,
                yearFrom: effectiveYearFrom,
                yearTo: effectiveYearTo,
                sort
            },
            {
                page: currentPage,
                limit
            },
            signal
        );
    }, [
        debouncedQuery,
        filters.genres,
        filters.status,
        effectiveYearFrom,
        effectiveYearTo,
        sort,
        currentPage,
        limit
    ]);

    const { data: apiData, loading, error, refetch } = useFetch(
        fetchExecutor,
        [
            debouncedQuery,
            filters.status,
            filters.genres,
            effectiveYearFrom,
            effectiveYearTo,
            sort,
            currentPage,
            limit
        ]
    );

    useEffect(() => {
        if (Array.isArray(apiData) && apiData.length > 0) {
            mergeCatalogItems(apiData);
        }
    }, [apiData]);

    return {
        data: apiData || [],
        loading,
        error,
        refetch,
        pageSize: limit
    };
}
