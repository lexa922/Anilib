import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_SORT } from '../constants/sortOptions.js';

export function parseUrlParams(search = typeof window !== 'undefined' ? window.location.search : '') {
    const searchParams = search instanceof URLSearchParams ? search : new URLSearchParams(search);
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const sort = searchParams.get('sort') || DEFAULT_SORT;
    const genresRaw = searchParams.get('genres');
    const genres = genresRaw ? genresRaw.split(',').filter(Boolean) : [];
    const status = searchParams.get('status') || 'all';
    const yearFrom = searchParams.get('yearFrom') || '';
    const yearTo = searchParams.get('yearTo') || '';
    const pageRaw = parseInt(searchParams.get('page'), 10);
    const page = !Number.isNaN(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    return {
        query,
        sort,
        genres,
        status,
        yearFrom,
        yearTo,
        page
    };
}

export function buildSearchParams({ query, sort, genres, status, yearFrom, yearTo, page }) {
    const next = new URLSearchParams();

    if (query && String(query).trim()) {
        next.set('query', String(query).trim());
    }

    if (sort && sort !== DEFAULT_SORT) {
        next.set('sort', sort);
    }

    if (Array.isArray(genres) && genres.length > 0) {
        next.set('genres', genres.join(','));
    }

    if (status && status !== 'all') {
        next.set('status', status);
    }

    if (yearFrom !== '' && yearFrom !== undefined && yearFrom !== null) {
        next.set('yearFrom', String(yearFrom));
    }

    if (yearTo !== '' && yearTo !== undefined && yearTo !== null) {
        next.set('yearTo', String(yearTo));
    }

    if (page && page > 1) {
        next.set('page', String(page));
    }

    return next;
}

export function useUrlParams() {
    const [searchParams, setSearchParams] = useSearchParams();

    const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

    const updateParams = useCallback((nextValues) => {
        setSearchParams((prev) => {
            const current = parseUrlParams(prev);
            const next = buildSearchParams({ ...current, ...nextValues });
            if (next.toString() === prev.toString()) {
                return prev;
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    return [params, updateParams];
}
