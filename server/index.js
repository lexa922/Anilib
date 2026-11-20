import express from 'express';
import db from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const VALID_STATUSES = ['watching', 'completed', 'dropped', 'plan_to_watch'];

function normalizeGenresInput(rawGenres) {
    let source = rawGenres;
    if (typeof source === 'string') {
        try {
            source = JSON.parse(source);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(source)) {
        return [];
    }

    const seen = new Set();
    const normalized = [];
    for (const entry of source) {
        const name = typeof entry === 'string'
            ? entry.trim()
            : String(entry?.name || entry?.title || '').trim();
        if (name && !seen.has(name)) {
            seen.add(name);
            normalized.push(name);
        }
    }
    return normalized;
}

function parseReleaseYear(rawYear) {
    if (rawYear === null || rawYear === undefined || rawYear === '') {
        return null;
    }
    const parsed = parseInt(rawYear, 10);
    if (!Number.isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
        return parsed;
    }
    return null;
}

function parseKitsuScore(rawScore) {
    if (rawScore === null || rawScore === undefined || rawScore === '') {
        return null;
    }
    const parsed = Number(rawScore);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 10) {
        return Number(parsed.toFixed(2));
    }
    return null;
}

function formatLibraryRow(row) {
    if (!row) return row;
    return {
        ...row,
        genres: normalizeGenresInput(row.genres),
        poster: row.poster || '',
        subtype: row.subtype || '',
        release_year: row.release_year ?? null,
        metadata_synced: Boolean(row.metadata_synced)
    };
}

app.get('/api/library', (req, res) => {
    const rows = db.prepare('SELECT * FROM user_library ORDER BY updated_at DESC').all();
    res.json(rows.map(formatLibraryRow));
});

app.get('/api/stats', (req, res) => {
    const stats = db.prepare(`
        SELECT
            (SELECT COUNT(*) FROM user_library WHERE status = 'completed') AS completedCount,
            (SELECT COALESCE(ROUND(AVG(user_score), 2), 0) FROM user_library WHERE user_score > 0) AS averageScore,
            (SELECT COALESCE(SUM(episodes_watched), 0) FROM user_library) AS totalEpisodesWatched,
            (SELECT COUNT(*) FROM user_library) AS totalCount
    `).get();
    res.json(stats);
});

app.get('/api/profile', (req, res) => {
    let profile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default');
    if (!profile) {
        db.prepare(`
            INSERT INTO user_profile (id, username, avatar_url, bio)
            VALUES ('default', 'Anime Fan', 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib', 'Любитель аніме та якісної аналітики')
        `).run();
        profile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default');
    }
    res.json(profile);
});

app.post('/api/profile', (req, res) => {
    const { username, avatar_url, bio } = req.body || {};
    const existing = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default');

    const newUsername = username !== undefined && username !== null && String(username).trim() !== ''
        ? String(username).trim()
        : (existing?.username || 'Anime Fan');

    const newAvatar = avatar_url !== undefined && avatar_url !== null
        ? String(avatar_url).trim()
        : (existing?.avatar_url || '');

    const newBio = bio !== undefined && bio !== null
        ? String(bio).trim()
        : (existing?.bio || '');

    db.prepare(`
        INSERT INTO user_profile (id, username, avatar_url, bio, updated_at)
        VALUES ('default', @username, @avatar_url, @bio, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            username = excluded.username,
            avatar_url = excluded.avatar_url,
            bio = excluded.bio,
            updated_at = CURRENT_TIMESTAMP
    `).run({
        username: newUsername,
        avatar_url: newAvatar,
        bio: newBio
    });

    const updated = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default');
    res.json(updated);
});

app.get('/api/library/:id', (req, res) => {
    const { id } = req.params;
    const entry = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);
    if (!entry) {
        return res.status(404).json({ error: 'Entry not found in user library' });
    }
    res.json(formatLibraryRow(entry));
});

