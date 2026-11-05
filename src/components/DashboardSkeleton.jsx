import AnimeListSkeleton from './AnimeListSkeleton.jsx';
import './DashboardSkeleton.css';

function DashboardSkeleton() {
    return (
        <div className="dashboard-skeleton" aria-busy="true" aria-label="Завантаження дашборду">
            <div className="kpi-section-skeleton">
                <div className="kpi-card-skeleton skeleton-shimmer" />
                <div className="kpi-card-skeleton skeleton-shimmer" />
                <div className="kpi-card-skeleton skeleton-shimmer" />
            </div>

            <div className="dashboard-main-skeleton">
                <div className="anime-section-skeleton">
                    <div className="results-header-skeleton skeleton-shimmer" />
                    <AnimeListSkeleton count={12} />
                </div>
                <div className="filter-sidebar-skeleton skeleton-shimmer" />
            </div>
        </div>
    );
}

export default DashboardSkeleton;
