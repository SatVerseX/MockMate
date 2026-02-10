
import React, { useState, useEffect } from 'react';
import { Bot, Sun, Moon, Menu, X, History, Settings, LogOut, User, Crown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    setShowUserMenu(false); // Close menu immediately
    await signOut();
    navigate('/');
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
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => {
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
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
              <Link to="/pricing">
                <Button variant="outline" size="sm" leftIcon={<Crown className="w-4 h-4 text-amber-500" />}>
                  Upgrade
                </Button>
              </Link>

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
                      <div className="absolute right-0 top-14 z-50 w-72 glass-card bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden fade-in-up origin-top-right ring-1 ring-black/5">
                        <div className="p-4 border-b border-zinc-100/50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                              {profile?.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-zinc-900 dark:text-white truncate">
                                {profile?.fullName || 'User'}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-medium">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          {profile?.fullName && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                                <Crown className="w-3 h-3 mr-1" />
                                {profile.isPro ? 'Pro Member' : 'Free Plan'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 space-y-1">
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-all group"
                          >
                            <User className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                            <span className="font-medium">Profile Settings</span>
                          </Link>
                          {/* Separator */}
                          <div className="h-px bg-zinc-100 dark:bg-white/5 my-1 mx-2" />
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all group"
                          >
                            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium">Sign Out</span>
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
             <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="lg" fullWidth leftIcon={<Crown className="w-5 h-5 text-amber-500" />}>
                  Upgrade Plan
                </Button>
             </Link>
             
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

              {user && (
                <>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }} 
                    leftIcon={<LogOut className="w-5 h-5 text-red-500" />}
                    className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Sign Out
                  </Button>
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
};
