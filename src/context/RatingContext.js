import { createContext } from 'react';

export const RatingContext = createContext({
    ratings: {},
    getRating: () => 0,
    setRating: () => {},
    resetRating: () => {}
});
