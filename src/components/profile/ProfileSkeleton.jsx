import { Link } from 'react-router-dom';
import './ProfileSkeleton.css';

export function ProfileSkeleton() {
    return (
        <div className="Profile-page" aria-busy="true" aria-label="Завантаження профілю">
            <div className="Profile-nav">
                <button type="button" className="Profile-back-btn" disabled>
                    ← Назад
                </button>
                <div className="Profile-breadcrumbs">
                    <Link to="/">Головна</Link>
                    <span>/</span>
                    <span>Завантаження кабінету...</span>
                </div>
            </div>

            <div className="Profile-skeleton-layout">
                <div className="Profile-skeleton-user-card">
                    <div className="Skeleton-avatar-row">
                        <div className="Skeleton-avatar" />
                        <div className="Skeleton-user-lines">
                            <div className="Skeleton-line title" />
                            <div className="Skeleton-line sub" />
                        </div>
                    </div>

                    <div className="Skeleton-form-group">
                        <div className="Skeleton-line label" />
                        <div className="Skeleton-input" />
                    </div>

                    <div className="Skeleton-form-group">
                        <div className="Skeleton-line label" />
                        <div className="Skeleton-presets-row">
                            <div className="Skeleton-preset-circle" />
                            <div className="Skeleton-preset-circle" />
                            <div className="Skeleton-preset-circle" />
                            <div className="Skeleton-preset-circle" />
                            <div className="Skeleton-preset-circle" />
                        </div>
                    </div>

                    <div className="Skeleton-form-group">
                        <div className="Skeleton-line label" />
                        <div className="Skeleton-textarea" />
                    </div>

                    <div className="Skeleton-btn" />
                </div>

                <div className="Profile-skeleton-content">
                    <div className="Profile-skeleton-kpis-box">
                        <div className="Skeleton-line header-title" />
                        <div className="Skeleton-line header-sub" />
                        <div className="Skeleton-kpis-grid">
                            <div className="Skeleton-kpi-card" />
                            <div className="Skeleton-kpi-card" />
                            <div className="Skeleton-kpi-card" />
                            <div className="Skeleton-kpi-card" />
                        </div>
                    </div>

                    <div className="Profile-skeleton-library-box">
                        <div className="Skeleton-library-header-row">
                            <div className="Skeleton-line header-title" />
                            <div className="Skeleton-tabs-row">
                                <div className="Skeleton-tab" />
                                <div className="Skeleton-tab" />
                                <div className="Skeleton-tab" />
                            </div>
                        </div>

                        <div className="Skeleton-library-rows">
                            <div className="Skeleton-library-row" />
                            <div className="Skeleton-library-row" />
                            <div className="Skeleton-library-row" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileSkeleton;
