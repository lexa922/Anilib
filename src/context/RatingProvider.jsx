import { useState, useCallback, useMemo } from 'react';
import { RatingContext } from './RatingContext.js';

export function RatingProvider({ children }) {
    const [ratings, setRatings] = useState({});

    const getRating = useCallback((animeId) => {
        if (!animeId) return 0;
        return ratings[String(animeId)] || 0;
    }, [ratings]);

    const setRating = useCallback((animeId, value) => {
        if (!animeId) return;
        setRatings((prev) => ({
            ...prev,
            [String(animeId)]: Number(value)
        }));
    }, []);

    const resetRating = useCallback((animeId) => {
        if (!animeId) return;
        setRatings((prev) => {
            const next = { ...prev };
            delete next[String(animeId)];
            return next;
        });
    }, []);

    const value = useMemo(() => ({
        ratings,
        getRating,
        setRating,
        resetRating
    }), [ratings, getRating, setRating, resetRating]);

    return (
        <RatingContext.Provider value={value}>
            {children}
        </RatingContext.Provider>
    );
}

export default RatingProvider;
