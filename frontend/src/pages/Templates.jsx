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
  const { category } = useParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Category info mapping
  const categoryInfo = {
    'toy': { name: 'Toy Dəvətnamələri', icon: '💍', color: 'from-pink-400 to-red-400' },
    'nişan': { name: 'Nişan Dəvətnamələri', icon: '💖', color: 'from-purple-400 to-pink-400' },
    'doğum_günü': { name: 'Ad Günü Dəvətnamələri', icon: '🎂', color: 'from-yellow-400 to-orange-400' },
    'korporativ': { name: 'Korporativ Tədbirlər', icon: '🏢', color: 'from-blue-400 to-indigo-400' }
  };

  useEffect(() => {
    fetchTemplates();
  }, [category]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates`);
      // Filter templates by category
      const filteredTemplates = response.data.filter(template => 
        template.category === category
      );
      setTemplates(filteredTemplates);
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

  const currentCategory = categoryInfo[category];
  if (!currentCategory) {
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
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${currentCategory.color} flex items-center justify-center text-3xl`}>
              {currentCategory.icon}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {currentCategory.name}
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