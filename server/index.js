import express from 'express';
import db from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Basic CORS header support for local testing/development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const VALID_STATUSES = ['watching', 'completed', 'dropped', 'plan_to_watch'];

// GET /api/library: Returns all saved entries sorted by updated_at DESC
app.get('/api/library', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM user_library ORDER BY updated_at DESC').all();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching library:', err);
        res.status(500).json({ error: 'Failed to fetch library entries' });
    }
});

// GET /api/stats: Computes aggregates directly via SQL
app.get('/api/stats', (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT
                (SELECT COUNT(*) FROM user_library WHERE status = 'completed') AS completedCount,
                (SELECT COALESCE(ROUND(AVG(user_score), 2), 0) FROM user_library WHERE user_score > 0) AS averageScore,
                (SELECT COALESCE(SUM(episodes_watched), 0) FROM user_library) AS totalEpisodesWatched,
                (SELECT COUNT(*) FROM user_library) AS totalCount
        `).get();
        res.json(stats);
    } catch (err) {
        console.error('Error calculating library stats:', err);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

// GET /api/profile: Returns current user profile
app.get('/api/profile', (req, res) => {
    try {
        let profile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default');
        if (!profile) {
            db.prepare(`
                INSERT INTO user_profile (id, username, avatar_url, bio)
                VALUES ('default', 'Anime Fan', 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib', 'Любитель аніме та якісної аналітики')
            `).run();
            profile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default');
        }
        res.json(profile);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// POST /api/profile: Updates current user profile
app.post('/api/profile', (req, res) => {
    try {
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
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

// GET /api/library/:id: Returns single entry by anime ID (or 404 if not in library)
app.get('/api/library/:id', (req, res) => {
    try {
        const { id } = req.params;
        const entry = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found in user library' });
        }
        res.json(entry);
    } catch (err) {
        console.error('Error fetching library entry:', err);
        res.status(500).json({ error: 'Failed to fetch library entry' });
    }
});

// POST /api/library/:id: Upsert entry (id, title, user_score, status, episodes_watched, notes)
app.post('/api/library/:id', (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            user_score,
            status,
            episodes_watched,
            notes
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

        const stmt = db.prepare(`
            INSERT INTO user_library (id, title, user_score, status, episodes_watched, notes, updated_at)
            VALUES (@id, @title, @user_score, @status, @episodes_watched, @notes, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                user_score = excluded.user_score,
                status = excluded.status,
                episodes_watched = excluded.episodes_watched,
                notes = excluded.notes,
                updated_at = CURRENT_TIMESTAMP
        `);

        stmt.run({
            id,
            title: newTitle,
            user_score: newScore,
            status: newStatus,
            episodes_watched: newEpisodes,
            notes: newNotes
        });

        const updated = db.prepare('SELECT * FROM user_library WHERE id = ?').get(id);
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error upserting library entry:', err);
        res.status(500).json({ error: 'Failed to save entry to library' });
    }
});

// DELETE /api/library/:id: Removes record from user's database
app.delete('/api/library/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM user_library WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Entry not found in user library' });
        }

        res.json({ success: true, message: `Anime ${id} removed from library` });
    } catch (err) {
        console.error('Error deleting library entry:', err);
        res.status(500).json({ error: 'Failed to delete library entry' });
    }
});

app.listen(PORT, () => {
    console.log(`AniLib Backend server is running on http://localhost:${PORT}`);
});

export default app;
