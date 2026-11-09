import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfileContext } from './ProfileContext.js';
import { userLibraryService } from '../api/userLibraryService.js';

const STORAGE_KEY = 'anilib_user_profile';
const DEFAULT_PROFILE = {
    username: 'Anime Fan',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib',
    bio: 'Любитель аніме та якісної аналітики'
};

export function ProfileProvider({ children }) {
    const [profile, setProfile] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
        } catch {
            return DEFAULT_PROFILE;
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        userLibraryService.getUserProfile(controller.signal)
            .then((data) => {
                if (data && data.username) {
                    const merged = {
                        username: data.username,
                        avatar_url: data.avatar_url || DEFAULT_PROFILE.avatar_url,
                        bio: data.bio ?? DEFAULT_PROFILE.bio
                    };
                    setProfile(merged);
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                    } catch {
                        // ignore storage errors
                    }
                }
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError(err);
                }
            })
            .finally(() => {
                setLoading(false);
            });

        return () => {
            controller.abort();
        };
    }, []);

    const updateProfile = useCallback(async (updates) => {
        setError(null);
        // Persist to backend
        const saved = await userLibraryService.saveUserProfile(updates);
        if (saved && saved.username) {
            const refreshed = {
                username: saved.username,
                avatar_url: saved.avatar_url || updates.avatar_url || DEFAULT_PROFILE.avatar_url,
                bio: saved.bio !== undefined && saved.bio !== null ? saved.bio : (updates.bio ?? DEFAULT_PROFILE.bio),
                updated_at: saved.updated_at
            };
            setProfile(refreshed);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
            } catch {
                // ignore
            }
            return refreshed;
        }

        const fallback = { ...profile, ...updates };
        setProfile(fallback);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        } catch {
            // ignore
        }
        return fallback;
    }, [profile]);

    const value = useMemo(() => ({
        profile,
        loading,
        error,
        updateProfile
    }), [profile, loading, error, updateProfile]);

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}

export default ProfileProvider;
