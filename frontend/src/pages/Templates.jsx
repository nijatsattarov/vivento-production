import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryDisplayInfo, setCategoryDisplayInfo] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Category structure for display
  const categoryStructure = {
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
  };

  useEffect(() => {
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
  }, [parent, sub]);

  const fetchTemplates = async () => {
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
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Kateqoriya tapılmadı</h1>
            <Button onClick={() => navigate('/')} className="mt-4">
              Ana səhifəyə qayıt
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
            Ana səhifəyə qayıt
          </Button>
          
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${categoryDisplayInfo.color} flex items-center justify-center text-3xl`}>
              {categoryDisplayInfo.icon}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {categoryDisplayInfo.name}
            </h1>
            <p className="text-xl text-gray-600">
              {templates.length} şablon tapıldı
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bu kateqoriyada şablon yoxdur
            </h3>
            <p className="text-gray-500">
              Yaxında daha çox şablon əlavə ediləcək
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-0">
                  {/* Template Preview */}
                  <div className="relative aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
                    {template.thumbnail_url ? (
                      <img 
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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
                        Bax və Seç
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