import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { LogOut, User, Settings, Plus, Home, Menu, Heart, ChevronRight, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './ui/navigation-menu';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);

  // Categories structure
  const categories = [
    {
      id: 'toy',
      name: 'Toy',
      subcategories: [
        { id: 'toy-devetname', name: 'Dəvətnamələr' },
        { id: 'nisan', name: 'Nişan' }
      ]
    },
    {
      id: 'dogum-gunu',
      name: 'Doğum günü',
      subcategories: [
        { id: 'ad-gunu-devetname', name: 'Ad günü dəvətnaməsi' },
        { id: 'ad-gunu-sam', name: 'Ad günü şam yeyməyi' },
        { id: 'ad-gunu-kart', name: 'Ad günü kartları' }
      ]
    },
    {
      id: 'usaq',
      name: 'Uşaq',
      subcategories: [
        { id: 'korpe', name: 'Körpə' },
        { id: 'cinsiyyet-partisi', name: 'Cinsiyyət partisi' },
        { id: 'usaq-ad-gunu', name: 'Ad günü' }
      ]
    },
    {
      id: 'biznes',
      name: 'Biznes',
      subcategories: [
        { id: 'forum', name: 'Forum' },
        { id: 'korporativ', name: 'Korporativ tədbir' },
        { id: 'vip-event', name: 'VIP Event' },
        { id: 'networking', name: 'Networking' },
        { id: 'launch-party', name: 'Launch Party' },
        { id: 'breakfast', name: 'Breakfast' },
        { id: 'biznes-idlonumu', name: 'Biznes görüşü' },
        { id: 'sam-yemeyi', name: 'Şam yeməyi' },
        { id: 'mukafatlandirma', name: 'Mükafatlandırma' }
      ]
    },
    {
      id: 'tebrik',
      name: 'Təbrik postları-flayer',
      subcategories: []
    },
    {
      id: 'bayramlar',
      name: 'Bayramlar',
      subcategories: [
        { id: 'novruz', name: 'Novruz bayramı' },
        { id: 'qurban', name: 'Qurban bayramı' },
        { id: 'yeni-il', name: 'Yeni il' },
        { id: 'ramazan', name: 'Ramazan bayramı' },
        { id: '8-mart', name: '8 Mart' }
      ]
    },
    {
      id: 'diger',
      name: 'Digər',
      subcategories: [
        { id: 'ad-gunu', name: 'Ad günü' },
        { id: 'tesekkur', name: 'Təşəkkür' },
        { id: 'yubiley', name: 'Yubiley' },
        { id: 'tebrik', name: 'Təbrik' },
        { id: 'teqaud', name: 'Təqaüd' }
      ]
    }
  ];

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
        <div className="flex justify-between items-center h-16">
          
          {/* LEFT SIDE - Logo & Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-100 h-10 w-10" data-testid="menu-button">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto bg-white">
                <SheetHeader>
                  <SheetTitle className="text-xl font-semibold text-gray-900">Kateqoriyalar</SheetTitle>
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
                              to={`/templates/${sub.id}`}
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

            {/* Logo - Left on Desktop, Center on Mobile */}
            <Link to="/" className="flex items-center md:flex-shrink-0">
              {safeSettings.site_logo ? (
                <img 
                  src={safeSettings.site_logo} 
                  alt="Site Logo" 
                  className="h-8 w-auto max-w-[120px] md:max-w-[150px] object-contain"
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
                <span className="text-lg md:text-xl font-bold text-gray-900">Vivento</span>
              </div>
            </Link>
          </div>

          {/* CENTER - Desktop Categories Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1">
                {categories.map((category) => (
                  <NavigationMenuItem key={category.id}>
                    {category.subcategories.length > 0 ? (
                      <>
                        <NavigationMenuTrigger className="text-sm font-medium text-gray-700 hover:text-blue-600 h-9">
                          {category.name}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="w-[200px] p-2 bg-white">
                            {category.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/templates/${sub.id}`}
                                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          to={`/templates/${category.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          {category.name}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* RIGHT SIDE - Favorites & Auth */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Favorites Icon */}
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 h-10 w-10" data-testid="favorites-button">
              <Heart className="h-6 w-6 text-gray-700" />
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 h-10 w-10" 
                onClick={() => navigate('/login')}
                data-testid="login-icon"
              >
                <User className="h-6 w-6 text-gray-700" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;