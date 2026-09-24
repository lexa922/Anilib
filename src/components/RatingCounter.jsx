import "../componentsStyles/RatingCounter.css"

import {useState} from "react";

function RatingCounter(){
    const [value, setValue] = useState(0);

    function handlePositiveRatingChange(){
        if(value < 10){
            setValue(v=> v + 1)
            return;
        }
        alert("Рейтинг не може бути більше 10")
    }
    function handleNegativeRatingChange(){
        if(value !== 0){
            setValue(v=> v - 1)
            return;
        }
        alert("Рейтинг не може бути менше 0")
    }

    return(
        <div className='Anime-rating'>
            <p>Ваша оцінка:</p>
            <span>{value}</span>
            <div className='Anime-rating-controls'>
                <button className="Control-button" onClick={handlePositiveRatingChange}>+</button>
                <button className="Control-button" onClick={()=>setValue(0)}>reset</button>
                <button className="Control-button" onClick={handleNegativeRatingChange}>-</button>
            </div>
        </div>
    )
}

export default RatingCounter;