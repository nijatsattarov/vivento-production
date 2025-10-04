import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
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
  Eye
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const AdminPanel = () => {
  const { user, isAuthenticated } = useAuth();
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
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'toy',
    thumbnail_url: '',
    is_premium: false,
    background_color: '#ffffff',
    background_image: ''
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Check if user is admin (for demo purposes, checking email)
  const isAdmin = user?.email === 'admin@vivento.az' || user?.email?.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
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

  const deleteTemplate = (templateId) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    setStats(prev => ({ ...prev, totalTemplates: prev.totalTemplates - 1 }));
    toast.success('Şablon silindi');
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
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="users" data-testid="admin-users-tab">İstifadəçilər</TabsTrigger>
            <TabsTrigger value="events" data-testid="admin-events-tab">Tədbirlər</TabsTrigger>
            <TabsTrigger value="templates" data-testid="admin-templates-tab">Şablonlar</TabsTrigger>
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
            {/* Add Template Form */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Yeni Şablon Əlavə Et</CardTitle>
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
                            <Button variant="outline" size="sm">
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