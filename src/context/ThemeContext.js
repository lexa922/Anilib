import { createContext } from 'react';

export const ThemeContext = createContext({
    isDark: true,
    theme: 'dark',
    toggleTheme: () => {},
    setIsDark: () => {}
});
