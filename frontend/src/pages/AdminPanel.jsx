import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminTemplateBuilder from '../components/AdminTemplateBuilder';
import CMSManager from '../components/admin/CMSManager';
import BlogManager from '../components/admin/BlogManager';
import SliderManager from '../components/admin/SliderManager';
import FontManager from '../components/admin/FontManager';
import { 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Crown,
  Eye,
  Type,
  Image
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const AdminPanel = () => {
  const { user, isAuthenticated, token } = useAuth();
  const { updateSettings, refreshSettings } = useSiteSettings();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalTemplates: 0,
    premiumUsers: 0
  });
  const [siteSettings, setSiteSettings] = useState({
    site_logo: null,
    hero_title: '',
    hero_subtitle: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: ''
  });
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'toy',
    thumbnail_url: '',
    is_premium: false,
    background_color: '#ffffff',
    background_image: '',
    elements: []
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [builderTemplate, setBuilderTemplate] = useState(null);
  const [siteLogoUrl, setSiteLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Check if user is admin (for demo purposes, checking email)
  const isAdmin = user?.email === 'admin@vivento.az' || user?.email?.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      fetchSiteSettings();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch users (we'll use events endpoint and mock users for demo)
      const usersResponse = await axios.get(`${API_BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch templates
      const templatesResponse = await axios.get(`${API_BASE_URL}/api/templates`);
      
      setUsers([
        { id: '1', name: 'Test İstifadəçisi', email: 'test@example.com', subscription_type: 'free', created_at: new Date() },
        { id: '2', name: 'Admin', email: 'admin@vivento.az', subscription_type: 'premium', created_at: new Date() }
      ]);
      setEvents(usersResponse.data);
      setTemplates(templatesResponse.data);
      
      setStats({
        totalUsers: 2,
        totalEvents: usersResponse.data.length,
        totalTemplates: templatesResponse.data.length,
        premiumUsers: 1
      });
      
    } catch (error) {
      console.error('Admin məlumatları yüklənərkən xəta:', error);
      toast.error('Məlumatlar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/site/settings`);
      if (response.ok) {
        const settings = await response.json();
        console.log('Loaded site settings:', settings);
        
        // Update state and form fields
        setSiteLogoUrl(settings.site_logo || '');
        setSiteSettings({
          site_logo: settings.site_logo || '',
          hero_title: settings.hero_title || '',
          hero_subtitle: settings.hero_subtitle || '',
          facebook_url: settings.facebook_url || '',
          instagram_url: settings.instagram_url || '',
          tiktok_url: settings.tiktok_url || ''
        });
        
        // Update form inputs
        setTimeout(() => {
          const heroTitleInput = document.getElementById('hero-title');
          const heroSubtitleInput = document.getElementById('hero-subtitle');
          
          if (heroTitleInput && settings.hero_title) {
            heroTitleInput.value = settings.hero_title;
          }
          if (heroSubtitleInput && settings.hero_subtitle) {
            heroSubtitleInput.value = settings.hero_subtitle;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Site settings fetch error:', error);
    }
  };

  const updateUserSubscription = (userId, newType) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, subscription_type: newType } : user
    ));
    toast.success('İstifadəçi abunəliyi yeniləndi');
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.category) {
      toast.error('Ad və kateqoriya daxil edilməlidir');
      return;
    }

    setIsAddingTemplate(true);

    try {
      // Create new template object
      const templateData = {
        id: `template-${Date.now()}`,
        name: newTemplate.name,
        category: newTemplate.category,
        thumbnail_url: newTemplate.thumbnail_url || 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=600&fit=crop',
        is_premium: newTemplate.is_premium,
        design_data: {
          canvasSize: {
            width: 400,
            height: 600,
            background: newTemplate.background_color,
            backgroundImage: newTemplate.background_image
          },
          elements: newTemplate.elements || [
            {
              id: 'title',
              type: 'text',
              content: 'Tədbir Adı',
              x: 50, y: 100, width: 300, height: 60,
              fontSize: 28, fontFamily: 'Space Grotesk',
              color: '#1f2937', fontWeight: 'bold', textAlign: 'center'
            },
            {
              id: 'date',
              type: 'text',
              content: 'Tədbir Tarixi',
              x: 50, y: 180, width: 300, height: 40,
              fontSize: 16, fontFamily: 'Inter',
              color: '#6b7280', textAlign: 'center'
            },
            {
              id: 'location',
              type: 'text',
              content: 'Tədbir Yeri',
              x: 50, y: 220, width: 300, height: 40,
              fontSize: 14, fontFamily: 'Inter',
              color: '#9ca3af', textAlign: 'center'
            }
          ]
        },
        created_at: new Date().toISOString()
      };

      // Save to backend instead of local state
      const response = await axios.post(`${API_BASE_URL}/api/admin/templates`, templateData);
      
      // Refresh templates list
      await fetchAdminData();
      
      // Reset form
      setNewTemplate({
        name: '',
        category: 'toy',
        thumbnail_url: '',
        is_premium: false,
        background_color: '#ffffff',
        background_image: '',
        elements: []
      });

      toast.success('Şablon uğurla əlavə edildi!');
    } catch (error) {
      console.error('Template add error:', error);
      toast.error('Şablon əlavə edilə bilmədi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsAddingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/api/admin/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchAdminData(); // Refresh
      toast.success('Şablon silindi');
    } catch (error) {
      toast.error('Şablon silinə bilmədi');
    }
  };

  const addElement = (type) => {
    const newElement = {
      id: `${type}-${Date.now()}`,
      type: type,
      content: type === 'text' ? 'Yeni mətn' : 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop',
      x: 50 + (newTemplate.elements.length * 20),
      y: 100 + (newTemplate.elements.length * 40),
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 40 : 150,
      fontSize: type === 'text' ? 16 : undefined,
      fontFamily: type === 'text' ? 'Inter' : undefined,
      color: type === 'text' ? '#374151' : undefined,
      textAlign: type === 'text' ? 'center' : undefined,
      src: type === 'image' ? 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop' : undefined
    };
    
    setNewTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElement(newElement);
  };

  const updateElement = (elementId, updates) => {
    setNewTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteElement = (elementId) => {
    setNewTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylları qəbul edilir');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fayl ölçüsü 5MB-dan böyük ola bilməz');
      return;
    }

    try {
      setIsUploadingLogo(true);
      console.log('Starting upload...');
      console.log('API Base URL:', API_BASE_URL);
      console.log('Token present:', !!token);
      console.log('Full upload URL:', `${API_BASE_URL}/api/upload/image`);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload xətası: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload success result:', result);
      
      setSiteLogoUrl(result.url);
      
      // Update global site settings context immediately
      console.log('Updating global settings with logo:', result.url);
      updateSettings({ site_logo: result.url });
      console.log('Settings update called');
      
      toast.success('Logo uğurla yükləndi');
      
      // Clear file input after successful upload
      e.target.value = '';
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(`Logo yüklənərkən xəta: ${error.message}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSiteSettings = async () => {
    try {
      console.log('Starting save process...');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('API Base URL:', API_BASE_URL);
      console.log('Site Logo URL:', siteLogoUrl);

      // Collect all site settings
      const heroTitle = document.getElementById('hero-title')?.value || '';
      const heroSubtitle = document.getElementById('hero-subtitle')?.value || '';

      const requestData = {
        site_logo: siteLogoUrl || null,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        facebook_url: siteSettings.facebook_url || null,
        instagram_url: siteSettings.instagram_url || null,
        tiktok_url: siteSettings.tiktok_url || null
      };

      console.log('Request data:', requestData);

      const response = await fetch(`${API_BASE_URL}/api/site/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        
        let errorMessage = 'Ayarlar saxlanılarkən xəta baş verdi';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
          // Keep default message if parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success result:', result);
      
      // Update local state with saved data
      if (result.settings) {
        setSiteLogoUrl(result.settings.site_logo || '');
        
        // Update global site settings context
        updateSettings({
          site_logo: result.settings.site_logo,
          hero_title: result.settings.hero_title,
          hero_subtitle: result.settings.hero_subtitle
        });
        
        // Update form fields with saved values
        const heroTitleInput = document.getElementById('hero-title');
        const heroSubtitleInput = document.getElementById('hero-subtitle');
        
        if (heroTitleInput) heroTitleInput.value = result.settings.hero_title || '';
        if (heroSubtitleInput) heroSubtitleInput.value = result.settings.hero_subtitle || '';
      }
      
      toast.success('Sayt ayarları uğurla saxlanıldı!');
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error(error.message || 'Ayarlar saxlanılarkən xəta baş verdi');
    }
  };

  const editTemplate = (template) => {
    setBuilderTemplate(template);
    setEditingTemplate(template);
    setShowTemplateBuilder(true);
  };

  const handleBuilderSave = async (templateData) => {
    try {
      if (!token) {
        toast.error('Giriş tələb olunur. Zəhmət olmasa yenidən daxil olun.');
        return;
      }
      
      if (editingTemplate) {
        // Update existing template
        await axios.put(`${API_BASE_URL}/api/admin/templates/${editingTemplate.id}`, templateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Şablon yeniləndi!');
      } else {
        // Create new template
        const newTemplateData = {
          ...templateData,
          id: `template-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        
        await axios.post(`${API_BASE_URL}/api/admin/templates`, newTemplateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Şablon əlavə edildi!');
      }
      
      await fetchAdminData();
      setShowTemplateBuilder(false);
      setEditingTemplate(null);
      setBuilderTemplate(null);
    } catch (error) {
      console.error('Şablon saxlanma xətası:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Şablon əlavə edilə bilmədi: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBuilderCancel = () => {
    setShowTemplateBuilder(false);
    setEditingTemplate(null);
    setBuilderTemplate(null);
  };

  const openTemplateBuilder = () => {
    setBuilderTemplate(null);
    setEditingTemplate(null);
    setShowTemplateBuilder(true);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Card className="bg-white shadow-lg border-0 p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Giriş Qadağandır</h1>
            <p className="text-gray-600">
              Admin panelinə giriş üçün admin hesabı lazımdır.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Demo üçün admin@vivento.az email-i ilə qeydiyyatdan keçin.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Admin paneli yüklənir..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="h-6 w-6 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-panel-title">
              Admin Paneli
            </h1>
          </div>
          <p className="text-gray-600">
            Vivento platformasını idarə edin və statistikaları izləyin
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0" data-testid="admin-stats-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Ümumi İstifadəçi</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0" data-testid="admin-stats-events">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Ümumi Tədbir</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0" data-testid="admin-stats-templates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Şablonlar</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalTemplates}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0" data-testid="admin-stats-premium">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Premium İstifadəçi</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{stats.premiumUsers}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Crown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-[1100px]">
            <TabsTrigger value="users" data-testid="admin-users-tab">İstifadəçilər</TabsTrigger>
            <TabsTrigger value="events" data-testid="admin-events-tab">Tədbirlər</TabsTrigger>
            <TabsTrigger value="templates" data-testid="admin-templates-tab">Şablonlar</TabsTrigger>
            <TabsTrigger value="slider" data-testid="admin-slider-tab">Slider</TabsTrigger>
            <TabsTrigger value="fonts" data-testid="admin-fonts-tab">Fontlar</TabsTrigger>
            <TabsTrigger value="cms" data-testid="admin-cms-tab">CMS</TabsTrigger>
            <TabsTrigger value="blog" data-testid="admin-blog-tab">Bloq</TabsTrigger>
            <TabsTrigger value="site" data-testid="admin-site-tab">Sayt</TabsTrigger>
            <TabsTrigger value="settings" data-testid="admin-settings-tab">Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  İstifadəçi İdarəetməsi
                  <Badge variant="secondary">{users.length} istifadəçi</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`admin-user-${user.id}`}>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Qeydiyyat: {new Date(user.created_at).toLocaleDateString('az-AZ')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={
                            user.subscription_type === 'premium' 
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : user.subscription_type === 'vip'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        >
                          {user.subscription_type === 'free' ? 'Pulsuz' : 
                           user.subscription_type === 'premium' ? 'Premium' : 'VIP'}
                        </Badge>
                        
                        <select
                          value={user.subscription_type}
                          onChange={(e) => updateUserSubscription(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          data-testid={`user-subscription-${user.id}`}
                        >
                          <option value="free">Pulsuz</option>
                          <option value="premium">Premium</option>
                          <option value="vip">VIP</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Tədbir İdarəetməsi
                  <Badge variant="secondary">{events.length} tədbir</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Hələ ki tədbir yoxdur
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`admin-event-${event.id}`}>
                        <div>
                          <h3 className="font-semibold text-gray-900">{event.name}</h3>
                          <p className="text-sm text-gray-600">{event.location}</p>
                          <p className="text-xs text-gray-500">
                            Tarix: {new Date(event.date).toLocaleDateString('az-AZ')}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {showTemplateBuilder ? (
              /* Template Builder Interface */
              <div className="bg-white rounded-lg shadow-lg p-6">
                <AdminTemplateBuilder
                  template={builderTemplate}
                  onSave={handleBuilderSave}
                  onCancel={handleBuilderCancel}
                  isEditing={!!editingTemplate}
                />
              </div>
            ) : (
              <>
                {/* Template Management Header */}
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Şablon İdarəetməsi
                      <Button 
                        onClick={openTemplateBuilder}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        data-testid="open-template-builder"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Şablon Yarat
                      </Button>
                    </CardTitle>
                  </CardHeader>
                </Card>
                {/* Existing Templates */}
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Mövcud Şablonlar ({templates.length})</CardTitle>
                  </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Şablon Adı</Label>
                      <Input
                        id="template-name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="məs: Elegant Toy Şablonu"
                        data-testid="template-name-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-category">Kateqoriya</Label>
                      <select
                        id="template-category"
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        data-testid="template-category-select"
                      >
                        <option value="toy">💍 Toy</option>
                        <option value="nişan">💖 Nişan</option>
                        <option value="doğum_günü">🎂 Ad günü</option>
                        <option value="korporativ">🏢 Korporativ</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="template-thumbnail">Thumbnail URL</Label>
                      <Input
                        id="template-thumbnail"
                        value={newTemplate.thumbnail_url}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        data-testid="template-thumbnail-input"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="template-premium"
                        checked={newTemplate.is_premium}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, is_premium: e.target.checked }))}
                        data-testid="template-premium-checkbox"
                      />
                      <Label htmlFor="template-premium">Premium Şablon</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="background-color">Fon Rəngi</Label>
                      <Input
                        id="background-color"
                        type="color"
                        value={newTemplate.background_color}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, background_color: e.target.value }))}
                        className="h-12"
                        data-testid="background-color-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="background-image">Fon Şəkli URL</Label>
                      <Input
                        id="background-image"
                        value={newTemplate.background_image}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, background_image: e.target.value }))}
                        placeholder="https://example.com/background.jpg"
                        data-testid="background-image-input"
                      />
                    </div>
                    
                    {/* Preview */}
                    <div>
                      <Label>Önizləmə</Label>
                      <div 
                        className="w-full h-40 border rounded-lg p-4 relative overflow-hidden"
                        style={{ 
                          backgroundColor: newTemplate.background_color,
                          backgroundImage: newTemplate.background_image ? `url(${newTemplate.background_image})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-lg">Tədbir Adı</h3>
                          <p className="text-sm">Tədbir Tarixi</p>
                          <p className="text-xs">Tədbir Yeri</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddTemplate}
                      disabled={isAddingTemplate}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      data-testid="submit-add-template"
                    >
                      {isAddingTemplate ? 'Əlavə edilir...' : 'Şablon Əlavə Et'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Mövcud Şablonlar
                  <Badge variant="secondary">{templates.length} şablon</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 space-y-3" data-testid={`admin-template-${template.id}`}>
                      <img 
                        src={template.thumbnail_url} 
                        alt={template.name}
                        className="w-full h-32 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-600 capitalize">{template.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={template.is_premium ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {template.is_premium ? 'Premium' : 'Pulsuz'}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => editTemplate(template)}
                              data-testid={`edit-template-${template.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => deleteTemplate(template.id)}
                              data-testid={`delete-template-${template.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="site" className="space-y-6">
            {/* Site Management */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Sayt İdarəetməsi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Logo Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Logo İdarəetməsi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="site-logo">Sayt Loqosu</Label>
                      <div className="mt-2 space-y-3">
                        <div>
                          <Label className="text-sm">URL ilə əlavə et</Label>
                          <Input
                            id="site-logo"
                            placeholder="https://example.com/logo.png"
                            value={siteLogoUrl}
                            onChange={(e) => {
                              console.log('URL input changed:', e.target.value);
                              setSiteLogoUrl(e.target.value);
                              console.log('siteLogoUrl updated to:', e.target.value);
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">və ya</span>
                        </div>
                        <div>
                          <Label className="text-sm">Fayl yüklə</Label>
                          <Input
                            type="file"
                            accept="image/*,image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleLogoUpload}
                            disabled={isUploadingLogo}
                            className="mt-1 disabled:opacity-50"
                          />
                          {isUploadingLogo && (
                            <p className="text-sm text-blue-600 mt-1">
                              <span className="animate-spin inline-block">⏳</span> Logo yüklənir...
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Tövsiyə olunan ölçü: 200x60px</p>
                    </div>
                    <div>
                      <Label>Cari Logo</Label>
                      <div className="mt-2 p-4 border rounded-lg">
                        {siteLogoUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={siteLogoUrl} 
                              alt="Site Logo" 
                              className="max-w-[200px] max-h-[60px] object-contain"
                              onError={(e) => {
                                try {
                                  console.error('Logo load error:', e);
                                  if (e && e.target && e.target.style) {
                                    e.target.style.display = 'none';
                                  }
                                  if (e && e.target && e.target.parentElement) {
                                    const errorDiv = e.target.parentElement.querySelector('.logo-error-fallback');
                                    if (errorDiv && errorDiv.style) {
                                      errorDiv.style.display = 'block';
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error in logo onError handler:', error);
                                }
                              }}
                            />
                            <div className="logo-error-fallback" style={{display: 'none'}}>
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 font-bold text-sm">!</span>
                              </div>
                              <p className="text-xs text-red-500 mt-1">Logo yüklənə bilmədi</p>
                            </div>
                            <p className="text-xs text-gray-500">Cari logo</p>
                          </div>
                        ) : (
                          <div>
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">V</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Vivento (Default)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sosial Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook-url">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <span>Facebook</span>
                        </div>
                      </Label>
                      <Input
                        id="facebook-url"
                        placeholder="https://facebook.com/vivento"
                        value={siteSettings.facebook_url || ''}
                        onChange={(e) => setSiteSettings({...siteSettings, facebook_url: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram-url">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span>Instagram</span>
                        </div>
                      </Label>
                      <Input
                        id="instagram-url"
                        placeholder="https://instagram.com/vivento"
                        value={siteSettings.instagram_url || ''}
                        onChange={(e) => setSiteSettings({...siteSettings, instagram_url: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktok-url">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                          <span>TikTok</span>
                        </div>
                      </Label>
                      <Input
                        id="tiktok-url"
                        placeholder="https://tiktok.com/@vivento"
                        value={siteSettings.tiktok_url || ''}
                        onChange={(e) => setSiteSettings({...siteSettings, tiktok_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Sosial media hesablarınızı əlavə edin. Bunlar footer-də görünəcək.
                  </p>
                </div>

                {/* Categories Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kateqoriya İdarəetməsi</h3>
                  <div className="space-y-4">
                    {/* Add Category */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <Input placeholder="Kateqoriya adı" />
                      <Input placeholder="Emoji (💍)" />
                      <Input placeholder="Şablon sayı" type="number" />
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Əlavə Et
                      </Button>
                    </div>

                    {/* Existing Categories */}
                    <div className="space-y-3">
                      {[
                        { name: 'Toy', emoji: '💍', count: 15, color: 'from-pink-400 to-red-400' },
                        { name: 'Nişan', emoji: '💖', count: 8, color: 'from-purple-400 to-pink-400' },
                        { name: 'Ad günü', emoji: '🎂', count: 12, color: 'from-yellow-400 to-orange-400' },
                        { name: 'Korporativ', emoji: '🏢', count: 6, color: 'from-blue-400 to-indigo-400' }
                      ].map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center text-lg`}>
                              {category.emoji}
                            </div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-gray-500">{category.count} şablon</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Homepage Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ana Səhifə Məzmunu</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="hero-title">Əsas Başlıq</Label>
                      <Input
                        id="hero-title"
                        defaultValue="Rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hero-subtitle">Alt Başlıq</Label>
                      <textarea
                        id="hero-subtitle"
                        defaultValue="Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın."
                        className="w-full p-3 border border-gray-300 rounded-md mt-2"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveSiteSettings}
                  className="bg-blue-600 hover:bg-blue-700" 
                  data-testid="save-site-settings"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Sayt Ayarlarını Saxla
                </Button>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="slider" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Hero Slider İdarəetməsi</CardTitle>
              </CardHeader>
              <CardContent>
                <SliderManager token={token} />
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="fonts" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Font İdarəetməsi</CardTitle>
              </CardHeader>
              <CardContent>
                <FontManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cms" className="space-y-6">
            <CMSManager token={token} />
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <BlogManager token={token} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Platform Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Abunəlik Qiymətləri</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="premium-price">Premium Qiyməti (₼)</Label>
                        <Input id="premium-price" type="number" placeholder="9.99" />
                      </div>
                      
                      <div>
                        <Label htmlFor="vip-price">VIP Qiyməti (₼)</Label>
                        <Input id="vip-price" type="number" placeholder="19.99" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Platform Limitləri</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="free-event-limit">Pulsuz Tədbir Limiti</Label>
                        <Input id="free-event-limit" type="number" placeholder="1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="free-guest-limit">Pulsuz Qonaq Limiti</Label>
                        <Input id="free-guest-limit" type="number" placeholder="50" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="save-settings-button">
                  <Settings className="mr-2 h-4 w-4" />
                  Ayarları Saxla
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;