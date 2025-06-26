import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Carrega o tema do localStorage ou usa 'light' como padrão
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe de tema
    if (newTheme === 'dark') {
      root.classList.add('dark');
    }
    
    // Salva no localStorage
    localStorage.setItem('theme', newTheme);
    
    // Atualiza o estado
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  };

  // Aplica o tema inicial quando o hook é montado
  useEffect(() => {
    applyTheme(theme);
  }, []);

  return {
    theme,
    setTheme: applyTheme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  };
};