import './AnimeListSkeleton.css';

export function AnimeCardSkeleton() {
    return (
        <div className="Anime-card-skeleton" aria-hidden="true">
            <div className="skeleton-poster skeleton-shimmer" />
            <div className="skeleton-title-1 skeleton-shimmer" />
            <div className="skeleton-title-2 skeleton-shimmer" />
            <div className="skeleton-meta">
                <div className="skeleton-badge-score skeleton-shimmer" />
                <div className="skeleton-badge-year skeleton-shimmer" />
            </div>
            <div className="skeleton-label skeleton-shimmer" />
            <div className="skeleton-genres">
                <div className="skeleton-genre-1 skeleton-shimmer" />
                <div className="skeleton-genre-2 skeleton-shimmer" />
                <div className="skeleton-genre-3 skeleton-shimmer" />
            </div>
        </div>
    );
}

function AnimeListSkeleton({ count = 12 }) {
    const items = Array.from({ length: count }, (_, idx) => idx);

    return (
        <div className="Anime-list-section" aria-busy="true" aria-label="Завантаження списку тайтлів">
            {items.map((key) => (
                <AnimeCardSkeleton key={key} />
            ))}
        </div>
    );
}

export default AnimeListSkeleton;
