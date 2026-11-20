import { Link } from 'react-router-dom';
import './AnimeDetailSkeleton.css';

export function AnimeDetailSkeleton({ onBack }) {
    return (
        <div className="Anime-detail-container">
            <div className="Anime-detail-nav">
                <button type="button" className="Anime-detail-back-btn" onClick={onBack}>
                    ← Назад
                </button>
                <div className="Anime-detail-breadcrumbs">
                    <Link to="/">Головна</Link>
                    <span>/</span>
                    <span>Завантаження...</span>
                </div>
            </div>

            <div className="Anime-detail-loading-skeleton">
                <div className="Detail-skeleton-banner" />
                <div className="Detail-skeleton-content">
                    <div className="Detail-skeleton-poster" />
                    <div className="Detail-skeleton-info">
                        <div className="Detail-skeleton-line title" />
                        <div className="Detail-skeleton-line meta" />
                        <div className="Detail-skeleton-line text" />
                        <div className="Detail-skeleton-line text" />
                        <div className="Detail-skeleton-line text short" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnimeDetailSkeleton;
