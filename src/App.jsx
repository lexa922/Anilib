import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Toggle from './components/Toggle';
import { ThemeProvider, RatingProvider, ProfileProvider, useProfile } from './context/index.js';
import { DashboardPage, AnimeDetailPage, ProfilePage, NotFoundPage } from './pages/index.js';
import "./App.css";

function AppHeader() {
    const { profile } = useProfile();
    const location = useLocation();

    const isCatalog = location.pathname === '/';
    const isProfile = location.pathname === '/profile';

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
                        to="/profile"
                        className={`app-nav-link profile-link ${isProfile ? 'active' : ''}`}
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
    return (
        <BrowserRouter>
            <ThemeProvider>
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
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
