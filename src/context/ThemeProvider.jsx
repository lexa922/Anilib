import { useState, useEffect, useMemo } from 'react';
import { ThemeContext } from './ThemeContext.js';

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('anilib_theme');
        if (saved !== null) {
            return saved === 'dark';
        }
        return true;
    });

    const theme = isDark ? 'dark' : 'light';

    useEffect(() => {
        localStorage.setItem('anilib_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setIsDark((prev) => !prev);
    };

    const value = useMemo(() => ({
        isDark,
        theme,
        toggleTheme,
        setIsDark
    }), [isDark, theme]);

    return (
        <ThemeContext.Provider value={value}>
            <div className={`app-theme-wrapper ${isDark ? 'dark-theme' : 'light-theme'}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;
