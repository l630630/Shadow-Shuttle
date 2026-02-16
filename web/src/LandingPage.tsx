import React from 'react';
import { content, type Lang } from './i18n';
import { themeClasses, type Theme } from './theme';
import { Logo } from './components/Logo';

const GITHUB_REPO = 'https://github.com/l630630/Shadow-Shuttle';

// 获取正确的路径（支持 GitHub Pages）
const getPath = (path: string) => {
  const base = import.meta.env.BASE_URL || '/';
  return base + path.replace(/^\//, '');
};

interface LandingPageProps {
  theme: Theme;
  lang: Lang;
  onThemeToggle: () => void;
  onLangToggle: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  lang,
  onThemeToggle,
}) => {
  const t = content[lang];
  const c = themeClasses[theme];

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans selection:bg-primary/30 ${c.page}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 z-50 w-full border-b ${theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200'} backdrop-blur-sm`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo theme={theme} size={32} showGlow={true} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
              shadow-shuttle
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              首页
            </a>
            <a
              href={getPath('docs.html')}
              className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              中文文档
            </a>
            <a
              href={getPath('docs-en.html')}
              className={`text-sm transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              English Documentation
            </a>
            <button
              onClick={onThemeToggle}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[18px]">
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px]"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className={`mb-6 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:scale-105 ${c.badge}`}>
            <span className="mr-2 flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t.hero.badge}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 leading-tight">
            {theme === 'light' ? (
              <span className="text-slate-900">
                {t.hero.title}
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {t.hero.titleHighlight}
                </span>
              </span>
            ) : (
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {t.hero.title}
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {t.hero.titleHighlight}
                </span>
              </span>
            )}
          </h1>
          <p className={`mx-auto max-w-2xl text-lg sm:text-xl mb-10 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.hero.desc}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={getPath(lang === 'zh' ? 'docs.html' : 'docs-en.html')}
              className="group h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 flex items-center gap-2"
            >
              {t.hero.cta}
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </a>
            <a
              href={getPath(lang === 'zh' ? 'docs.html' : 'docs-en.html')}
              className={`group h-14 rounded-full border-2 px-8 text-base font-medium flex items-center gap-2 transition-all hover:scale-105 ${c.btnSecondary}`}
            >
              {t.hero.viewCode}
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </a>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-3xl mx-auto">
            {[
              { label: lang === 'zh' ? '开源免费' : 'Open Source', icon: 'favorite' },
              { label: lang === 'zh' ? '跨平台' : 'Cross-Platform', icon: 'devices' },
              { label: lang === 'zh' ? '安全加密' : 'Encrypted', icon: 'lock' },
              { label: lang === 'zh' ? '5分钟部署' : '5-Min Setup', icon: 'speed' },
            ].map((stat, idx) => (
              <div key={idx} className={`rounded-xl border p-4 backdrop-blur-sm transition-all hover:scale-105 ${c.card}`}>
                <span className="material-symbols-outlined text-primary text-2xl mb-2 block">{stat.icon}</span>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={`py-24 ${c.sectionAlt}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {lang === 'zh' ? '核心特性' : 'Core Features'}
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {lang === 'zh' ? '为现代化远程访问而设计，提供企业级安全与消费级体验' : 'Designed for modern remote access with enterprise security and consumer experience'}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, idx) => {
              const colors = [
                'from-blue-500 to-blue-600',
                'from-purple-500 to-purple-600',
                'from-emerald-500 to-emerald-600',
                'from-orange-500 to-orange-600',
                'from-pink-500 to-pink-600',
                'from-cyan-500 to-cyan-600',
              ];
              const gradientClass = colors[idx % colors.length];
              return (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border p-8 transition-all hover:shadow-2xl hover:-translate-y-1 ${c.card}`}
                >
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className={`mb-3 text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`leading-relaxed ${c.cardDesc}`}>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Start / Code Section */}
      <section className={`py-24 border-y ${theme === 'dark' ? 'border-white/5 bg-gradient-to-b from-slate-900 to-slate-800' : 'border-slate-200 bg-gradient-to-b from-slate-50 to-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center lg:flex-row lg:gap-16">
            <div className="flex-1 text-center lg:text-left mb-10 lg:mb-0">
              <h2 className={`text-4xl font-bold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t.quickStart.title}
              </h2>
              <p className={`text-lg mb-8 leading-relaxed ${c.cardDesc}`}>{t.quickStart.desc}</p>
              <div className="flex flex-col gap-4">
                <div className={`flex items-start gap-3 text-base ${c.cardDesc}`}>
                  <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                  <span>{t.quickStart.check1}</span>
                </div>
                <div className={`flex items-start gap-3 text-base ${c.cardDesc}`}>
                  <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                  <span>{t.quickStart.check2}</span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-2xl flex-1">
              <div className={`rounded-2xl border shadow-2xl overflow-hidden ${c.codeBlock}`}>
                <div className={`flex items-center justify-between px-5 py-3 border-b ${c.codeHeader}`}>
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-red-500"></div>
                    <div className="size-3 rounded-full bg-yellow-500"></div>
                    <div className="size-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs font-mono opacity-60">Terminal</span>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className={`font-mono text-sm leading-loose whitespace-pre ${c.codeText}`}>
                    {t.quickStart.code}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className={`py-24 ${c.page}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.useCases.title}
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {lang === 'zh' ? '适用于各种远程访问场景，从个人到企业' : 'Suitable for various remote access scenarios, from personal to enterprise'}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {t.useCases.items.map((useCase, idx) => (
              <div
                key={idx}
                className={`group rounded-2xl border p-8 transition-all hover:shadow-xl hover:-translate-y-1 ${c.card}`}
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg">
                  <span className="material-symbols-outlined text-white text-2xl">{useCase.icon}</span>
                </div>
                <h3 className={`mb-3 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {useCase.title}
                </h3>
                <p className={`leading-relaxed ${c.cardDesc}`}>{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-24 relative overflow-hidden ${c.sectionAlt}`}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]"></div>
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-4xl font-bold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {lang === 'zh' ? '准备好开始了吗？' : 'Ready to Get Started?'}
          </h2>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${c.cardDesc}`}>
            {lang === 'zh' ? '查看完整文档，了解如何部署和使用 Shadow Shuttle。5 分钟即可完成部署。' : 'Check out the full documentation to learn how to deploy and use Shadow Shuttle. Deploy in 5 minutes.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={getPath('docs.html')}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40"
            >
              <span className="material-symbols-outlined text-[24px]">description</span>
              {lang === 'zh' ? '查看文档' : 'View Documentation'}
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-8 py-4 text-lg font-medium transition-all hover:scale-105 ${c.btnSecondary}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              {lang === 'zh' ? '查看源码' : 'View Source'}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 text-center text-sm ${c.footer}`}>
        <div className="mb-4 flex justify-center gap-6">
          <a href="/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {t.footer.docs}
          </a>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {t.footer.github}
          </a>
          <a href={`${GITHUB_REPO}/issues`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {t.footer.feedback}
          </a>
        </div>
        <p>{t.footer.copy}</p>
        <p className="mt-2 text-xs">{t.footer.tech}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
