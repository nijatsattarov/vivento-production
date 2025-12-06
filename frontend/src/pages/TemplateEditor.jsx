import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Palette, 
  Type, 
  Image, 
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Users,
  UserPlus,
  Share2,
  Copy
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const TemplateEditor = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get('template');
  const { token } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [templateAutoLoaded, setTemplateAutoLoaded] = useState(false);
  const [customFonts, setCustomFonts] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Editor state
  const [selectedElement, setSelectedElement] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNextStepModal, setShowNextStepModal] = useState(false);
  
  // Design elements state
  const [elements, setElements] = useState([
    {
      id: 'title',
      type: 'text',
      content: '',
      x: 50,
      y: 80,
      width: 300,
      height: 60,
      fontSize: 32,
      fontFamily: 'Space Grotesk',
      color: '#1f2937',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    {
      id: 'date',
      type: 'text', 
      content: '',
      x: 50,
      y: 160,
      width: 300,
      height: 40,
      fontSize: 18,
      fontFamily: 'Inter',
      color: '#6b7280',
      textAlign: 'center'
    },
    {
      id: 'location',
      type: 'text',
      content: '',
      x: 50,
      y: 220,
      width: 300,
      height: 40,
      fontSize: 16,
      fontFamily: 'Inter', 
      color: '#6b7280',
      textAlign: 'center'
    }
  ]);

  useEffect(() => {
    fetchEventData();
    fetchTemplates();
    fetchCustomFonts();
  }, [eventId]);

  const fetchCustomFonts = async () => {
    try {
      console.log('Fetching custom fonts from:', `${API_BASE_URL}/api/fonts`);
      const response = await axios.get(`${API_BASE_URL}/api/fonts`);
      console.log('Custom fonts response:', response.data);
      console.log('Number of fonts:', response.data.length);
      
      setCustomFonts(response.data);
      
      // Load font faces
      let loadedCount = 0;
      response.data.forEach(font => {
        console.log('Processing font:', font.name, 'URL:', font.url, 'Family:', font.font_family);
        
        if (font.url && font.font_family) {
          const fontUrl = font.url.startsWith('http') ? font.url : `${API_BASE_URL}${font.url}`;
          console.log('Loading font from:', fontUrl);
          
          const fontFace = new FontFace(font.font_family, `url(${fontUrl})`);
          fontFace.load()
            .then(() => {
              document.fonts.add(fontFace);
              loadedCount++;
              console.log(`✅ Font loaded successfully: ${font.name} (${loadedCount}/${response.data.length})`);
            })
            .catch(err => {
              console.error(`❌ Font yüklənə bilmədi: ${font.name}`, err);
            });
        } else {
          console.warn('Font missing url or font_family:', font.name);
        }
      });
      
      console.log(`Custom fonts set in state: ${response.data.length} fonts`);
    } catch (error) {
      console.error('Custom fonts yüklənə bilmədi:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  // Auto-load template if templateId is in URL
  useEffect(() => {
    if (templateIdFromUrl && availableTemplates.length > 0 && event && !templateAutoLoaded) {
      const selectedTemplate = availableTemplates.find(t => t.id === templateIdFromUrl);
      if (selectedTemplate) {
        console.log('Auto-loading template:', selectedTemplate.name);
        loadTemplate(selectedTemplate);
        setTemplateAutoLoaded(true);
        toast.success(`${selectedTemplate.name} şablonu avtomatik yükləndi`);
      }
    }
  }, [templateIdFromUrl, availableTemplates, event, templateAutoLoaded]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, selectedElement, dragOffset, zoom, canvasSize]);

  const fetchEventData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const eventData = response.data;
      setEvent(eventData);
      
      // Check if custom design exists (user has already edited)
      if (eventData.custom_design && eventData.custom_design.elements) {
        console.log('✅ Loading saved custom design:', eventData.custom_design);
        
        // Load saved custom design
        setElements(eventData.custom_design.elements);
        
        // Load canvas size if saved
        if (eventData.custom_design.canvasSize) {
          setCanvasSize(eventData.custom_design.canvasSize);
        }
        
        toast.success('Saxlanılmış dizayn yükləndi');
      } else {
        console.log('ℹ️ No custom design found, loading default elements');
        
        // Update default text elements with event data
        setElements(prev => prev.map(element => {
          if (element.id === 'title') {
            return { ...element, content: eventData.name };
          } else if (element.id === 'date') {
            return { ...element, content: new Date(eventData.date).toLocaleDateString('az-AZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Baku'
            }) };
          } else if (element.id === 'location') {
            return { ...element, content: eventData.location };
          }
          return element;
        }));
      }
      
    } catch (error) {
      console.error('Tədbir məlumatları alınarkən xəta:', error);
      toast.error('Tədbir tapılmadı');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates`);
      setAvailableTemplates(response.data);
    } catch (error) {
      console.error('Şablonlar yüklənərkən xəta:', error);
    }
  };

  const loadTemplate = (template) => {
    if (template.design_data && template.design_data.elements) {
      // Load template elements
      const templateElements = template.design_data.elements.map(el => ({
        ...el,
        id: el.id + '-' + Date.now() // Make IDs unique
      }));
      
      // Update elements with event data
      const updatedElements = templateElements.map(element => {
        // Toy mərasimi şablonları üçün
        if (element.content === 'Toy Mərasimi' || element.content === 'Tədbir adı') {
          return { ...element, content: event?.name || 'Tədbir adı' };
        } 
        // Elegant şablon üçün gəlin/kişi adları
        else if (element.content === 'GƏLİN ADI\n&\nKİŞİ ADI') {
          const eventName = event?.name || 'Gəlin & Kişi adları';
          return { ...element, content: eventName.replace(' toy', '').replace(' mərasimi', '') };
        }
        // Tarix məlumatları
        else if (element.content === 'Tədbir tarixi' || element.content?.includes('Dekabr') || element.content?.includes('18:00')) {
          return { ...element, content: event ? new Date(event.date).toLocaleDateString('az-AZ', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) + '\n' + new Date(event.date).toLocaleTimeString('az-AZ', {
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Tarix və vaxt' };
        }
        // Məkan məlumatları
        else if (element.content === 'Tədbir yeri' || element.content?.includes('məkanı ünvanı')) {
          return { ...element, content: event?.location || 'Toy məkanı\nÜnvan' };
        }
        return element;
      });
      
      setElements(updatedElements);
      
      // Update canvas size if specified
      if (template.design_data.canvasSize) {
        setCanvasSize(template.design_data.canvasSize);
      } else if (template.design_data.canvas) {
        setCanvasSize(template.design_data.canvas);
      }
      
      setShowTemplateSelector(false);
      toast.success(`${template.name} şablonu yükləndi`);
      
      // Auto-save the loaded template
      setTimeout(() => {
        saveDesign();
      }, 1000);
    }
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
  };

  const handleMouseDown = (e, element) => {
    e.preventDefault();
    setSelectedElement(element);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.parentElement.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement) return;
    
    e.preventDefault();
    const canvasRect = document.querySelector('[data-testid="design-canvas"]').getBoundingClientRect();
    
    const newX = Math.max(0, Math.min(
      canvasSize.width - selectedElement.width,
      ((e.clientX - canvasRect.left - dragOffset.x) / (zoom / 100))
    ));
    
    const newY = Math.max(0, Math.min(
      canvasSize.height - selectedElement.height,
      ((e.clientY - canvasRect.top - dragOffset.y) / (zoom / 100))
    ));

    updateElement(selectedElement.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
    
    if (selectedElement?.id === id) {
      setSelectedElement(prev => ({ ...prev, ...updates }));
    }
    
    // Auto-save after changes (debounced)
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
      saveDesign();
    }, 2000);
  };

  const addTextElement = () => {
    const newElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Yeni mətn',
      x: 50,
      y: 300 + elements.length * 40,
      width: 300,
      height: 40,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#374151',
      textAlign: 'left'
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/api/upload/background`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success('Şəkil yükləndi!');
      return response.data.file_url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Şəkil yüklənə bilmədi');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageElement = () => {
    const newElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop',
      x: 50,
      y: 400,
      width: 300,
      height: 200,
      borderRadius: 8
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
  };

  const deleteElement = (elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    toast.success('Element silindi');
  };

  const duplicateElement = (element) => {
    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
    toast.success('Element kopyalandı');
  };

  const saveDesign = async () => {
    setSaving(true);
    
    try {
      const designData = {
        canvasSize,
        elements
      };
      
      // Save design to backend by updating event
      const response = await axios.put(
        `${API_BASE_URL}/api/events/${eventId}`,
        {
          name: event.name,
          date: event.date,
          location: event.location,
          map_link: event.map_link,
          additional_notes: event.additional_notes,
          custom_design: designData  // Add custom design data
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Dizayn uğurla saxlanıldı!');
      
    } catch (error) {
      console.error('Dizayn saxlanılarkən xəta:', error);
      toast.error('Dizayn saxlanıla bilmədi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 25));

  if (loading) {
    return <LoadingSpinner text="Editor yüklənir..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            data-testid="back-to-event"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Tədbir səhifəsinə qayıt</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="editor-title">
                Dəvətnamə Editoru
              </h1>
              <p className="text-gray-600 mt-1">
                {event?.name} - Canva tipli drag & drop editor
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  const inviteUrl = `${window.location.origin}/invite/demo-${event?.id}`;
                  window.open(inviteUrl, '_blank');
                }}
                data-testid="preview-button"
              >
                <Eye className="mr-2 h-4 w-4" />
                Önizləmə
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const inviteUrl = `${window.location.origin}/invite/demo-${event?.id}`;
                  window.open(inviteUrl, '_blank');
                }}
                data-testid="preview-invitation-button"
              >
                <Eye className="mr-2 h-4 w-4" />
                Dəvətnamə Önizləməsi
              </Button>
              
              <Button 
                onClick={saveDesign}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="save-design-button"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saxlanılır...' : 'Saxla'}
              </Button>

              <Button 
                onClick={() => setShowNextStepModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="next-step-button"
              >
                <Users className="mr-2 h-4 w-4" />
                Növbəti Addım
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="elements" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="elements" data-testid="elements-tab">Elementlər</TabsTrigger>
                <TabsTrigger value="styles" data-testid="styles-tab">Üslub</TabsTrigger>
                <TabsTrigger value="settings" data-testid="settings-tab">Ayarlar</TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="space-y-4">
                {/* Template Selector */}
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Şablon seç</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                      variant="outline" 
                      className="w-full"
                      data-testid="template-selector-button"
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      {showTemplateSelector ? 'Şablonları gizlət' : 'Şablon seç'}
                    </Button>
                    
                    {showTemplateSelector && (
                      <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                        {availableTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => loadTemplate(template)}
                            className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all card-hover"
                            data-testid={`template-${template.id}`}
                          >
                            <div className="flex items-start space-x-3">
                              <img 
                                src={template.thumbnail_url} 
                                alt={template.name}
                                className="w-16 h-20 object-cover rounded border"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=64&h=80&fit=crop';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 truncate">{template.name}</div>
                                <div className="text-xs text-gray-500 capitalize mt-1">{template.category}</div>
                                <div className="flex items-center space-x-2 mt-2">
                                  {template.is_premium ? (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Premium</span>
                                  ) : (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Pulsuz</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Elementlər əlavə et</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={addTextElement}
                      variant="outline" 
                      className="w-full justify-start"
                      data-testid="add-text-button"
                    >
                      <Type className="mr-2 h-4 w-4" />
                      Mətn əlavə et
                    </Button>
                    
                    <Button 
                      onClick={addImageElement}
                      variant="outline" 
                      className="w-full justify-start"
                      data-testid="add-image-button"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Şəkil əlavə et
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      data-testid="add-shape-button"
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Forma əlavə et
                    </Button>
                  </CardContent>
                </Card>

                {/* Elements List */}
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      <Layers className="mr-2 h-4 w-4" />
                      Layerlər
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {elements.map((element, index) => (
                      <div
                        key={element.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedElement?.id === element.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        data-testid={`layer-${element.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center space-x-2 flex-1"
                            onClick={() => handleElementClick(element)}
                          >
                            {element.type === 'text' ? (
                              <Type className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Image className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-700 truncate">
                              {element.type === 'text' 
                                ? element.content || 'Mətn' 
                                : 'Şəkil'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateElement(element);
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-xs"
                              title="Kopyala"
                              data-testid={`duplicate-${element.id}`}
                            >
                              📄
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(element.id);
                              }}
                              className="p-1 hover:bg-red-100 rounded text-xs"
                              title="Sil"
                              data-testid={`delete-${element.id}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="styles" className="space-y-4">
                {selectedElement && (
                  <Card className="bg-white shadow-lg border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Element özəllikləri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedElement.type === 'text' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="element-content" className="text-xs">Mətn</Label>
                            <Textarea
                              id="element-content"
                              value={selectedElement.content}
                              onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                              className="min-h-[60px] text-sm"
                              data-testid="element-content-input"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="font-size" className="text-xs">Şrift ölçüsü</Label>
                            <Input
                              id="font-size"
                              type="number"
                              value={selectedElement.fontSize}
                              onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                              className="text-sm"
                              data-testid="font-size-input"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="font-family" className="text-xs">Şrift ailəsi</Label>
                            <select
                              id="font-family"
                              value={selectedElement.fontFamily}
                              onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                              className="w-full p-2 border border-gray-200 rounded text-sm"
                              data-testid="font-family-select"
                            >
                              <optgroup label="Standart Şriftlər">
                                <option value="Inter">Inter</option>
                                <option value="Space Grotesk">Space Grotesk</option>
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                                <option value="Poppins">Poppins</option>
                              </optgroup>
                              {customFonts.length > 0 && (
                                <optgroup label="Xüsusi Şriftlər">
                                  {customFonts.map(font => (
                                    <option key={font.id} value={font.font_family}>
                                      {font.name}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="text-color" className="text-xs">Rəng</Label>
                            <Input
                              id="text-color"
                              type="color"
                              value={selectedElement.color}
                              onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                              className="h-8"
                              data-testid="text-color-input"
                            />
                          </div>
                        </>
                      )}

                      {selectedElement.type === 'image' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Şəkil Yüklə</Label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const imageUrl = await handleImageUpload(file);
                                    if (imageUrl) {
                                      updateElement(selectedElement.id, { src: imageUrl });
                                    }
                                  }
                                }}
                                className="hidden"
                                id="image-upload"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('image-upload').click()}
                                disabled={uploadingImage}
                                className="w-full"
                              >
                                {uploadingImage ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Yüklənir...
                                  </>
                                ) : (
                                  <>
                                    <Image className="mr-2 h-4 w-4" />
                                    Şəkil yüklə
                                  </>
                                )}
                              </Button>
                              {selectedElement.src && (
                                <img 
                                  src={selectedElement.src} 
                                  alt="Preview" 
                                  className="w-full h-24 object-cover rounded border"
                                />
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="image-url" className="text-xs">və ya URL</Label>
                            <Input
                              id="image-url"
                              type="text"
                              value={selectedElement.src}
                              onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })}
                              placeholder="https://..."
                              className="text-xs"
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="element-x" className="text-xs">X pozisiya</Label>
                          <Input
                            id="element-x"
                            type="number"
                            value={selectedElement.x}
                            onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                            className="text-sm h-8"
                            data-testid="element-x-input"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="element-y" className="text-xs">Y pozisiya</Label>
                          <Input
                            id="element-y"
                            type="number"
                            value={selectedElement.y}
                            onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                            className="text-sm h-8"
                            data-testid="element-y-input"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Canvas ayarları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Zoom</span>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={handleZoomOut} data-testid="zoom-out">
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-12 text-center">{zoom}%</span>
                        <Button variant="outline" size="sm" onClick={handleZoomIn} data-testid="zoom-in">
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Grid göstər</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className={showGrid ? 'bg-blue-50 border-blue-200' : ''}
                        data-testid="toggle-grid"
                      >
                        <Grid className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Background Settings */}
                    <div className="space-y-3 pt-3 border-t">
                      <Label className="text-sm font-semibold">Fon</Label>
                      
                      {/* Solid Color */}
                      <div>
                        <Label className="text-xs text-gray-600">Bərk rəng</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="color"
                            value={canvasSize.background || '#ffffff'}
                            onChange={(e) => setCanvasSize(prev => ({ 
                              ...prev, 
                              background: e.target.value,
                              backgroundGradient: null 
                            }))}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={canvasSize.background || '#ffffff'}
                            onChange={(e) => setCanvasSize(prev => ({ 
                              ...prev, 
                              background: e.target.value,
                              backgroundGradient: null 
                            }))}
                            className="flex-1 font-mono text-xs"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      
                      {/* Gradient */}
                      <div>
                        <Label className="text-xs text-gray-600">Gradient</Label>
                        <div className="space-y-2 mt-1">
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={canvasSize.gradientStart || '#ffffff'}
                              onChange={(e) => {
                                const start = e.target.value;
                                const end = canvasSize.gradientEnd || '#000000';
                                setCanvasSize(prev => ({
                                  ...prev,
                                  gradientStart: start,
                                  gradientEnd: end,
                                  backgroundGradient: `linear-gradient(to bottom, ${start}, ${end})`
                                }));
                              }}
                              className="w-16 h-8 cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">→</span>
                            <Input
                              type="color"
                              value={canvasSize.gradientEnd || '#000000'}
                              onChange={(e) => {
                                const start = canvasSize.gradientStart || '#ffffff';
                                const end = e.target.value;
                                setCanvasSize(prev => ({
                                  ...prev,
                                  gradientStart: start,
                                  gradientEnd: end,
                                  backgroundGradient: `linear-gradient(to bottom, ${start}, ${end})`
                                }));
                              }}
                              className="w-16 h-8 cursor-pointer"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCanvasSize(prev => ({
                                ...prev,
                                backgroundGradient: null,
                                gradientStart: null,
                                gradientEnd: null
                              }))}
                              className="text-xs"
                            >
                              Təmizlə
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">Yuxarıdan aşağıya gradient</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-lg border-0 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Dəvətnamə dizaynı</CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" data-testid="undo-button">
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid="redo-button">
                      <Redo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid="download-button">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Canvas Container */}
                <div className="flex justify-center p-4 md:p-8 bg-gray-50 rounded-lg overflow-x-auto">
                  <div 
                    className="canvas-container relative border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden mx-auto"
                    style={{ 
                      width: canvasSize.width * (zoom / 100), 
                      height: canvasSize.height * (zoom / 100),
                      minWidth: '280px',
                      maxWidth: '100%',
                      background: canvasSize.backgroundGradient || canvasSize.background || '#ffffff',
                      backgroundImage: canvasSize.backgroundImage ? 
                        `url(${canvasSize.backgroundImage})${showGrid ? ', linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)' : ''}` : 
                        showGrid ? `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)` : 'none',
                      backgroundSize: canvasSize.backgroundImage ? 
                        `cover${showGrid ? ', 20px 20px, 20px 20px' : ''}` : 
                        showGrid ? '20px 20px' : 'auto',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                    data-testid="design-canvas"
                  >
                    {elements.map((element) => (
                      <div
                        key={element.id}
                        onMouseDown={(e) => handleMouseDown(e, element)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleElementClick(element);
                        }}
                        className={`absolute cursor-move transition-all select-none ${
                          selectedElement?.id === element.id 
                            ? 'ring-2 ring-blue-500 shadow-lg' 
                            : 'hover:ring-1 hover:ring-gray-300'
                        } ${isDragging && selectedElement?.id === element.id ? 'z-50' : 'z-10'}`}
                        style={{
                          left: element.x * (zoom / 100),
                          top: element.y * (zoom / 100),
                          width: element.width * (zoom / 100),
                          height: element.height * (zoom / 100),
                        }}
                        data-testid={`canvas-element-${element.id}`}
                      >
                        {element.type === 'text' && (
                          <div
                            style={{
                              fontSize: element.fontSize * (zoom / 100),
                              fontFamily: element.fontFamily,
                              color: element.color,
                              fontWeight: element.fontWeight,
                              textAlign: element.textAlign,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'
                            }}
                          >
                            {element.content}
                          </div>
                        )}
                        
                        {element.type === 'image' && (
                          <img
                            src={element.src}
                            alt="Design element"
                            className="w-full h-full object-cover"
                            style={{
                              borderRadius: element.borderRadius * (zoom / 100)
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Next Step Modal */}
      {showNextStepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-center">Dəvətnaməniz hazırdır! 🎉</h3>
            <p className="text-gray-600 mb-6 text-center">
              İndi qonaqlarınızı dəvət edin və ya birbaşa link paylaşın
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowNextStepModal(false);
                  navigate(`/events/${eventId}`);
                }}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                <span>Qonaq Əlavə Et</span>
              </button>
              
              <button
                onClick={() => {
                  const inviteUrl = `${window.location.origin}/events/${eventId}/share`;
                  navigator.clipboard.writeText(inviteUrl).then(() => {
                    toast.success('Link panoya kopyalandı!');
                    setShowNextStepModal(false);
                  });
                }}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>Link Paylaş</span>
              </button>
              
              <button
                onClick={() => {
                  const inviteUrl = `${window.location.origin}/invite/demo-${eventId}`;
                  navigator.clipboard.writeText(inviteUrl).then(() => {
                    toast.success('Demo link kopyalandı!');
                  });
                }}
                className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-5 w-5" />
                <span>Demo Link Kopyala</span>
              </button>
            </div>
            
            <div className="flex justify-center mt-4">
              <button 
                onClick={() => setShowNextStepModal(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Daha sonra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;