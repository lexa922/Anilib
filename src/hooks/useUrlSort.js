import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SORT } from '../constants/sortOptions.js';

export function useUrlSort(defaultSort = DEFAULT_SORT) {
    const getSortFromUrl = useCallback(() => {
        if (typeof window === 'undefined') return defaultSort;
        const params = new URLSearchParams(window.location.search);
        return params.get('sort') || defaultSort;
    }, [defaultSort]);

    const [sort, setSortState] = useState(getSortFromUrl);

    useEffect(() => {
        const handlePopState = () => {
            setSortState(getSortFromUrl());
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [getSortFromUrl]);

    const setSort = useCallback((newSort) => {
        setSortState(newSort);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (!newSort || newSort === defaultSort) {
                url.searchParams.delete('sort');
            } else {
                url.searchParams.set('sort', newSort);
            }
            window.history.pushState({}, '', url);
        }
    }, [defaultSort]);

    return [sort, setSort];
}
