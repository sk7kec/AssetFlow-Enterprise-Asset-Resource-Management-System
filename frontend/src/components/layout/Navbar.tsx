import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Breadcrumb } from './Breadcrumb';
import { ProfileMenu } from './ProfileMenu';
import { SearchBar } from './SearchBar';
import { 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  Menu, 
  Command 
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  toggleNotifications,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);

  // Trigger search on keyboard shortcut (Command/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/65 backdrop-blur-md sticky top-0 z-30 select-none glass-panel">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right: Actions (Search, Theme, Notif, Profile) */}
      <div className="flex items-center gap-4">
        {/* Search Everywhere Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground bg-accent/40 hover:bg-accent transition-all hover:text-foreground cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search everywhere...</span>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-border font-mono text-[9px] font-bold">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>

        {/* Mobile Search Icon */}
        <button
          onClick={() => setSearchOpen(true)}
          className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Alert Bell */}
        <button
          onClick={toggleNotifications}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 font-display text-[9px] font-bold text-white ring-2 ring-card animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Account Menu Dropdown */}
        <ProfileMenu />
      </div>

      {/* Global Search Popup Box */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};
