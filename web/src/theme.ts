export type Theme = 'dark' | 'light';

const THEME_KEY = 'shadow-shuttle-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const s = localStorage.getItem(THEME_KEY);
  return s === 'light' ? 'light' : 'dark';
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export const themeClasses = {
  dark: {
    page: 'bg-[#101622] text-white',
    nav: 'border-white/5 bg-[#101622]/80',
    navLink: 'text-slate-400 hover:text-white',
    sectionAlt: 'bg-[#0b0f17]',
    card: 'border-white/5 bg-[#121826] hover:border-white/10 text-white',
    cardDesc: 'text-slate-400',
    codeBlock: 'bg-[#0d1117] border-slate-800',
    codeHeader: 'bg-[#161b22] border-slate-800 text-slate-500',
    codeText: 'text-slate-300',
    footer: 'bg-[#0b0f17] text-slate-600',
    badge: 'border-primary/30 bg-primary/10 text-primary',
    btnSecondary: 'border-slate-700 bg-[#161b22] text-slate-300 hover:bg-slate-800 hover:text-white',
    docCard: 'border-white/10 bg-[#121826]',
    docTitle: 'text-white',
    docText: 'text-slate-400',
    docPre: 'bg-[#0d1117] text-slate-300 border-slate-700',
  },
  light: {
    page: 'bg-slate-50 text-slate-900',
    nav: 'border-slate-200/80 bg-white/90',
    navLink: 'text-slate-600 hover:text-slate-900',
    sectionAlt: 'bg-white',
    card: 'border-slate-200 bg-white hover:border-primary/30 text-slate-900 shadow-sm',
    cardDesc: 'text-slate-600',
    codeBlock: 'bg-slate-900 border-slate-700',
    codeHeader: 'bg-slate-800 border-slate-700 text-slate-400',
    codeText: 'text-slate-300',
    footer: 'bg-slate-100 text-slate-500',
    badge: 'border-primary/40 bg-primary/10 text-primary',
    btnSecondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
    docCard: 'border-slate-200 bg-white',
    docTitle: 'text-slate-900',
    docText: 'text-slate-600',
    docPre: 'bg-slate-900 text-slate-300 border-slate-700',
  },
} as const;
