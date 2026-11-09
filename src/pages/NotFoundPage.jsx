import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export function NotFoundPage() {
    return (
        <div className="NotFound-page">
            <div className="NotFound-card">
                <span className="NotFound-badge">404</span>
                <h1 className="NotFound-title">Сторінку не знайдено</h1>
                <p className="NotFound-desc">
                    Сторінка, яку ви шукаєте, не існує, була переміщена або видалена.
                </p>
                <Link to="/" className="NotFound-btn">
                    ← Повернутися до каталогу
                </Link>
            </div>
        </div>
    );
}

export default NotFoundPage;
