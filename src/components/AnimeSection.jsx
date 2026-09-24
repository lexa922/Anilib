import "../componentsStyles/AnimeSection.css"

import AnimeCard from '../components/AnimeCard';

import {useState} from "react";

import {MOCK_ANIME_LIST} from "../data/mockAnime.js";
import {MOCK_GENRES} from "../data/mockAnime.js";



function AnimeSection(){

    const [selectedGenre, setSelectedGenre] = useState('Всі');

    const filteredAnime = selectedGenre === 'Всі'
        ? MOCK_ANIME_LIST
        : MOCK_ANIME_LIST.filter((anime) =>
            anime.genres.some((g) => g.name === selectedGenre)
        );

    return (
        <div className='Anime-section'>
            <div className='Anime-list-section'>
                {filteredAnime.map((anime)=>
                    <AnimeCard anime={anime} key={anime.mal_id}/>
                )}
            </div>

            <div className='Anime-filter-section'>
                <div className='Anime-filter-body'>
                    <select className='Anime-filter-select' onChange={(e)=>setSelectedGenre(e.target.value)}>
                        {MOCK_GENRES.map((genre)=>
                            <option value={genre} key={genre}>{genre}</option>)}
                    </select>
                </div>
            </div>
        </div>
    )
}
export default AnimeSection;