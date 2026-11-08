import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SORT } from '../constants/sortOptions.js';

export function parseUrlParams() {
    if (typeof window === 'undefined') {
        return {
            query: '',
            category: 'all',
            sort: DEFAULT_SORT,
            genres: [],
            status: 'all',
            yearFrom: '',
            yearTo: '',
            page: 1
        };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || DEFAULT_SORT;
    const genresRaw = searchParams.get('genres');
    const genres = genresRaw ? genresRaw.split(',').filter(Boolean) : [];
    const status = searchParams.get('status') || 'all';
    const yearFrom = searchParams.get('yearFrom') || '';
    const yearTo = searchParams.get('yearTo') || '';
    const pageRaw = parseInt(searchParams.get('page'), 10);
    const page = !isNaN(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    return {
        query,
        category,
        sort,
        genres,
        status,
        yearFrom,
        yearTo,
        page
    };
}

export function syncUrlParams({ query, category, sort, genres, status, yearFrom, yearTo, page }) {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);

    if (query && String(query).trim()) {
        url.searchParams.set('query', String(query).trim());
    } else {
        url.searchParams.delete('query');
    }

    if (category && category !== 'all') {
        url.searchParams.set('category', category);
    } else {
        url.searchParams.delete('category');
    }

    if (!sort || sort === DEFAULT_SORT) {
        url.searchParams.delete('sort');
    } else {
        url.searchParams.set('sort', sort);
    }

    if (Array.isArray(genres) && genres.length > 0) {
        url.searchParams.set('genres', genres.join(','));
    } else {
        url.searchParams.delete('genres');
    }

    if (!status || status === 'all') {
        url.searchParams.delete('status');
    } else {
        url.searchParams.set('status', status);
    }

    if (yearFrom !== '' && yearFrom !== undefined && yearFrom !== null) {
        url.searchParams.set('yearFrom', String(yearFrom));
    } else {
        url.searchParams.delete('yearFrom');
    }

    if (yearTo !== '' && yearTo !== undefined && yearTo !== null) {
        url.searchParams.set('yearTo', String(yearTo));
    } else {
        url.searchParams.delete('yearTo');
    }

    if (!page || page <= 1) {
        url.searchParams.delete('page');
    } else {
        url.searchParams.set('page', String(page));
    }

    window.history.pushState({}, '', url);
}

export function useUrlParams() {
    const [params, setParams] = useState(parseUrlParams);

    useEffect(() => {
        const handlePopState = () => {
            setParams(parseUrlParams());
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const updateParams = useCallback((newPartial) => {
        setParams((prev) => {
            const next = { ...prev, ...newPartial };
            syncUrlParams(next);
            return next;
        });
    }, []);

    return [params, updateParams];
}
