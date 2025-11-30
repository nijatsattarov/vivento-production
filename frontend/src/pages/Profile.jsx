import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { User, Upload, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Profile = () => {
  const { user, token, setUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profile_picture: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profile_picture: user.profile_picture || ''
      });
      setImagePreview(user.profile_picture);
    }
  }, [user, isAuthenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Şəkil 5MB-dan kiçik olmalıdır');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let profilePictureUrl = formData.profile_picture;

      // Upload image if new file selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);

        const uploadResponse = await axios.post(
          `${API_BASE_URL}/api/upload/profile`,
          imageFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        profilePictureUrl = uploadResponse.data.file_url;
      }

      // Update profile
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/profile`,
        {
          name: formData.name,
          profile_picture: profilePictureUrl
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUser(response.data);
      toast.success('Profil uğurla yeniləndi!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil yenilənə bilmədi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span>Profil Məlumatları</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={imagePreview || formData.profile_picture} alt={formData.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-3xl">
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <Label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">Şəkil yüklə</span>
                  </div>
                  <Input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
                <p className="text-xs text-gray-500">PNG, JPG və ya WEBP (maks. 5MB)</p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Ad və Soyad</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Adınız və soyadınız"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Email dəyişdirmək üçün Parametrlər bölməsinə keçin</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Ləğv et
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saxlanılır...' : 'Yadda saxla'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
