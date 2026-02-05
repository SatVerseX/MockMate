
import React, { useState, useEffect } from 'react';
import { Bot, Sun, Moon, Menu, X, History, Settings, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

interface NavbarProps {
  onViewHistory?: () => void;
  onOpenSettings?: () => void;
  onStart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onViewHistory, 
  onOpenSettings,
  onStart
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200 dark:border-white/10 py-4 shadow-sm' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                MockMate
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {onViewHistory && (
                <Button variant="ghost" size="sm" onClick={onViewHistory} leftIcon={<History className="w-4 h-4" />}>
                  History
                </Button>
              )}
              
              {onOpenSettings && (
                <Button variant="ghost" size="sm" onClick={onOpenSettings} leftIcon={<Settings className="w-4 h-4" />}>
                  Settings
                </Button>
              )}

              {/* User Menu */}
              {user && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                  >
                    {profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.fullName || 'User'} 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                        {profile?.fullName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <div className="absolute right-0 top-12 z-50 w-64 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <p className="font-medium text-zinc-900 dark:text-white truncate">
                            {profile?.fullName || 'User'}
                          </p>
                          <p className="text-sm text-zinc-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-zinc-50 dark:bg-zinc-950 transition-transform duration-300 pt-24 px-6 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-900 dark:text-white font-medium">Appearance</span>
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" /> Dark Mode
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-4">
             {onViewHistory && (
                <Button variant="outline" size="lg" onClick={() => { onViewHistory(); setIsMobileMenuOpen(false); }} leftIcon={<History className="w-5 h-5" />}>
                  History
                </Button>
              )}
              {onOpenSettings && (
                <Button variant="outline" size="lg" onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }} leftIcon={<Settings className="w-5 h-5" />}>
                  Settings
                </Button>
              )}
          </div>
        </div>
      </div>
    </>
  );
};
