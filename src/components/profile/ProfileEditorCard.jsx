import { useState } from 'react';
import { useProfile } from '../../context/index.js';
import { useFeedback } from '../../hooks/index.js';
import './ProfileEditorCard.css';

const AVATAR_PRESETS = [
    { label: 'AniBot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib' },
    { label: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
    { label: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
    { label: 'Kuro', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kuro' },
    { label: 'Sakura', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sakura' },
    { label: 'Star', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Star' }
];

export function ProfileEditorCard() {
    const { profile, updateProfile } = useProfile();

    const [prevProfile, setPrevProfile] = useState(profile);
    const [username, setUsername] = useState(profile.username || '');
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [isDirty, setIsDirty] = useState(false);
    const [saveFeedback, showSaveFeedback] = useFeedback();
    const [isSaving, setIsSaving] = useState(false);

    if (prevProfile !== profile) {
        setPrevProfile(profile);
        if (!isDirty) {
            setUsername(profile.username || '');
            setAvatarUrl(profile.avatar_url || '');
            setBio(profile.bio || '');
        }
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const trimmedName = username.trim();
        if (!trimmedName) {
            showSaveFeedback("Ім'я користувача не може бути порожнім", true, false);
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                username: trimmedName,
                avatar_url: avatarUrl.trim(),
                bio: bio.trim()
            });
            setIsDirty(false);
            showSaveFeedback('✓ Профіль успішно збережено в базі даних!', false);
        } catch (err) {
            showSaveFeedback(
                err.message || 'Не вдалося зберегти профіль на сервері (перевірте npm run server)',
                true,
                false
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="Profile-user-card">
            <div className="Profile-avatar-preview-wrap">
                <img
                    src={avatarUrl || profile.avatar_url || AVATAR_PRESETS[0].url}
                    alt="Avatar"
                    className="Profile-avatar-preview"
                    onError={(e) => {
                        e.target.src = AVATAR_PRESETS[0].url;
                    }}
                />
                <div className="Profile-user-info-text">
                    <h2 className="Profile-username-display">{username || profile.username || 'Anime Fan'}</h2>
                    <p className="Profile-bio-display">{bio || profile.bio || 'Учасник спільноти AniLib'}</p>
                </div>
            </div>

            <form className="Profile-form" onSubmit={handleSaveProfile}>
                <h3 className="Profile-section-title">Налаштування профілю</h3>

                <div className="Profile-field">
                    <label htmlFor="profile-username" className="Profile-label">
                        Ім'я користувача:
                    </label>
                    <input
                        id="profile-username"
                        type="text"
                        className="Profile-input"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder="Ваш нікнейм..."
                        maxLength={30}
                        disabled={isSaving}
                    />
                </div>

                <div className="Profile-field">
                    <label className="Profile-label">
                        Оберіть аватарку з пресетів:
                    </label>
                    <div className="Profile-presets-list">
                        {AVATAR_PRESETS.map((preset) => (
                            <button
                                type="button"
                                key={preset.url}
                                className={`Profile-preset-btn ${avatarUrl === preset.url ? 'active' : ''}`}
                                onClick={() => {
                                    setAvatarUrl(preset.url);
                                    setIsDirty(true);
                                }}
                                title={preset.label}
                            >
                                <img src={preset.url} alt={preset.label} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="Profile-field">
                    <label htmlFor="profile-avatar-url" className="Profile-label">
                        Або вкажіть пряме посилання на аватарку (URL):
                    </label>
                    <input
                        id="profile-avatar-url"
                        type="url"
                        className="Profile-input"
                        value={avatarUrl}
                        onChange={(e) => {
                            setAvatarUrl(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder="https://example.com/avatar.jpg"
                        disabled={isSaving}
                    />
                </div>

                <div className="Profile-field">
                    <label htmlFor="profile-bio" className="Profile-label">
                        Про себе / Статус:
                    </label>
                    <textarea
                        id="profile-bio"
                        className="Profile-textarea"
                        rows="3"
                        value={bio}
                        onChange={(e) => {
                            setBio(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder="Розкажіть про свої улюблені жанри чи тайтли..."
                        maxLength={200}
                        disabled={isSaving}
                    />
                </div>

                <button
                    type="submit"
                    className="Profile-save-btn"
                    disabled={isSaving}
                >
                    {isSaving ? 'Збереження...' : 'Зберегти профіль'}
                </button>

                {saveFeedback && (
                    <div className={`Profile-feedback ${saveFeedback.isError ? 'error' : 'success'}`}>
                        {saveFeedback.message}
                    </div>
                )}
            </form>
        </div>
    );
}

export default ProfileEditorCard;
