import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DocsPage from './DocsPage';
import { getStoredTheme, setStoredTheme, type Theme } from './theme';
import './index.css';

function DocsEnApp() {
  // 初始化时就使用存储的主题，避免闪烁
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const lang = 'en'; // 固定为英文

  const handleLangToggle = () => {
    // 英文页面不需要切换语言
  };

  const handleThemeToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
  };

  return (
    <DocsPage
      theme={theme}
      lang={lang}
      onThemeToggle={handleThemeToggle}
      onLangToggle={handleLangToggle}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DocsEnApp />
  </StrictMode>,
);
