import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Toggle from './components/Toggle';
import { RatingProvider, ProfileProvider, useProfile } from './context/index.js';
import { useDashboardStore, selectTheme, selectFavoritesCount } from './store/index.js';
import { DashboardPage, AnimeDetailPage, ProfilePage, NotFoundPage } from './pages/index.js';
import "./App.css";

function AppHeader() {
    const { profile } = useProfile();
    const favoritesCount = useDashboardStore(selectFavoritesCount);
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const isCatalog = location.pathname === '/';
    const isProfile = location.pathname === '/profile';
    const isFavoritesTab = isProfile && searchParams.get('tab') === 'favorites';

    return (
        <header className="app-header">
            <Link to="/" className="app-brand-link">
                <div className="app-brand">
                    <span className="brand-badge">AL</span>
                    <h1 className="brand-title">Ani<span>Lib</span></h1>
                    <span className="brand-subtitle">Аналітика та каталог аніме</span>
                </div>
            </Link>

            <div className="app-header-right">
                <nav className="app-nav">
                    <Link
                        to="/"
                        className={`app-nav-link ${isCatalog ? 'active' : ''}`}
                    >
                        Каталог
                    </Link>
                    <Link
                        to="/profile?tab=favorites"
                        className={`app-nav-link fav-nav-link ${isFavoritesTab ? 'active' : ''}`}
                        title="Перейти до обраних тайтлів у профілі"
                    >
                        <span className="fav-nav-heart" aria-hidden="true">♥</span>
                        <span>{favoritesCount}</span>
                    </Link>
                    <Link
                        to="/profile"
                        className={`app-nav-link profile-link ${isProfile && !isFavoritesTab ? 'active' : ''}`}
                    >
                        <img
                            src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib'}
                            alt={profile.username}
                            className="app-nav-avatar"
                            onError={(e) => {
                                e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib';
                            }}
                        />
                        <span className="app-nav-username">{profile.username || 'Профіль'}</span>
                    </Link>
                </nav>

                <Toggle />
            </div>
        </header>
    );
}

export function App() {
    const theme = useDashboardStore(selectTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <BrowserRouter>
            <div className={`app-theme-wrapper ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
                <RatingProvider>
                    <ProfileProvider>
                        <div className="app-container">
                            <AppHeader />

                            <main className="app-main">
                                <Routes>
                                    <Route path="/" element={<DashboardPage />} />
                                    <Route path="/anime/:id" element={<AnimeDetailPage />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </main>
                        </div>
                    </ProfileProvider>
                </RatingProvider>
            </div>
        </BrowserRouter>
    );
}

export default App;
