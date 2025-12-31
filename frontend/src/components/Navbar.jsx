import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { LogOut, User, Settings, Plus, Home, Menu, Heart, ChevronRight, ChevronDown, Search, X, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import axios from 'axios';

const languages = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Search templates
  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates`);
      const filtered = response.data.filter(template => 
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.parent_category.toLowerCase().includes(query.toLowerCase()) ||
        template.sub_category.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Axtarış xətası:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Categories structure - using translations
  const categoryIds = ['toy', 'dogum-gunu', 'usaq', 'biznes', 'tebrik', 'bayramlar', 'diger'];
  
  const subcategoryMap = {
    'toy': ['toy-devetname', 'nisan'],
    'dogum-gunu': ['ad-gunu-devetname', 'ad-gunu-sam', 'ad-gunu-kart'],
    'usaq': ['korpe', 'cinsiyyet-partisi', 'usaq-ad-gunu'],
    'biznes': ['forum', 'korporativ', 'vip-event', 'networking', 'launch-party', 'breakfast', 'biznes-idlonumu', 'sam-yemeyi', 'mukafatlandirma'],
    'tebrik': [],
    'bayramlar': ['novruz', 'qurban', 'yeni-il', 'ramazan', '8-mart'],
    'diger': ['ad-gunu', 'tesekkur', 'yubiley', 'tebrik', 'teqaud']
  };

  const categories = categoryIds.map(id => ({
    id,
    name: t(`categories.${id}.name`),
    subcategories: subcategoryMap[id].map(subId => ({
      id: subId,
      name: t(`categories.${id}.subcategories.${subId}`)
    }))
  }));

  // Safe settings with defaults
  const safeSettings = settings || {
    site_logo: null,
    hero_title: 'Vivento',
    hero_subtitle: ''
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          
          {/* LEFT SIDE - Mobile Menu & Search (visible on mobile) */}
          <div className="flex items-center space-x-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 h-10 w-10" data-testid="menu-button">
                  <Menu className="h-6 w-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto bg-white border-r border-gray-200">
                <SheetHeader>
                  <SheetTitle className="text-xl font-semibold text-gray-900">{t('navbar.categories')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {categories.map((category) => (
                    <div key={category.id} className="space-y-1">
                      <button
                        onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span className="font-medium text-gray-900">{category.name}</span>
                        {category.subcategories.length > 0 && (
                          <ChevronRight 
                            className={`h-4 w-4 text-gray-600 transition-transform ${openCategory === category.id ? 'rotate-90' : ''}`} 
                          />
                        )}
                      </button>
                      {openCategory === category.id && category.subcategories.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {category.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/templates/${category.id}/${sub.id}`}
                              className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Search Icon - Mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-gray-100 h-10 w-10" 
              data-testid="search-button-mobile"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-gray-700" />
            </Button>
          </div>

          {/* LEFT SIDE - Desktop Logo & Search */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/" className="flex items-center">
              {safeSettings.site_logo ? (
                <img 
                  src={safeSettings.site_logo.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${safeSettings.site_logo}` : safeSettings.site_logo} 
                  alt="Site Logo" 
                  className="h-10 w-auto max-w-[180px] object-contain"
                  onError={(e) => {
                    try {
                      console.error('Navbar logo load error:', e);
                      if (e && e.target && e.target.style) {
                        e.target.style.display = 'none';
                      }
                      if (e && e.target && e.target.parentElement) {
                        const fallbackDiv = e.target.parentElement.querySelector('.default-logo-fallback');
                        if (fallbackDiv && fallbackDiv.style) {
                          fallbackDiv.style.display = 'flex';
                        }
                      }
                    } catch (error) {
                      console.error('Error in onError handler:', error);
                    }
                  }}
                />
              ) : null}
              <div className="default-logo-fallback flex items-center space-x-2" style={{display: safeSettings.site_logo ? 'none' : 'flex'}}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Vivento</span>
              </div>
            </Link>
            
            {/* Search Icon - Desktop */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-gray-100 h-10 w-10" 
              data-testid="search-button-desktop"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-gray-700" />
            </Button>
          </div>

          {/* CENTER - Logo (Mobile) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:hidden z-10 pointer-events-none">
            <Link to="/" className="flex items-center pointer-events-auto">
              {safeSettings.site_logo ? (
                <img 
                  src={safeSettings.site_logo.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${safeSettings.site_logo}` : safeSettings.site_logo} 
                  alt="Site Logo" 
                  className="h-8 w-auto max-w-[140px] object-contain"
                  onError={(e) => {
                    try {
                      console.error('Mobile logo load error:', e);
                      if (e && e.target && e.target.style) {
                        e.target.style.display = 'none';
                      }
                      if (e && e.target && e.target.parentElement) {
                        const fallbackDiv = e.target.parentElement.querySelector('.default-logo-fallback');
                        if (fallbackDiv && fallbackDiv.style) {
                          fallbackDiv.style.display = 'flex';
                        }
                      }
                    } catch (error) {
                      console.error('Error in mobile logo error handler:', error);
                    }
                  }}
                />
              ) : null}
              <div className="default-logo-fallback flex items-center space-x-2" style={{display: safeSettings.site_logo ? 'none' : 'flex'}}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-lg font-bold text-gray-900">Vivento</span>
              </div>
            </Link>
          </div>

          {/* CENTER - Desktop Categories Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {categories.map((category) => (
              <div key={category.id} className="relative group">
                {category.subcategories.length > 0 ? (
                  <>
                    <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-md group-hover:bg-gray-50">
                      {category.name}
                      <ChevronDown className="ml-1 h-3 w-3 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50">
                      <div className="w-[200px] p-2 bg-white rounded-md shadow-lg border">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/templates/${category.id}/${sub.id}`}
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={`/templates/${category.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-50"
                  >
                    {category.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT SIDE - Favorites & Auth */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:bg-gray-100 h-10 px-3 gap-2">
                  <Globe className="h-5 w-5 text-gray-700" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {languages.find(l => l.code === i18n.language)?.flag || '🇦🇿'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`cursor-pointer ${i18n.language === lang.code ? 'bg-blue-50 text-blue-600' : ''}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                    {i18n.language === lang.code && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Favorites Icon */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-gray-100 h-10 w-10" 
              data-testid="favorites-button"
              onClick={() => navigate('/favorites')}
            >
              <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Button>

            {/* User Menu / Auth Icon */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profile_picture} alt={user?.name} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
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
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin">
                        <User className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/pages')} data-testid="menu-admin-pages">
                        <User className="mr-2 h-4 w-4" />
                        {t('admin.pages')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 h-10 w-10" 
                onClick={() => navigate('/login')}
                data-testid="login-icon"
              >
                <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('common.search')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t('navbar.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('navbar.noResults')}</p>
                  <p className="text-sm mt-2">{t('navbar.searchHint')}</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        navigate(`/template/${template.id}`);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-16 h-24 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x150/f0f0f0/666666?text=Template';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {template.parent_category} - {template.sub_category}
                        </p>
                        {template.is_premium && (
                          <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('navbar.searchHint')}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;