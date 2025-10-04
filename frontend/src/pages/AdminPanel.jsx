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
    background_image: '',
    elements: []
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

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

  const editTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      category: template.category,
      thumbnail_url: template.thumbnail_url,
      is_premium: template.is_premium,
      background_color: template.design_data?.canvasSize?.background || '#ffffff',
      background_image: template.design_data?.canvasSize?.backgroundImage || '',
      elements: template.design_data?.elements || []
    });
    setShowTemplateBuilder(true);
  };

  const saveEditedTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const templateData = {
        ...editingTemplate,
        name: newTemplate.name,
        category: newTemplate.category,
        thumbnail_url: newTemplate.thumbnail_url,
        is_premium: newTemplate.is_premium,
        design_data: {
          canvasSize: {
            width: 400,
            height: 600,
            background: newTemplate.background_color,
            backgroundImage: newTemplate.background_image
          },
          elements: newTemplate.elements
        },
        updated_at: new Date().toISOString()
      };

      await axios.put(`${API_BASE_URL}/api/admin/templates/${editingTemplate.id}`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchAdminData();
      setShowTemplateBuilder(false);
      setEditingTemplate(null);
      toast.success('Şablon yeniləndi!');
    } catch (error) {
      toast.error('Şablon yenilənə bilmədi');
    }
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
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="users" data-testid="admin-users-tab">İstifadəçilər</TabsTrigger>
            <TabsTrigger value="events" data-testid="admin-events-tab">Tədbirlər</TabsTrigger>
            <TabsTrigger value="templates" data-testid="admin-templates-tab">Şablonlar</TabsTrigger>
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
            {/* Template Builder Toggle */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Şablon İdarəetməsi
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={() => {
                        setShowTemplateBuilder(!showTemplateBuilder);
                        setEditingTemplate(null);
                        setNewTemplate({
                          name: '',
                          category: 'toy',
                          thumbnail_url: '',
                          is_premium: false,
                          background_color: '#ffffff',
                          background_image: '',
                          elements: []
                        });
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid="toggle-template-builder"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {showTemplateBuilder ? 'Builder-i Bağla' : 'Yeni Şablon Yarat'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              {showTemplateBuilder && (
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Template Settings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Şablon Parametrləri</h3>
                      
                      <div>
                        <Label htmlFor="builder-name">Şablon Adı</Label>
                        <Input
                          id="builder-name"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Şablon adı"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="builder-category">Kateqoriya</Label>
                        <select
                          id="builder-category"
                          value={newTemplate.category}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="toy">💍 Toy</option>
                          <option value="nişan">💖 Nişan</option>
                          <option value="doğum_günü">🎂 Ad günü</option>
                          <option value="korporativ">🏢 Korporativ</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="builder-bg-color">Fon Rəngi</Label>
                        <Input
                          id="builder-bg-color"
                          type="color"
                          value={newTemplate.background_color}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, background_color: e.target.value }))}
                          className="h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="builder-bg-image">Fon Şəkli URL</Label>
                        <Input
                          id="builder-bg-image"
                          value={newTemplate.background_image}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, background_image: e.target.value }))}
                          placeholder="https://example.com/bg.jpg"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="builder-premium"
                          checked={newTemplate.is_premium}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, is_premium: e.target.checked }))}
                        />
                        <Label htmlFor="builder-premium">Premium Şablon</Label>
                      </div>
                      
                      {/* Element Tools */}
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium">Element Əlavə Et</h4>
                        <div className="flex flex-col space-y-2">
                          <Button onClick={() => addElement('text')} variant="outline" className="w-full">
                            <Type className="mr-2 h-4 w-4" />
                            Mətn Əlavə Et
                          </Button>
                          <Button onClick={() => addElement('image')} variant="outline" className="w-full">
                            <Image className="mr-2 h-4 w-4" />
                            Şəkil Əlavə Et
                          </Button>
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      <Button 
                        onClick={editingTemplate ? saveEditedTemplate : handleAddTemplate}
                        disabled={isAddingTemplate}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isAddingTemplate ? 'Saxlanılır...' : editingTemplate ? 'Yeniləmələri Saxla' : 'Şablon Yarat'}
                      </Button>
                    </div>
                    
                    {/* Canvas Preview */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Canlı Önizləmə</h3>
                      <div 
                        className="relative border-2 border-gray-200 rounded-lg overflow-hidden mx-auto"
                        style={{
                          width: '300px',
                          height: '450px',
                          backgroundColor: newTemplate.background_color,
                          backgroundImage: newTemplate.background_image ? `url(${newTemplate.background_image})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {newTemplate.elements.map((element) => (
                          <div
                            key={element.id}
                            onClick={() => setSelectedElement(element)}
                            className={`absolute cursor-pointer transition-all ${
                              selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-400'
                            }`}
                            style={{
                              left: (element.x * 0.75) + 'px',
                              top: (element.y * 0.75) + 'px',
                              width: (element.width * 0.75) + 'px',
                              height: (element.height * 0.75) + 'px',
                            }}
                          >
                            {element.type === 'text' && (
                              <div
                                style={{
                                  fontSize: (element.fontSize * 0.75) + 'px',
                                  fontFamily: element.fontFamily,
                                  color: element.color,
                                  fontWeight: element.fontWeight,
                                  textAlign: element.textAlign,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                  whiteSpace: 'pre-line'
                                }}
                              >
                                {element.content}
                              </div>
                            )}
                            
                            {element.type === 'image' && (
                              <img
                                src={element.src}
                                alt="Element"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop';
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Element Properties */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Element Parametrləri</h3>
                      
                      {selectedElement ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Seçilmiş: {selectedElement.type === 'text' ? 'Mətn' : 'Şəkil'}</span>
                            <Button onClick={() => deleteElement(selectedElement.id)} variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {selectedElement.type === 'text' && (
                            <>
                              <div>
                                <Label>Mətn</Label>
                                <textarea
                                  value={selectedElement.content}
                                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  rows={3}
                                />
                              </div>
                              
                              <div>
                                <Label>Şrift Ölçüsü</Label>
                                <Input
                                  type="number"
                                  value={selectedElement.fontSize}
                                  onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                />
                              </div>
                              
                              <div>
                                <Label>Şrift Ailəsi</Label>
                                <select
                                  value={selectedElement.fontFamily}
                                  onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                  <option value="Inter">Inter</option>
                                  <option value="Space Grotesk">Space Grotesk</option>
                                  <option value="Playfair Display">Playfair Display</option>
                                </select>
                              </div>
                              
                              <div>
                                <Label>Rəng</Label>
                                <Input
                                  type="color"
                                  value={selectedElement.color}
                                  onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                  className="h-10"
                                />
                              </div>
                            </>
                          )}
                          
                          {selectedElement.type === 'image' && (
                            <div>
                              <Label>Şəkil URL</Label>
                              <Input
                                value={selectedElement.src}
                                onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                          )}
                          
                          {/* Position */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>X pozisiya</Label>
                              <Input
                                type="number"
                                value={selectedElement.x}
                                onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>Y pozisiya</Label>
                              <Input
                                type="number"
                                value={selectedElement.y}
                                onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Eni</Label>
                              <Input
                                type="number"
                                value={selectedElement.width}
                                onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>Hündürlüyü</Label>
                              <Input
                                type="number"
                                value={selectedElement.height}
                                onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Element seçin və ya yenisini əlavə edin</p>
                      )}
                      
                      {/* Elements List */}
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium">Elementlər ({newTemplate.elements.length})</h4>
                        {newTemplate.elements.map((element) => (
                          <div
                            key={element.id}
                            onClick={() => setSelectedElement(element)}
                            className={`p-2 border rounded cursor-pointer ${
                              selectedElement?.id === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {element.type === 'text' ? '📝' : '🖼️'} {element.type === 'text' ? element.content?.substring(0, 20) + '...' : 'Şəkil'}
                              </span>
                              <Button onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(element.id);
                              }} variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
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
                      <Label htmlFor="site-logo">Sayt Loqosu URL</Label>
                      <Input
                        id="site-logo"
                        placeholder="https://example.com/logo.png"
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">Tövsiyə olunan ölçü: 200x60px</p>
                    </div>
                    <div>
                      <Label>Cari Logo</Label>
                      <div className="mt-2 p-4 border rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">V</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Vivento (Default)</p>
                      </div>
                    </div>
                  </div>
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
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="save-site-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Sayt Ayarlarını Saxla
                </Button>
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