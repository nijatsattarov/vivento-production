import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowLeft, 
  Eye, 
  Star, 
  Crown,
  Palette,
  Calendar,
  Users
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Templates = () => {
  const { parent, sub } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryDisplayInfo, setCategoryDisplayInfo] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Localized category structure for display
  const getLocalizedCategoryStructure = useCallback(() => {
    const structures = {
      az: {
        'toy': { name: 'Toy', icon: '💍', color: 'from-pink-400 to-red-400',
          subcategories: {
            'toy-devetname': { name: 'Dəvətnamələr' },
            'nisan': { name: 'Nişan' }
          }
        },
        'dogum-gunu': { name: 'Doğum günü', icon: '🎂', color: 'from-yellow-400 to-orange-400',
          subcategories: {
            'ad-gunu-devetname': { name: 'Ad günü dəvətnaməsi' },
            'ad-gunu-sam': { name: 'Ad günü şam yeyməyi' },
            'ad-gunu-kart': { name: 'Ad günü kartları' }
          }
        },
        'usaq': { name: 'Uşaq', icon: '👶', color: 'from-blue-400 to-cyan-400',
          subcategories: {
            'korpe': { name: 'Körpə' },
            'cinsiyyet-partisi': { name: 'Cinsiyyət partisi' },
            'usaq-ad-gunu': { name: 'Ad günü' }
          }
        },
        'biznes': { name: 'Biznes', icon: '🏢', color: 'from-slate-400 to-gray-500',
          subcategories: {
            'forum': { name: 'Forum' },
            'korporativ': { name: 'Korporativ tədbir' },
            'vip-event': { name: 'VIP Event' }
          }
        },
        'tebrik': { name: 'Təbrik postları-flayer', icon: '🎊', color: 'from-purple-400 to-pink-400',
          subcategories: {
            'tebrik-umumi': { name: 'Ümumi təbriklər' }
          }
        },
        'bayramlar': { name: 'Bayramlar', icon: '🎉', color: 'from-red-400 to-orange-400',
          subcategories: {
            'novruz': { name: 'Novruz bayramı' },
            'qurban': { name: 'Qurban bayramı' },
            'yeni-il': { name: 'Yeni il' }
          }
        },
        'diger': { name: 'Digər', icon: '✨', color: 'from-indigo-400 to-purple-400',
          subcategories: {
            'ad-gunu': { name: 'Ad günü' },
            'tesekkur': { name: 'Təşəkkür' },
            'yubiley': { name: 'Yubiley' }
          }
        }
      },
      en: {
        'toy': { name: 'Wedding', icon: '💍', color: 'from-pink-400 to-red-400',
          subcategories: {
            'toy-devetname': { name: 'Invitations' },
            'nisan': { name: 'Engagement' }
          }
        },
        'dogum-gunu': { name: 'Birthday', icon: '🎂', color: 'from-yellow-400 to-orange-400',
          subcategories: {
            'ad-gunu-devetname': { name: 'Birthday Invitations' },
            'ad-gunu-sam': { name: 'Birthday Dinner' },
            'ad-gunu-kart': { name: 'Birthday Cards' }
          }
        },
        'usaq': { name: 'Kids', icon: '👶', color: 'from-blue-400 to-cyan-400',
          subcategories: {
            'korpe': { name: 'Baby' },
            'cinsiyyet-partisi': { name: 'Gender Reveal' },
            'usaq-ad-gunu': { name: 'Kids Birthday' }
          }
        },
        'biznes': { name: 'Business', icon: '🏢', color: 'from-slate-400 to-gray-500',
          subcategories: {
            'forum': { name: 'Forum' },
            'korporativ': { name: 'Corporate Event' },
            'vip-event': { name: 'VIP Event' }
          }
        },
        'tebrik': { name: 'Congratulations Posts', icon: '🎊', color: 'from-purple-400 to-pink-400',
          subcategories: {
            'tebrik-umumi': { name: 'General Congratulations' }
          }
        },
        'bayramlar': { name: 'Holidays', icon: '🎉', color: 'from-red-400 to-orange-400',
          subcategories: {
            'novruz': { name: 'Nowruz Holiday' },
            'qurban': { name: 'Eid al-Adha' },
            'yeni-il': { name: 'New Year' }
          }
        },
        'diger': { name: 'Other', icon: '✨', color: 'from-indigo-400 to-purple-400',
          subcategories: {
            'ad-gunu': { name: 'Name Day' },
            'tesekkur': { name: 'Thank You' },
            'yubiley': { name: 'Anniversary' }
          }
        }
      },
      ru: {
        'toy': { name: 'Свадьба', icon: '💍', color: 'from-pink-400 to-red-400',
          subcategories: {
            'toy-devetname': { name: 'Приглашения' },
            'nisan': { name: 'Помолвка' }
          }
        },
        'dogum-gunu': { name: 'День Рождения', icon: '🎂', color: 'from-yellow-400 to-orange-400',
          subcategories: {
            'ad-gunu-devetname': { name: 'Приглашения на День Рождения' },
            'ad-gunu-sam': { name: 'Ужин в День Рождения' },
            'ad-gunu-kart': { name: 'Открытки на День Рождения' }
          }
        },
        'usaq': { name: 'Детские', icon: '👶', color: 'from-blue-400 to-cyan-400',
          subcategories: {
            'korpe': { name: 'Малыш' },
            'cinsiyyet-partisi': { name: 'Вечеринка-сюрприз' },
            'usaq-ad-gunu': { name: 'Детский День Рождения' }
          }
        },
        'biznes': { name: 'Бизнес', icon: '🏢', color: 'from-slate-400 to-gray-500',
          subcategories: {
            'forum': { name: 'Форум' },
            'korporativ': { name: 'Корпоративное Мероприятие' },
            'vip-event': { name: 'VIP Мероприятие' }
          }
        },
        'tebrik': { name: 'Поздравительные Посты', icon: '🎊', color: 'from-purple-400 to-pink-400',
          subcategories: {
            'tebrik-umumi': { name: 'Общие Поздравления' }
          }
        },
        'bayramlar': { name: 'Праздники', icon: '🎉', color: 'from-red-400 to-orange-400',
          subcategories: {
            'novruz': { name: 'Праздник Новруз' },
            'qurban': { name: 'Курбан-байрам' },
            'yeni-il': { name: 'Новый Год' }
          }
        },
        'diger': { name: 'Другое', icon: '✨', color: 'from-indigo-400 to-purple-400',
          subcategories: {
            'ad-gunu': { name: 'Именины' },
            'tesekkur': { name: 'Благодарность' },
            'yubiley': { name: 'Юбилей' }
          }
        }
      }
    };
    return structures[i18n.language] || structures.az;
  }, [i18n.language]);

  useEffect(() => {
    const categoryStructure = getLocalizedCategoryStructure();
    
    fetchTemplates();
    // Build display info
    if (parent && categoryStructure[parent]) {
      const parentInfo = categoryStructure[parent];
      if (sub && parentInfo.subcategories && parentInfo.subcategories[sub]) {
        setCategoryDisplayInfo({
          name: `${parentInfo.name} - ${parentInfo.subcategories[sub].name}`,
          icon: parentInfo.icon,
          color: parentInfo.color
        });
      } else {
        setCategoryDisplayInfo({
          name: parentInfo.name,
          icon: parentInfo.icon,
          color: parentInfo.color
        });
      }
    }
  }, [parent, sub, i18n.language]);

  const fetchTemplates = useCallback(async () => {
    try {
      let url;
      if (parent && sub) {
        // Fetch by both parent and sub category
        url = `${API_BASE_URL}/api/templates/category/${parent}/${sub}`;
      } else if (parent) {
        // Fetch by parent category only
        url = `${API_BASE_URL}/api/templates/category/${parent}`;
      } else {
        // Fetch all templates
        url = `${API_BASE_URL}/api/templates`;
      }
      
      const response = await axios.get(url);
      setTemplates(response.data);
    } catch (error) {
      console.error('Templates yükləmə xətası:', error);
      toast.error('Şablonlar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  }, [parent, sub, API_BASE_URL]);

  const handleTemplateSelect = (template) => {
    // Navigate to template detail/single page 
    navigate(`/template/${template.id}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!categoryDisplayInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('categoryNotFound', 'Kateqoriya tapılmadı')}</h1>
            <Button onClick={() => navigate('/')} className="mt-4">
              {t('backToHome', 'Ana səhifəyə qayıt')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToHome', 'Ana səhifəyə qayıt')}
          </Button>
          
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${categoryDisplayInfo.color} flex items-center justify-center text-3xl`}>
              {categoryDisplayInfo.icon}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {categoryDisplayInfo.name}
            </h1>
            <p className="text-xl text-gray-600">
              {templates.length} {t('templatesFound', 'şablon tapıldı')}
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noTemplatesInCategory', 'Bu kateqoriyada şablon yoxdur')}
            </h3>
            <p className="text-gray-500">
              {t('moreTemplatesSoon', 'Yaxında daha çox şablon əlavə ediləcək')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-0">
                  {/* Template Preview */}
                  <div className="relative aspect-[3/4] bg-white rounded-t-lg overflow-hidden">
                    {template.thumbnail_url ? (
                      <img 
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Palette className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    {template.is_premium && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                        <Crown className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        {t('viewAndSelect', 'Bax və Seç')}
                      </Button>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {template.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 capitalize">
                        {template.category}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        4.8
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;