import { useState } from "react";
import "./RatingCounter.css";

function RatingCounter({
    value = 0,
    onChange,
    onSave,
    showSubmitButton = false,
    showLabel = false
}) {
    const [prevValue, setPrevValue] = useState(value);
    const [draftValue, setDraftValue] = useState(value);
    const [justSaved, setJustSaved] = useState(false);

    if (prevValue !== value) {
        setPrevValue(value);
        setDraftValue(value);
        setJustSaved(false);
    }

    const hasChanged = draftValue !== value;

    function updateValue(newVal) {
        setDraftValue(newVal);
        setJustSaved(false);
        if (onChange) {
            onChange(newVal);
        }
        if (!showSubmitButton && onSave) {
            onSave(newVal);
        }
    }

    function handlePositiveRatingChange() {
        if (draftValue < 10) {
            updateValue(draftValue + 1);
        }
    }

    function handleNegativeRatingChange() {
        if (draftValue > 0) {
            updateValue(draftValue - 1);
        }
    }

    function handleReset() {
        updateValue(0);
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
                {showLabel && <span className="Anime-rating-label">Оцінка:</span>}
                <div className="Anime-rating-score-badge">
                    <span className="Anime-rating-star">★</span>
                    <span className="Anime-rating-score">
                        {draftValue > 0 ? `${draftValue}/10` : '—'}
                    </span>
                </div>
                <div className="Anime-rating-controls">
                    <button
                        type="button"
                        className="Control-button step-btn"
                        onClick={handleNegativeRatingChange}
                        disabled={draftValue <= 0}
                        title="Зменшити оцінку"
                    >
                        −
                    </button>
                    <button
                        type="button"
                        className="Control-button step-btn"
                        onClick={handlePositiveRatingChange}
                        disabled={draftValue >= 10}
                        title="Збільшити оцінку"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        className="Control-button reset-btn"
                        onClick={handleReset}
                        disabled={draftValue === 0}
                        title="Скинути оцінку на 0"
                    >
                        Скинути
                    </button>
                </div>
            </div>

            {showSubmitButton && (
                <div className="Anime-rating-action-row">
                    <button
                        type="button"
                        className="Anime-rating-submit-btn"
                        disabled={!hasChanged}
                        onClick={handleConfirm}
                    >
                        {value > 0 && draftValue === 0 ? 'Зняти оцінку' : 'Підтвердити оцінку'}
                    </button>
                    {justSaved && !hasChanged && (
                        <span className="Anime-rating-saved-msg">✓ Збережено</span>
                    )}
                </div>
            )}
        </div>
    );
}

export default RatingCounter;
