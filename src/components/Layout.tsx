import { type FC, type ReactNode, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { History, MessageSquare, Moon, Sun, Users } from 'lucide-react';
import Github from '../assets/github.svg';
import Twitter from '../assets/x.svg';
import { ReactSVG } from 'react-svg';
import { useAppStore } from '../store/useAppStore.ts';
import SEO from './SEO';

const Layout: FC = () => {
  const iconClass = 'w-5 h-5 text-text-muted';
  const { isDarkMode, toggleDarkMode } = useAppStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SEO />
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-between h-24 sm:h-16 items-center">
            <Link to="/" className="shrink-0 text-2xl font-bold text-primary tracking-tight">
              Redactly
            </Link>

            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              <TrailingIcon action="/mappings" label="Name Mappings">
                <Users size={20} />
              </TrailingIcon>
              <TrailingIcon action="/history" label="History">
                <History size={20} />
              </TrailingIcon>
              <TrailingIcon action={toggleDarkMode} label="Toggle theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </TrailingIcon>
              <TrailingIcon action="#" label="Feedback">
                <MessageSquare size={20} />
              </TrailingIcon>
              <TrailingIcon action="https://x.com/logickoder" label="Twitter">
                <ReactSVG src={Twitter} className={iconClass} wrapper="svg" />
              </TrailingIcon>
              <TrailingIcon action="https://github.com/logickoder/redactly" label="GitHub">
                <ReactSVG src={Github} className={iconClass} wrapper="svg" />
              </TrailingIcon>
            </div>
          </div>
        </div>
      </nav>

      <main className="grow">
        <Outlet />
      </main>

      <footer className="bg-card border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <a href="https://logickoder.dev" target="_blank" className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} Jeffery Orazulike. All rights reserved.
          </a>

          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            text processing
          </div>
        </div>
      </footer>
    </div>
  );
};

const TrailingIcon: FC<{
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
      className="p-2 rounded-full text-text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={label}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noopener noreferrer' : undefined}
    >
      {children}
    </Wrapper>
  );
};

export default Layout;
