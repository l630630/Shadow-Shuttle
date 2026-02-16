import { useState } from 'react';
import LandingPage from './LandingPage';
import { getStoredTheme, setStoredTheme, type Theme } from './theme';

const LANG_KEY = 'shadow-shuttle-lang';

function getStoredLang(): 'zh' | 'en' {
  if (typeof window === 'undefined') return 'zh';
  return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh';
}

function App() {
  // 初始化时就使用存储的主题，避免闪烁
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const [lang, setLang] = useState<'zh' | 'en'>(getStoredLang());

  const handleLangToggle = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
  };

  const handleThemeToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
  };

  return (
    <LandingPage
      theme={theme}
      lang={lang}
      onThemeToggle={handleThemeToggle}
      onLangToggle={handleLangToggle}
    />
  );
}

export default App;
