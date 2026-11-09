import { useState, useCallback, useMemo, useEffect } from 'react';
import { RatingContext } from './RatingContext.js';
import { userLibraryService } from '../api/userLibraryService.js';

export function RatingProvider({ children }) {
    const [ratings, setRatings] = useState({});

    useEffect(() => {
        const controller = new AbortController();
        userLibraryService.getLibrary(controller.signal)
            .then((items) => {
                if (Array.isArray(items)) {
                    const map = {};
                    items.forEach((item) => {
                        if (item.user_score > 0) {
                            map[String(item.id)] = Number(item.user_score);
                        }
                    });
                    setRatings((prev) => ({ ...map, ...prev }));
                }
            })
            .catch(() => {
                // Silently ignore if server is unreachable
            });

        return () => {
            controller.abort();
        };
    }, []);

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
