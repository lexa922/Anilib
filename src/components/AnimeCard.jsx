import "./AnimeCard.css";

function AnimeCard({ anime }) {
    const posterUrl = anime.poster || anime.images?.jpg?.image_url;

    const statusMap = {
        current: 'Онґоїнґ',
        finished: 'Завершено',
        upcoming: 'Анонс',
        unreleased: 'Анонс'
    };
    const statusText = statusMap[(anime.status || '').toLowerCase()] || anime.status;

    return (
        <div className="Anime-card">
            {posterUrl && (
                <img src={posterUrl} alt={anime.title} className="Anime-card-image" />
            )}
            <div className="Anime-card-content">
                <h3 className="Anime-card-title">{anime.title}</h3>
                <div className="Anime-card-meta">
                    {anime.score && (
                        <span className="Anime-card-score">★ {anime.score}</span>
                    )}
                    {anime.year && (
                        <span className="Anime-card-year">{anime.year}</span>
                    )}
                    {statusText && (
                        <span className={`Anime-card-badge status-${(anime.status || '').toLowerCase()}`}>
                            {statusText}
                        </span>
                    )}
                </div>
                <h4>Жанри:</h4>
                <div className="Anime-genres-list">
                    {anime.genres?.map((genre, idx) => {
                        const name = typeof genre === 'string' ? genre : genre.name;
                        const key = typeof genre === 'object' ? (genre.id || genre.mal_id || name) : `${name}-${idx}`;
                        return (
                            <span className="Anime-genre" key={key}>
                                {name}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default AnimeCard;
