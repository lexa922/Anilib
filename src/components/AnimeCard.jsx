import { Link } from 'react-router-dom';
import { useRatings } from '../context/index.js';
import "./AnimeCard.css";

function AnimeCard({ anime }) {
    const { getRating } = useRatings();
    const userRating = getRating(anime.id);
    const posterUrl = anime.poster || anime.images?.jpg?.image_url;

    const statusMap = {
        current: 'Онґоїнґ',
        finished: 'Завершено',
        upcoming: 'Анонс',
        unreleased: 'Анонс'
    };
    const statusText = statusMap[(anime.status || '').toLowerCase()] || anime.status;

    return (
        <Link to={`/anime/${anime.id}`} className="Anime-card-link">
            <div className="Anime-card">
                {posterUrl && (
                    <img src={posterUrl} alt={anime.title} className="Anime-card-image" />
                )}
                <div className="Anime-card-content">
                    <h3 className="Anime-card-title">{anime.title}</h3>
                    <div className="Anime-card-meta">
                        {Boolean(anime.score) && (
                            <span className="Anime-card-score">★ {anime.score}</span>
                        )}
                        {userRating > 0 && (
                            <span className="Anime-card-user-rating" title="Ваша оцінка цього тайтлу">
                                ★ Ваша: {userRating}
                            </span>
                        )}
                        {Boolean(anime.year && anime.year > 0) && (
                            <span className="Anime-card-year">{anime.year}</span>
                        )}
                        {Boolean(statusText) && (
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
        </Link>
    );
}

export default AnimeCard;
