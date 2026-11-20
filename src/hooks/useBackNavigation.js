import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useBackNavigation(fallbackPath = '/') {
    const navigate = useNavigate();

    return useCallback(() => {
        const hasInAppHistory = typeof window !== 'undefined' && window.history.state?.idx > 0;
        if (hasInAppHistory) {
            navigate(-1);
        } else {
            navigate(fallbackPath);
        }
    }, [navigate, fallbackPath]);
}

export default useBackNavigation;
