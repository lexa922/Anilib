import {useState} from 'react'

import {MOCK_KPI_DATA} from "../data/mockAnime.js";
import KpiCard from "./KpiCard.jsx";

import "../componentsStyles/CardSection.css"
import Toggle from "./Toggle.jsx";


function CardSection() {

    const [isDark, setIsDark] = useState(true);

    return (
        <div className={`Card-section-container ${isDark?'Dark-theme':'Light-theme'}`}>
            <div className='Theme-toggle-container'>
                <Toggle
                    isChecked={isDark}
                    onToggle={setIsDark}
                />
             </div>

            <div className={`Card-section ${isDark?'Dark-theme':'Light-theme'}`}>
                {MOCK_KPI_DATA.map((kpi) => (
                     <KpiCard
                        key={kpi.id}
                        title={kpi.title}
                        value={kpi.value}
                        change={kpi.change}
                    />
                ))}
            </div>
    </div>
   )
}
export default CardSection;