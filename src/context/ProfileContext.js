import { createContext } from 'react';

export const ProfileContext = createContext({
    profile: {
        username: 'Anime Fan',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib',
        bio: 'Любитель аніме та якісної аналітики'
    },
    loading: false,
    error: null,
    updateProfile: async () => {}
});

export default ProfileContext;
