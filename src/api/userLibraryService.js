const API_BASE = '/api';

export async function getLibrary(signal) {
    const res = await fetch(`${API_BASE}/library`, { signal });
    if (!res.ok) {
        throw new Error(`Failed to fetch library: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

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

export async function updateLibraryMetadata(id, metadata, signal) {
    if (!id) {
        throw new Error('Anime ID is required to update library metadata');
    }
    const res = await fetch(`${API_BASE}/library/${encodeURIComponent(id)}/metadata`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata),
        signal
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update library metadata: ${res.status}`);
    }
    return res.json();
}

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

export async function getLibraryStats(signal) {
    const res = await fetch(`${API_BASE}/stats`, { signal });
    if (!res.ok) {
        throw new Error(`Failed to fetch library stats: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export async function getUserProfile(signal) {
    const res = await fetch(`${API_BASE}/profile`, { signal });
    if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

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
    updateLibraryMetadata,
    deleteLibraryEntry,
    getLibraryStats,
    getUserProfile,
    saveUserProfile
};

export default userLibraryService;