app.post('/api/library/:id', (req, res) => {
    const { id } = req.params;
    const {
        title,
        user_score,
        status,
        episodes_watched,
        notes,
        kitsu_score,
        genres,
        poster,
        subtype,
        release_year
    } = req.body || {};

    const existing = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);

    const newTitle = title !== undefined && title !== null ? String(title).trim() : (existing?.title || 'Untitled');
    if (!newTitle) {
        return res.status(400).json({ error: 'Title is required' });
    }

    let newScore = existing?.user_score ?? 0;
    if (user_score !== undefined && user_score !== null) {
        const parsedScore = Number(user_score);
        if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
            return res.status(400).json({ error: 'user_score must be a number between 0 and 10' });
        }
        newScore = parsedScore;
    }

    let newStatus = existing?.status ?? 'plan_to_watch';
    if (status !== undefined && status !== null) {
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `status must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }
        newStatus = status;
    }

    let newEpisodes = existing?.episodes_watched ?? 0;
    if (episodes_watched !== undefined && episodes_watched !== null) {
        const parsedEp = parseInt(episodes_watched, 10);
        if (!Number.isNaN(parsedEp) && parsedEp >= 0) {
            newEpisodes = Math.min(parsedEp, 100000);
        } else {
            newEpisodes = 0;
        }
    }

    let newNotes = existing?.notes ?? '';
    if (notes !== undefined && notes !== null) {
        newNotes = String(notes);
    }

    const resolvedGenres = genres !== undefined
        ? normalizeGenresInput(genres)
        : normalizeGenresInput(existing?.genres);

    const resolvedPoster = poster !== undefined && poster !== null
        ? String(poster).trim()
        : (existing?.poster || '');

    const resolvedSubtype = subtype !== undefined && subtype !== null
        ? String(subtype).trim()
        : (existing?.subtype || '');

    const resolvedYear = release_year !== undefined
        ? parseReleaseYear(release_year)
        : parseReleaseYear(existing?.release_year);

    const resolvedKitsuScore = kitsu_score !== undefined
        ? parseKitsuScore(kitsu_score)
        : parseKitsuScore(existing?.kitsu_score);

    const resolvedMetadataSynced = (genres !== undefined || kitsu_score !== undefined)
        ? 1
        : (existing?.metadata_synced ? 1 : 0);

    const stmt = db.prepare(`
        INSERT INTO user_library (
            id, title, user_score, status, episodes_watched, notes,
            kitsu_score, genres, poster, subtype, release_year, metadata_synced, created_at, updated_at
        )
        VALUES (
            @id, @title, @user_score, @status, @episodes_watched, @notes,
            @kitsu_score, @genres, @poster, @subtype, @release_year, @metadata_synced, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            user_score = excluded.user_score,
            status = excluded.status,
            episodes_watched = excluded.episodes_watched,
            notes = excluded.notes,
            kitsu_score = COALESCE(excluded.kitsu_score, user_library.kitsu_score),
            genres = excluded.genres,
            poster = excluded.poster,
            subtype = excluded.subtype,
            release_year = excluded.release_year,
            metadata_synced = MAX(user_library.metadata_synced, excluded.metadata_synced),
            updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({
        id,
        title: newTitle,
        user_score: newScore,
        status: newStatus,
        episodes_watched: newEpisodes,
        notes: newNotes,
        kitsu_score: resolvedKitsuScore,
        genres: JSON.stringify(resolvedGenres),
        poster: resolvedPoster,
        subtype: resolvedSubtype,
        release_year: resolvedYear,
        metadata_synced: resolvedMetadataSynced
    });

    const updated = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);
    res.status(200).json(formatLibraryRow(updated));
});

app.patch('/api/library/:id/metadata', (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Entry not found in user library' });
    }

    const { kitsu_score, genres, poster, subtype, release_year } = req.body || {};

    const resolvedKitsuScore = kitsu_score !== undefined
        ? parseKitsuScore(kitsu_score)
        : parseKitsuScore(existing.kitsu_score);

    const resolvedGenres = genres !== undefined
        ? normalizeGenresInput(genres)
        : normalizeGenresInput(existing.genres);

    const resolvedPoster = poster !== undefined && poster !== null
        ? String(poster).trim()
        : (existing.poster || '');

    const resolvedSubtype = subtype !== undefined && subtype !== null
        ? String(subtype).trim()
        : (existing.subtype || '');

    const resolvedYear = release_year !== undefined
        ? parseReleaseYear(release_year)
        : parseReleaseYear(existing.release_year);

    db.prepare(`
        UPDATE user_library
        SET kitsu_score = COALESCE(@kitsu_score, kitsu_score),
            genres = @genres,
            poster = @poster,
            subtype = @subtype,
            release_year = @release_year,
            metadata_synced = 1
        WHERE id = @id
    `).run({
        id,
        kitsu_score: resolvedKitsuScore,
        genres: JSON.stringify(resolvedGenres),
        poster: resolvedPoster,
        subtype: resolvedSubtype,
        release_year: resolvedYear
    });

    const updated = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);
    res.status(200).json(formatLibraryRow(updated));
});

app.delete('/api/library/:id', (req, res) => {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM user_library WHERE id = ?').run(id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Entry not found in user library' });
    }

    res.json({ success: true, message: `Anime ${id} removed from library` });
});

app.use((err, req, res, next) => {
    void next;
    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`AniLib Backend server is running on http://localhost:${PORT}`);
});

export default app;
