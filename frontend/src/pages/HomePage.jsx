import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import Slider from 'react-slick';
import axios from 'axios';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { 
  Calendar, 
  Users, 
  Share2, 
  Smartphone, 
  CheckCircle, 
  Star,
  ArrowRight,
  Zap,
  Palette,
  MessageSquare
} from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { t, i18n } = useTranslation();
  const [blogPosts, setBlogPosts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Safe settings with defaults
  const safeSettings = settings || {
    site_logo: null,
    hero_title: 'Rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb',
    hero_subtitle: 'Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın.',
    facebook_url: null,
    instagram_url: null,
    tiktok_url: null
  };

  const features = [
    {
      icon: <Palette className="h-8 w-8 text-blue-600" />,
      title: t('home.features.feature1.title'),
      description: t('home.features.feature1.description')
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: t('home.features.feature2.title'),
      description: t('home.features.feature2.description')
    },
    {
      icon: <Share2 className="h-8 w-8 text-green-600" />,
      title: t('home.features.feature3.title'),
      description: t('home.features.feature3.description')
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      title: t('home.features.feature4.title'),
      description: t('home.features.feature4.description')
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: t('home.features.feature5.title'),
      description: t('home.features.feature5.description')
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-pink-600" />,
      title: t('home.features.feature6.title'),
      description: t('home.features.feature6.description')
    }
  ];

  useEffect(() => {
    fetchBlogPosts();
    fetchTemplates();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/blog`);
      // Get only published posts, latest 3
      const published = response.data.filter(post => post.published).slice(0, 3);
      setBlogPosts(published);
    } catch (error) {
      console.error('Blog yazıları yüklənərkən xəta:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Şablonlar yüklənərkən xəta:', error);
      // Fallback to default templates
      setTemplates([
        {
          id: 1,
          name: "Toy dəvətnaməsi",
          category: "toy",
          thumbnail_url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop&crop=center",
          is_premium: false
        },
        {
          id: 2,
          name: "Nişan mərasimi",
          category: "nişan",
          thumbnail_url: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=300&fit=crop&crop=center",
          is_premium: true
        },
        {
          id: 3,
          name: "Doğum günü",
          category: "doğum_günü",
          thumbnail_url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center",
          is_premium: false
        },
        {
          id: 4,
          name: "Korporativ tədbir",
          category: "korporativ",
          thumbnail_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop&crop=center",
          is_premium: true
        }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      {/* Hero Slider Section */}
      <HeroSlider />

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-0 shadow-lg bg-white">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              <span className="gradient-text">{t('categories.title')}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { id: 'toy', slug: 'toy', icon: '💍', color: 'from-pink-400 to-red-400', count: '15+' },
              { id: 'toy', slug: 'nişan', icon: '💖', color: 'from-purple-400 to-pink-400', count: '8+', subKey: 'nisan' },
              { id: 'dogum-gunu', slug: 'doğum_günü', icon: '🎂', color: 'from-yellow-400 to-orange-400', count: '12+' },
              { id: 'biznes', slug: 'korporativ', icon: '🏢', color: 'from-blue-400 to-indigo-400', count: '6+' }
            ].map((category, index) => (
              <Card 
                key={index} 
                className="card-hover cursor-pointer group" 
                data-testid={`category-${category.slug.toLowerCase()}`}
                onClick={() => navigate(`/templates/${category.slug}`)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${category.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {category.subKey ? t(`categories.${category.id}.subcategories.${category.subKey}`) : t(`categories.${category.id}.name`)}
                  </h3>
                  <p className="text-sm text-gray-600">{category.count} {t('categories.templatesCount')}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="explore-templates-button"
            >
              {t('categories.exploreAll')}
            </Button>
          </div>
        </div>
      </section>

      {/* Templates Preview - Carousel */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('home.templates.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.templates.subtitle')}
            </p>
          </div>

          {templates.length > 0 && (
            <Slider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={4}
              slidesToScroll={2}
              autoplay={true}
              autoplaySpeed={3000}
              responsive={[
                {
                  breakpoint: 1280,
                  settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 1024,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 768,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    dots: true,
                    arrows: false
                  }
                }
              ]}
              className="templates-carousel"
            >
              {templates.map((template) => (
                <div key={template.id} className="px-2">
                  <Card className="card-hover overflow-hidden bg-white shadow-lg h-full mx-1">
                    <div className="relative">
                      <img 
                        src={template.thumbnail_url || template.image} 
                        alt={template.name}
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                      {(template.is_premium || template.premium) && (
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                          <span className="premium-badge bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold">
                            Premium
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-6">
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-1">{template.name}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm capitalize mb-2 sm:mb-4">{template.category}</p>
                      <Button 
                        size="sm" 
                        className="w-full text-xs sm:text-sm"
                        onClick={() => {
                          if (isAuthenticated) {
                            // Redirect to create event with this template
                            navigate(`/create-event?template=${template.id}`);
                          } else {
                            // Store template ID and redirect to register
                            localStorage.setItem('selectedTemplateId', template.id);
                            navigate('/register');
                          }
                        }}
                      >
                        İstifadə et
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </Slider>
          )}
        </div>
      </section>

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {t('home.blog.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t('home.blog.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="card-hover overflow-hidden bg-white shadow-lg cursor-pointer"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {post.thumbnail && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={post.thumbnail} 
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform hover:scale-110"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    {post.category && (
                      <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                        {post.category}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.author}</span>
                      <span>{new Date(post.created_at).toLocaleDateString('az-AZ')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={() => navigate('/blog')}
                variant="outline"
                size="lg"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {t('home.blog.viewAll')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/register')} 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg btn-hover"
              data-testid="cta-register-button"
            >
              {t('home.cta.button')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                {safeSettings.site_logo ? (
                  <img 
                    src={safeSettings.site_logo} 
                    alt="Site Logo" 
                    className="h-10 w-auto max-w-[200px] object-contain filter brightness-0 invert"
                    onError={(e) => {
                      try {
                        console.error('Footer logo load error:', e);
                        if (e && e.target && e.target.style) {
                          e.target.style.display = 'none';
                        }
                        if (e && e.target && e.target.nextSibling && e.target.nextSibling.style) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      } catch (error) {
                        console.error('Error in footer logo onError handler:', error);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">V</span>
                    </div>
                    <span className="text-xl font-bold">Vivento</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400">
                {t('footer.description')}
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">{t('footer.product')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white transition-colors">{t('footer.features')}</Link></li>
                <li><Link to="/templates" className="hover:text-white transition-colors">{t('common.templates')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">{t('footer.company')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">{t('common.about')}</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">{t('footer.support')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Social Media Icons */}
          {(safeSettings.facebook_url || safeSettings.instagram_url || safeSettings.tiktok_url) && (
            <div className="flex justify-center space-x-6 mt-8 pt-8 border-t border-gray-800">
              {safeSettings.facebook_url && (
                <a 
                  href={safeSettings.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {safeSettings.instagram_url && (
                <a 
                  href={safeSettings.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {safeSettings.tiktok_url && (
                <a 
                  href={safeSettings.tiktok_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Vivento. {t('footer.allRightsReserved')}.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles for Carousels */}
      <style jsx global>{`
        .templates-carousel .slick-slide {
          padding: 0 8px;
        }
        
        .templates-carousel .slick-list {
          margin: 0 -8px;
          padding: 10px 0;
        }

        .templates-carousel .slick-dots {
          bottom: -45px;
        }

        .templates-carousel .slick-dots li button:before {
          font-size: 12px;
          color: #3B82F6;
        }

        .templates-carousel .slick-dots li.slick-active button:before {
          color: #3B82F6;
        }

        .templates-carousel .slick-prev,
        .templates-carousel .slick-next {
          z-index: 1;
          width: 40px;
          height: 40px;
        }

        .templates-carousel .slick-prev {
          left: -50px;
        }

        .templates-carousel .slick-next {
          right: -50px;
        }

        .templates-carousel .slick-prev:before,
        .templates-carousel .slick-next:before {
          font-size: 40px;
          color: #3B82F6;
        }

        @media (max-width: 1024px) {
          .templates-carousel .slick-prev {
            left: -30px;
          }
          
          .templates-carousel .slick-next {
            right: -30px;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .templates-carousel .slick-slide {
            padding: 0 4px;
          }
          
          .templates-carousel .slick-list {
            margin: 0 -4px;
            padding: 10px 0;
          }
          
          .templates-carousel .slick-dots {
            bottom: -35px;
          }
          
          .templates-carousel .slick-dots li {
            margin: 0 3px;
          }
          
          .templates-carousel .slick-dots li button:before {
            font-size: 10px;
          }
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default HomePage;