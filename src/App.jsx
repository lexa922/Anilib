import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Toggle from './components/Toggle';
import { ThemeProvider, RatingProvider } from './context/index.js';
import { DashboardPage, AnimeDetailPage, NotFoundPage } from './pages/index.js';
import "./App.css";

export function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <RatingProvider>
                    <div className="app-container">
                        <header className="app-header">
                            <Link to="/" className="app-brand-link">
                                <div className="app-brand">
                                    <span className="brand-badge">AL</span>
                                    <h1 className="brand-title">Ani<span>Lib</span></h1>
                                    <span className="brand-subtitle">Аналітика та каталог аніме</span>
                                </div>
                            </Link>
                            <Toggle />
                        </header>

                        <main className="app-main">
                            <Routes>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/anime/:id" element={<AnimeDetailPage />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </main>
                    </div>
                </RatingProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
