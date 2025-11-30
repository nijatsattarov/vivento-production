import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const Favorites = () => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Favorites fetch error:', error);
      toast.error('Sevimlilər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (templateId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/favorites/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Sevimlilərədən silindi');
      setFavorites(favorites.filter(fav => fav.id !== templateId));
    } catch (error) {
      console.error('Remove favorite error:', error);
      toast.error('Silinə bilmədi');
    }
  };

  const handleTemplateClick = (templateId) => {
    navigate(`/template/${templateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Sevimlilər</h1>
          </div>
          <p className="text-gray-600">
            {favorites.length} şablon
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card className="bg-white shadow-lg border-0 p-8">
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sevimli şablonunuz yoxdur
              </h2>
              <p className="text-gray-600 mb-6">
                Bəyəndiyiniz şablonları sevimlilərə əlavə edin
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Şablonlara bax
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((template) => (
              <Card 
                key={template.id} 
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white border-0 overflow-hidden"
              >
                <div className="relative">
                  <div 
                    onClick={() => handleTemplateClick(template.id)}
                    className="aspect-[2/3] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center"
                  >
                    {template.thumbnail_url ? (
                      <img 
                        src={template.thumbnail_url} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl">📋</div>
                    )}
                  </div>
                  
                  {/* Remove from favorites button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromFavorites(template.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
                
                <CardContent className="p-4">
                  <h3 
                    onClick={() => handleTemplateClick(template.id)}
                    className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors"
                  >
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {template.category}
                    </span>
                    {template.is_premium && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full">
                        Premium
                      </span>
                    )}
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

export default Favorites;
