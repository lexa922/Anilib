import { useContext } from 'react';
import { RatingContext } from './RatingContext.js';

export function useRatings() {
    const context = useContext(RatingContext);
    if (!context) {
        throw new Error('useRatings must be used within a RatingProvider');
    }
    return context;
}

export default useRatings;
