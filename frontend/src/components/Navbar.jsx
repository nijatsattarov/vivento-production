import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { LogOut, User, Settings, Plus, Calendar, Home } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Vivento</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                  data-testid="nav-dashboard"
                >
                  <Home size={16} />
                  <span>Ana səhifə</span>
                </Link>
                <Link 
                  to="/create-event" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                  data-testid="nav-create-event"
                >
                  <Plus size={16} />
                  <span>Yeni tədbir</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Ana səhifə
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-700 hover:text-blue-600" data-testid="nav-categories">
                      Kateqoriyalar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      💍 Toy dəvətnamələri
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      💖 Nişan mərasimləri
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      🎂 Ad günü partiyaları
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      🏢 Korporativ tədbirlər
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Link to="/#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Xüsusiyyətlər
                </Link>
                <Link to="/#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Qiymətlər
                </Link>
              </>
            )}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profile_picture} alt={user?.name} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Parametrlər
                  </DropdownMenuItem>
                  {(user?.email === 'admin@vivento.az' || user?.email?.includes('admin')) && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin">
                      <User className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıxış
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" data-testid="nav-login">
                    Giriş
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="nav-register">
                    Qeydiyyat
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-testid="mobile-menu-button"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="mobile-nav-dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  to="/create-event"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="mobile-nav-create-event"
                >
                  Yeni tədbir
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  data-testid="mobile-nav-logout"
                >
                  Çıxış
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="mobile-nav-login"
                >
                  Giriş
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="mobile-nav-register"
                >
                  Qeydiyyat
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;