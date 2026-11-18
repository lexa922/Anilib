import { useState, useRef, useEffect, useCallback } from 'react';

export function useFeedback(durationMs = 3500) {
    const [feedback, setFeedback] = useState(null);
    const timerRef = useRef(null);

    const clearFeedback = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setFeedback(null);
    }, []);

    const showFeedback = useCallback((message, isError = false, autoHide = true) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setFeedback({ message, isError });

        if (autoHide && durationMs > 0) {
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                setFeedback(null);
            }, durationMs);
        }
    }, [durationMs]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return [feedback, showFeedback, clearFeedback];
}

export default useFeedback;
