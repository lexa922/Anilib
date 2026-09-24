import "../componentsStyles/AnimeCard.css"

import RatingCounter from "../components/RatingCounter"

function AnimeCard({anime}) {

    return(
        <div className="Anime-card">
            <img src={anime.images.jpg.image_url} alt={anime.title} className="Anime-card-image" />
            <div className="Anime-card-content">
                <h3 className="Anime-card-title">{anime.title}</h3>
                <h4>Жанри:</h4>
                <div>
                    {anime.genres.map((genre)=> <span className='Anime-genre' key={genre.mal_id}>{genre.name} </span>)}
                </div>
            </div>
            <RatingCounter/>
        </div>
    )
}

export default AnimeCard;