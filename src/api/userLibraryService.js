const API_BASE = '/api';

/**
 * Fetches all saved library entries sorted by updated_at DESC.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export async function getLibrary(signal) {
    const res = await fetch(`${API_BASE}/library`, { signal });
    if (!res.ok) {
        throw new Error(`Failed to fetch library: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * Fetches single entry by anime ID.
 * Returns null if not in user's library (404).
 * @param {string|number} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object|null>}
 */
export async function getLibraryEntry(id, signal) {
    if (!id) return null;
    const res = await fetch(`${API_BASE}/library/${encodeURIComponent(id)}`, { signal });
    if (res.status === 404) {
        return null;
    }
    if (!res.ok) {
        throw new Error(`Failed to fetch library entry: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * Upserts a library entry for anime ID.
 * @param {string|number} id
 * @param {Object} data
 * @param {string} [data.title]
 * @param {number} [data.user_score]
 * @param {string} [data.status]
 * @param {number} [data.episodes_watched]
 * @param {string} [data.notes]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function saveLibraryEntry(id, data, signal) {
    if (!id) {
        throw new Error('Anime ID is required to save library entry');
    }
    const res = await fetch(`${API_BASE}/library/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save library entry: ${res.status}`);
    }
    return res.json();
}

/**
 * Removes entry from user's library.
 * @param {string|number} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function deleteLibraryEntry(id, signal) {
    if (!id) return null;
    const res = await fetch(`${API_BASE}/library/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        signal
    });
    if (!res.ok && res.status !== 404) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete library entry: ${res.status}`);
    }
    return res.json();
}

/**
 * Computes SQL aggregates from the backend.
 * @param {AbortSignal} [signal]
 * @returns {Promise<{completedCount: number, averageScore: number, totalEpisodesWatched: number, totalCount: number}>}
 */
export async function getLibraryStats(signal) {
    const res = await fetch(`${API_BASE}/stats`, { signal });
    if (!res.ok) {
        throw new Error(`Failed to fetch library stats: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * Fetches user profile from backend.
 * @param {AbortSignal} [signal]
 * @returns {Promise<{id: string, username: string, avatar_url: string, bio: string}>}
 */
export async function getUserProfile(signal) {
    const res = await fetch(`${API_BASE}/profile`, { signal });
    if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * Updates user profile.
 * @param {Object} profileData
 * @param {string} [profileData.username]
 * @param {string} [profileData.avatar_url]
 * @param {string} [profileData.bio]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function saveUserProfile(profileData, signal) {
    const res = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData),
        signal
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update profile: ${res.status}`);
    }
    return res.json();
}

export const userLibraryService = {
    getLibrary,
    getLibraryEntry,
    saveLibraryEntry,
    deleteLibraryEntry,
    getLibraryStats,
    getUserProfile,
    saveUserProfile
};

export default userLibraryService;
