import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return typeof this.props.fallback === 'function'
                    ? this.props.fallback({ error: this.state.error, reset: this.handleRetry })
                    : this.props.fallback;
            }

            return (
                <div className="error-boundary-container">
                    <h3 className="error-boundary-title">Виникла помилка завантаження</h3>
                    <p className="error-boundary-message">
                        {this.state.error?.message || 'Не вдалося отримати дані з сервера.'}
                    </p>
                    <button className="error-boundary-retry-button" onClick={this.handleRetry}>
                        Спробувати знову
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
