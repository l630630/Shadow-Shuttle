import React, { useState, useEffect } from 'react';
import { content, type Lang } from './i18n';
import { type Theme } from './theme';
import { Logo } from './components/Logo';

const GITHUB_REPO = 'https://github.com/l630630/Shadow-Shuttle';

// 获取正确的路径（支持 GitHub Pages）
const getPath = (path: string) => {
  const base = import.meta.env.BASE_URL || '/';
  return base + path.replace(/^\//, '');
};

interface DocsPageProps {
  theme: Theme;
  lang: Lang;
  onThemeToggle: () => void;
  onLangToggle: () => void;
}

const DocsPage: React.FC<DocsPageProps> = ({
  theme,
  lang,
  onThemeToggle,
}) => {
  const t = content[lang];
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['intro', 'local-setup', 'remote-setup', 'features', 'security', 'arch'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'intro', label: lang === 'zh' ? '起步' : 'Introduction' },
    { id: 'local-setup', label: lang === 'zh' ? '本地部署' : 'Local Deployment' },
    { id: 'remote-setup', label: lang === 'zh' ? '跨网部署' : 'Remote Deployment' },
    { id: 'features', label: lang === 'zh' ? '核心功能' : 'Core Features' },
    { id: 'security', label: lang === 'zh' ? '安全特性' : 'Security' },
    { id: 'arch', label: lang === 'zh' ? '系统架构' : 'Architecture' },
  ];

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 z-50 w-full border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3 group">
              <div className="transition-transform group-hover:scale-110">
                <Logo theme={theme} size={32} showGlow={true} />
              </div>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
                shadow-shuttle
              </span>
            </a>
            <div className="hidden md:flex items-center gap-6">
              <a
                href={getPath('')}
                className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {lang === 'zh' ? '首页' : 'Home'}
              </a>
              <a
                href={getPath(lang === 'zh' ? 'docs.html' : 'docs-en.html')}
                className={`text-sm font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}
              >
                {lang === 'zh' ? '中文文档' : 'Documentation'}
              </a>
              <a
                href={getPath(lang === 'zh' ? 'docs-en.html' : 'docs.html')}
                className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {lang === 'zh' ? 'English Documentation' : '中文文档'}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onThemeToggle}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-14">
        {/* Left Sidebar */}
        <aside className={`hidden lg:block fixed left-0 top-14 bottom-0 w-64 overflow-y-auto border-r ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="p-6">
            <div className="mb-6">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                {lang === 'zh' ? '文档' : 'Documentation'}
              </h3>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block px-3 py-2 text-sm rounded-md transition-all ${
                      activeSection === item.id
                        ? theme === 'dark'
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium border-l-2 border-emerald-400 pl-[10px]'
                          : 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-600 pl-[10px]'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                {lang === 'zh' ? '外部文档' : 'External Docs'}
              </h3>
              <nav className="space-y-1">
                <a
                  href="/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  {lang === 'zh' ? '项目 README' : 'Project README'}
                </a>
                <a
                  href="/QUICK_START.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  {lang === 'zh' ? '快速开始指南' : 'Quick Start Guide'}
                </a>
                <a
                  href="/docs/CROSS_NETWORK_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  {lang === 'zh' ? '跨网访问设置' : 'Cross-Network Setup'}
                </a>
                <a
                  href="/DEPLOYMENT.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  {lang === 'zh' ? '部署文档' : 'Deployment Guide'}
                </a>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 xl:mr-64">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className={`text-4xl font-bold mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {lang === 'zh' ? '起步' : 'Getting Started'}
            </h1>

            {/* Introduction */}
            <section id="intro" className="mb-16 scroll-mt-20">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'text-white border-slate-800' : 'text-gray-900 border-gray-200'}`}>
                {t.docs.intro.title}
              </h2>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <p className={`text-base leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t.docs.intro.body}
                </p>
              </div>
            </section>

            {/* Local Setup */}
            <section id="local-setup" className="mb-16 scroll-mt-20">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'text-white border-slate-800' : 'text-gray-900 border-gray-200'}`}>
                {t.docs.localSetup.title}
              </h2>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <p className={`text-base leading-relaxed whitespace-pre-line mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t.docs.localSetup.steps}
                </p>
                <a
                  href="/QUICK_START.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                >
                  查看详细指南
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </section>

            {/* Remote Setup */}
            <section id="remote-setup" className="mb-16 scroll-mt-20">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'text-white border-slate-800' : 'text-gray-900 border-gray-200'}`}>
                {t.docs.remoteSetup.title}
              </h2>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <p className={`text-base leading-relaxed whitespace-pre-line mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t.docs.remoteSetup.steps}
                </p>
                <a
                  href="/docs/CROSS_NETWORK_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                >
                  查看详细指南
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="mb-16 scroll-mt-20">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'text-white border-slate-800' : 'text-gray-900 border-gray-200'}`}>
                {t.docs.features.title}
              </h2>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <p className={`text-base leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t.docs.features.list}
                </p>
              </div>
            </section>

            {/* Security */}
            <section id="security" className="mb-16 scroll-mt-20">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'text-white border-slate-800' : 'text-gray-900 border-gray-200'}`}>
                {t.docs.security.title}
              </h2>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <p className={`text-base leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t.docs.security.list}
                </p>
              </div>
            </section>

            {/* Architecture */}
            <section id="arch" className="mb-16 scroll-mt-20">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'text-white border-slate-800' : 'text-gray-900 border-gray-200'}`}>
                {t.docs.arch.title}
              </h2>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                <pre className={`text-sm leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-800'}`}>
                  {t.docs.arch.body}
                </pre>
              </div>
            </section>
          </div>
        </main>

        {/* Right Sidebar - On This Page */}
        <aside className={`hidden xl:block fixed right-0 top-14 bottom-0 w-64 overflow-y-auto border-l ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="p-6">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
              {lang === 'zh' ? '本页内容' : 'On This Page'}
            </h3>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-sm py-1 transition-all ${
                    activeSection === item.id
                      ? theme === 'dark'
                        ? 'text-emerald-400 font-medium border-l-2 border-emerald-400 pl-2'
                        : 'text-emerald-700 font-medium border-l-2 border-emerald-600 pl-2'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:text-white pl-2'
                      : 'text-gray-600 hover:text-gray-900 pl-2'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocsPage;
