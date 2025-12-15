import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowLeft, 
  Edit, 
  Star, 
  Crown,
  Palette,
  Users,
  Share2,
  Download,
  Heart,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const TemplateDetail = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchTemplate();
    if (isAuthenticated) {
      checkIfFavorite();
    }
  }, [templateId, isAuthenticated]);

  const fetchTemplate = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates`);
      const foundTemplate = response.data.find(t => t.id === templateId);
      
      if (!foundTemplate) {
        toast.error('Şablon tapılmadı');
        navigate('/');
        return;
      }
      
      setTemplate(foundTemplate);
    } catch (error) {
      console.error('Template yükləmə xətası:', error);
      toast.error('Şablon yüklənə bilmədi');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favorites = response.data.favorites || [];
      // Favorites can be either string IDs or objects with id property
      setIsFavorite(favorites.some(fav => {
        const favId = typeof fav === 'string' ? fav : fav.id;
        return favId === templateId;
      }));
    } catch (error) {
      console.error('Favorites check error:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Sevimlilərə əlavə etmək üçün daxil olun');
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      const authToken = token || localStorage.getItem('accessToken');
      
      if (!authToken) {
        toast.error('Giriş token-i tapılmadı');
        navigate('/login');
        return;
      }

      if (isFavorite) {
        const response = await axios.delete(`${API_BASE_URL}/api/favorites/${templateId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Remove favorite response:', response.data);
        toast.success('Sevimlilərədən silindi');
        setIsFavorite(false);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/favorites/${templateId}`, {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Add favorite response:', response.data);
        toast.success('Sevimlilərə əlavə edildi');
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.detail || 'Əməliyyat uğursuz oldu';
      toast.error(errorMessage);
      
      // If auth error, redirect to login
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCustomize = () => {
    if (!isAuthenticated) {
      toast.error('Şablonu özəlləşdirmək üçün daxil olun');
      navigate('/login');
      return;
    }

    // Create a new event and redirect to template editor
    // For now, we'll create a demo event and redirect
    navigate('/create-event?template=' + templateId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Şablon tapılmadı</h1>
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri qayıt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Template Preview */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3] bg-gray-50 p-6 flex items-center justify-center">
                  {template.thumbnail_url ? (
                    <img 
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Palette className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Premium Badge */}
                  {template.is_premium && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                      <Crown className="mr-1 h-3 w-3" />
                      Premium
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={toggleFavorite}
                variant="outline" 
                className="flex-1"
                disabled={favoriteLoading}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? 'Sevimlilərədə' : 'Sevimlilərə əlavə et'}
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Paylaş
              </Button>
            </div>
          </div>

          {/* Template Details */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {template.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-4 w-4 fill-yellow-400 text-yellow-400" 
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">4.8 (324 rəy)</span>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {template.category}
                </Badge>
              </div>
            </div>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Bu şablonda nə var?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Edit className="mr-3 h-4 w-4 text-blue-500" />
                  Tam özəlləşdirmə imkanı
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="mr-3 h-4 w-4 text-purple-500" />
                  Qonaq idarəetməsi
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Share2 className="mr-3 h-4 w-4 text-green-500" />
                  WhatsApp və email paylaşımı
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Download className="mr-3 h-4 w-4 text-orange-500" />
                  Yüksək keyfiyyətli yüklənmə
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Şablon haqqında</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Bu şablon {template.category} tədbirləri üçün xüsusi dizayn edilib. 
                  Professional görünüş və asan özəlləşdirmə imkanları ilə mükəmməl 
                  dəvətnamələr yaradın. Mətn, rəng və şəkilləri öz zövqünüzə uyğun 
                  dəyişdirin.
                </p>
              </CardContent>
            </Card>

            {/* Customize Button */}
            <div className="space-y-3">
              <Button 
                onClick={handleCustomize}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Edit className="mr-2 h-5 w-5" />
                Dəvətnaməni Özəlləşdir
              </Button>
              
              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500">
                  Özəlləşdirmək üçün{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/login')}
                  >
                    daxil olun
                  </Button>
                  {' '}və ya{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/register')}
                  >
                    qeydiyyatdan keçin
                  </Button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related Templates */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Oxşar Şablonlar
          </h2>
          <div className="text-center py-8 text-gray-500">
            <Palette className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Daha çox şablon tezliklə əlavə ediləcək</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;