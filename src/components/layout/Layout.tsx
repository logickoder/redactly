import { type FC, type ReactNode, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { History, Lock, MessageSquare, Moon, Sun, Users } from 'lucide-react';
import Github from '../../assets/github.svg';
import Twitter from '../../assets/x.svg';
import { ReactSVG } from 'react-svg';
import { useAppSettings } from '../../hooks/useStore';
import SEO from './SEO';
import AnalyticsTracker from './AnalyticsTracker';
import AnalyticsBanner from '../ui/AnalyticsBanner';

const Layout: FC = () => {
  const { isDarkMode, toggleDarkMode } = useAppSettings();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SEO />
      <AnalyticsTracker />
      <nav
        className="sticky top-0 z-50 w-full border-b backdrop-blur-xl"
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--color-card) 80%, transparent)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="gradient-text shrink-0 text-2xl font-bold tracking-tight"
            >
              Redactly
            </Link>

            <div className="flex items-center space-x-1">
              <NavIcon action="/mappings" label="Name Mappings">
                <Users size={18} />
              </NavIcon>
              <NavIcon action="/history" label="History">
                <History size={18} />
              </NavIcon>
              <NavIcon action={toggleDarkMode} label="Toggle theme">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </NavIcon>
              <NavIcon action="/feedback" label="Feedback">
                <MessageSquare size={18} />
              </NavIcon>
              <NavIcon action="https://x.com/logickoder" label="Twitter">
                <ReactSVG
                  src={Twitter}
                  className="text-text-muted h-4 w-4"
                  wrapper="svg"
                />
              </NavIcon>
              <NavIcon
                action="https://github.com/logickoder/redactly"
                label="GitHub"
              >
                <ReactSVG
                  src={Github}
                  className="text-text-muted h-4 w-4"
                  wrapper="svg"
                />
              </NavIcon>
            </div>
          </div>
        </div>
      </nav>

      <main className="grow">
        <Outlet />
      </main>

      <AnalyticsBanner />

      <footer
        className="border-t py-8"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
          <a
            href="https://logickoder.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-primary text-sm transition-colors"
          >
            © {new Date().getFullYear()} Jeffery Orazulike. All rights reserved.
          </a>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{
                backgroundImage: 'var(--gradient-primary)',
              }}
            >
              <Lock size={10} />
              100% Client-Side
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavIcon: FC<{
  action: string | (() => void);
  label?: string;
  children: ReactNode;
}> = ({ action, label, children }) => {
  const isLink = typeof action === 'string';
  const isExternalLink = isLink && action.startsWith('https://');
  const Wrapper = isLink ? Link : 'button';
  return (
    <Wrapper
      onClick={isLink ? undefined : action}
      // @ts-expect-error TS doesn't like dynamic 'to' prop
      to={isLink ? action : undefined}
      className="text-text-muted hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/15 rounded-xl p-2 transition-all"
      aria-label={label}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noopener noreferrer' : undefined}
    >
      {children}
    </Wrapper>
  );
};

export default Layout;
