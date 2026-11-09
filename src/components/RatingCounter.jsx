import { useState } from "react";
import "./RatingCounter.css";

function RatingCounter({ value = 0, onSave, onChange }) {
    const [prevValue, setPrevValue] = useState(value);
    const [draftValue, setDraftValue] = useState(value);
    const [justSaved, setJustSaved] = useState(false);

    if (prevValue !== value) {
        setPrevValue(value);
        setDraftValue(value);
        setJustSaved(false);
    }

    const hasChanged = draftValue !== value;

    function handlePositiveRatingChange() {
        if (draftValue < 10) {
            setDraftValue((v) => v + 1);
            setJustSaved(false);
            return;
        }
        alert("Рейтинг не може бути більше 10");
    }

    function handleNegativeRatingChange() {
        if (draftValue > 0) {
            setDraftValue((v) => v - 1);
            setJustSaved(false);
            return;
        }
        alert("Рейтинг не може бути менше 0");
    }

    function handleReset() {
        setDraftValue(0);
        setJustSaved(false);
    }

    function handleConfirm() {
        if (onSave) {
            onSave(draftValue);
        } else if (onChange) {
            onChange(draftValue);
        }
        setJustSaved(true);
    }

    return (
        <div className="Anime-rating-widget">
            <div className="Anime-rating">
                <p>Ваша оцінка:</p>
                <span className="Anime-rating-score">{draftValue}</span>
                <div className="Anime-rating-controls">
                    <button type="button" className="Control-button" onClick={handlePositiveRatingChange} title="Збільшити">+</button>
                    <button type="button" className="Control-button" onClick={handleReset} title="Скинути на 0">reset</button>
                    <button type="button" className="Control-button" onClick={handleNegativeRatingChange} title="Зменшити">-</button>
                </div>
            </div>

            <div className="Anime-rating-action-row">
                <button
                    type="button"
                    className="Anime-rating-submit-btn"
                    disabled={!hasChanged}
                    onClick={handleConfirm}
                >
                    {value > 0 && draftValue === 0 ? 'Зняти оцінку' : 'Підтвердити'}
                </button>
                {justSaved && !hasChanged && (
                    <span className="Anime-rating-saved-msg">✓ Збережено</span>
                )}
            </div>
        </div>
    );
}

export default RatingCounter;
