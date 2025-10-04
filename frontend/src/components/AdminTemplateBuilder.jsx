import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Type, 
  Image, 
  Palette, 
  Move,
  Trash2,
  Copy,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Save,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Users,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

const AdminTemplateBuilder = ({ 
  template, 
  onSave, 
  onCancel, 
  isEditing = false 
}) => {
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    category: template?.category || 'toy',
    thumbnail_url: template?.thumbnail_url || '',
    is_premium: template?.is_premium || false,
    canvasSize: {
      width: 400,
      height: 600,
      background: template?.design_data?.canvasSize?.background || '#ffffff',
      backgroundImage: template?.design_data?.canvasSize?.backgroundImage || ''
    },
    elements: template?.design_data?.elements || []
  });

  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(75); // 75% for better fit
  const [showGrid, setShowGrid] = useState(true);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [pendingElement, setPendingElement] = useState(null);
  const canvasRef = useRef(null);

  // Font options
  const fontOptions = [
    'Inter',
    'Space Grotesk', 
    'Playfair Display',
    'Roboto',
    'Montserrat',
    'Open Sans',
    'Lato',
    'Poppins',
    'Merriweather',
    'Crimson Text'
  ];

  // Element purposes/assignments for automatic data filling
  const elementPurposes = [
    { value: 'event_name', label: '🎉 Tədbir Adı', placeholder: 'Ayşən və Elnurun Toy Mərasimi' },
    { value: 'couple_names', label: '💕 Gəlin və Kişi Adları', placeholder: 'Ayşən & Elnur' },
    { value: 'event_date', label: '📅 Tədbir Tarixi', placeholder: '25 Dekabr 2024, Cümə axşamı' },
    { value: 'event_time', label: '⏰ Başlama Saatı', placeholder: '18:00' },
    { value: 'event_location', label: '📍 Tədbir Məkanı', placeholder: 'Şəhər Sarayı, Bakı' },
    { value: 'invitation_message', label: '✉️ Dəvət Mətni', placeholder: 'İştirakınızı səbirsizliklə gözləyirik' },
    { value: 'save_date', label: '💌 Tarix Qeyd Et', placeholder: 'Tarixi qeyd edin' },
    { value: 'dress_code', label: '👔 Geyim Kodu', placeholder: 'Geyim kodu: Formal' },
    { value: 'rsvp_text', label: '📞 RSVP Məlumatı', placeholder: 'Cavabınızı gözləyirik' },
    { value: 'custom_text', label: '📝 Sərbəst Mətn', placeholder: 'İstədiyiniz mətn' },
    { value: 'decorative', label: '🎨 Dekorativ Element', placeholder: 'Dekorativ mətn/şəkil' }
  ];

  // Color palette
  const colorPalette = [
    '#000000', '#374151', '#6b7280', '#9ca3af',
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#8B7355', '#DDA15E', '#BC6C25'
  ];

  // Add predefined placeholder element
  const addPlaceholderElement = (purposeData) => {
    const baseElement = {
      id: `${purposeData.value}-${Date.now()}`,
      type: 'text',
      content: purposeData.placeholder,
      purpose: purposeData.value,
      purposeLabel: purposeData.label,
      x: 50 + (templateData.elements.length * 10),
      y: 100 + (templateData.elements.length * 30),
      width: 300,
      height: 40,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#374151',
      fontWeight: 'normal',
      textAlign: 'center',
      rotation: 0,
      zIndex: templateData.elements.length + 1
    };
    
    // Adjust element properties based on purpose
    let element = { ...baseElement };
    
    switch (purposeData.value) {
      case 'event_name':
        element = { ...element, fontSize: 24, fontWeight: 'bold', height: 50 };
        break;
      case 'couple_names':
        element = { ...element, fontSize: 20, fontWeight: 'bold', height: 45 };
        break;
      case 'event_date':
        element = { ...element, fontSize: 18, fontWeight: '600' };
        break;
      case 'event_time':
        element = { ...element, fontSize: 16, width: 200 };
        break;
      case 'event_location':
        element = { ...element, fontSize: 16, width: 350 };
        break;
      default:
        break;
    }
    
    setTemplateData(prev => ({
      ...prev,
      elements: [...prev.elements, element]
    }));
    setSelectedElement(element);
    toast.success(`${purposeData.label} əlavə edildi`);
  };

  // Add element functions
  const addTextElement = () => {
    const newElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Yeni mətn əlavə edin',
      purpose: 'custom_text',
      purposeLabel: '📝 Sərbəst Mətn',
      x: 50 + (templateData.elements.length * 10),
      y: 100 + (templateData.elements.length * 30),
      width: 300,
      height: 40,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#374151',
      fontWeight: 'normal',
      textAlign: 'center',
      rotation: 0,
      zIndex: templateData.elements.length + 1
    };
    
    setPendingElement(newElement);
    setShowPurposeModal(true);
  };

  const addImageElement = () => {
    const newElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop',
      purpose: 'decorative',
      purposeLabel: '🎨 Dekorativ Element',
      x: 50 + (templateData.elements.length * 10),
      y: 300 + (templateData.elements.length * 20),
      width: 200,
      height: 150,
      rotation: 0,
      borderRadius: 0,
      zIndex: templateData.elements.length + 1
    };
    
    setTemplateData(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElement(newElement);
    toast.success('Şəkil elementi əlavə edildi');
  };

  // Handle purpose assignment
  const handlePurposeAssignment = (purpose) => {
    if (!pendingElement) return;
    
    const purposeData = elementPurposes.find(p => p.value === purpose);
    const elementWithPurpose = {
      ...pendingElement,
      purpose: purpose,
      purposeLabel: purposeData?.label || '📝 Sərbəst Mətn',
      content: purposeData?.placeholder || pendingElement.content
    };

    // Adjust element properties based on purpose
    switch (purpose) {
      case 'event_name':
        elementWithPurpose.fontSize = 24;
        elementWithPurpose.fontWeight = 'bold';
        elementWithPurpose.height = 50;
        break;
      case 'couple_names':
        elementWithPurpose.fontSize = 20;
        elementWithPurpose.fontWeight = 'bold';
        elementWithPurpose.height = 45;
        break;
      case 'event_date':
        elementWithPurpose.fontSize = 18;
        elementWithPurpose.fontWeight = '600';
        break;
      case 'event_time':
        elementWithPurpose.fontSize = 16;
        elementWithPurpose.width = 200;
        break;
      case 'event_location':
        elementWithPurpose.fontSize = 16;
        elementWithPurpose.width = 350;
        break;
      default:
        break;
    }
    
    setTemplateData(prev => ({
      ...prev,
      elements: [...prev.elements, elementWithPurpose]
    }));
    setSelectedElement(elementWithPurpose);
    
    setShowPurposeModal(false);
    setPendingElement(null);
    toast.success(`${purposeData?.label || 'Mətn'} elementi əlavə edildi`);
  };

  // Update element
  const updateElement = (elementId, updates) => {
    setTemplateData(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(prev => ({ ...prev, ...updates }));
    }
  };

  // Delete element
  const deleteElement = (elementId) => {
    setTemplateData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    toast.success('Element silindi');
  };

  // Duplicate element
  const duplicateElement = (element) => {
    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: templateData.elements.length + 1
    };
    
    setTemplateData(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElement(newElement);
    toast.success('Element kopyalandı');
  };

  // Drag functions
  const handleMouseDown = (e, element) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedElement(element);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;
    
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const newX = Math.max(0, Math.min(
      templateData.canvasSize.width - selectedElement.width,
      ((e.clientX - canvasRect.left - dragOffset.x) / (zoom / 100))
    ));
    
    const newY = Math.max(0, Math.min(
      templateData.canvasSize.height - selectedElement.height,
      ((e.clientY - canvasRect.top - dragOffset.y) / (zoom / 100))
    ));

    updateElement(selectedElement.id, { x: Math.round(newX), y: Math.round(newY) });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Global mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, selectedElement, dragOffset, zoom]);

  // Save template
  const handleSave = async () => {
    if (!templateData.name.trim()) {
      toast.error('Şablon adı daxil edilməlidir');
      return;
    }

    const saveData = {
      ...template,
      name: templateData.name,
      category: templateData.category,
      thumbnail_url: templateData.thumbnail_url,
      is_premium: templateData.is_premium,
      design_data: {
        canvasSize: templateData.canvasSize,
        elements: templateData.elements
      }
    };

    await onSave(saveData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Left Panel - Tools */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Şablon Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-name">Şablon Adı</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Şablon adı daxil edin"
              />
            </div>
            
            <div>
              <Label htmlFor="template-category">Kateqoriya</Label>
              <select
                id="template-category"
                value={templateData.category}
                onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="toy">💍 Toy</option>
                <option value="nişan">💖 Nişan</option>
                <option value="doğum_günü">🎂 Ad günü</option>
                <option value="korporativ">🏢 Korporativ</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-premium"
                checked={templateData.is_premium}
                onChange={(e) => setTemplateData(prev => ({ ...prev, is_premium: e.target.checked }))}
              />
              <Label htmlFor="is-premium">Premium Şablon</Label>
            </div>
          </CardContent>
        </Card>

        {/* Canvas Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Canvas Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fon Rəngi</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  type="color"
                  value={templateData.canvasSize.background}
                  onChange={(e) => setTemplateData(prev => ({
                    ...prev,
                    canvasSize: { ...prev.canvasSize, background: e.target.value }
                  }))}
                  className="w-16 h-10"
                />
                <Input
                  value={templateData.canvasSize.background}
                  onChange={(e) => setTemplateData(prev => ({
                    ...prev,
                    canvasSize: { ...prev.canvasSize, background: e.target.value }
                  }))}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Fon Şəkli URL</Label>
              <Input
                value={templateData.canvasSize.backgroundImage}
                onChange={(e) => setTemplateData(prev => ({
                  ...prev,
                  canvasSize: { ...prev.canvasSize, backgroundImage: e.target.value }
                }))}
                placeholder="https://example.com/bg.jpg"
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Grid</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? 'bg-blue-50' : ''}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label>Zoom</Label>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(150, zoom + 25))}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predefined Elements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Hazır Elementlər</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {elementPurposes.slice(0, 6).map((purpose) => (
                <Button 
                  key={purpose.value}
                  onClick={() => addPlaceholderElement(purpose)}
                  variant="outline" 
                  className="w-full justify-start text-sm h-auto p-3"
                >
                  <span className="mr-2">{purpose.label.split(' ')[0]}</span>
                  <span className="truncate">{purpose.label.split(' ').slice(1).join(' ')}</span>
                </Button>
              ))}
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600 mb-2">Digər elementlər:</p>
              <div className="grid grid-cols-1 gap-2">
                {elementPurposes.slice(6).map((purpose) => (
                  <Button 
                    key={purpose.value}
                    onClick={() => addPlaceholderElement(purpose)}
                    variant="ghost" 
                    className="w-full justify-start text-xs h-auto p-2"
                  >
                    <span className="mr-2">{purpose.label.split(' ')[0]}</span>
                    <span className="truncate">{purpose.label.split(' ').slice(1).join(' ')}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Element Tools */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Əl ilə Element</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={addTextElement} variant="outline" className="w-full justify-start">
              <Type className="mr-2 h-4 w-4" />
              Mətn Element
            </Button>
            <Button onClick={addImageElement} variant="outline" className="w-full justify-start">
              <Image className="mr-2 h-4 w-4" />
              Şəkil Element
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Center Panel - Canvas */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dizayn Canvas</h3>
          <div className="flex items-center space-x-2">
            <Button onClick={onCancel} variant="outline">
              Ləğv et
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Yenilə' : 'Saxla'}
            </Button>
          </div>
        </div>

        <div className="flex justify-center p-6 bg-gray-100 rounded-lg">
          <div 
            ref={canvasRef}
            className="relative border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden select-none"
            style={{
              width: (templateData.canvasSize.width * zoom / 100) + 'px',
              height: (templateData.canvasSize.height * zoom / 100) + 'px',
              backgroundColor: templateData.canvasSize.background,
              backgroundImage: templateData.canvasSize.backgroundImage ? 
                `url(${templateData.canvasSize.backgroundImage})${showGrid ? ', linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)' : ''}` :
                showGrid ? 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)' : 'none',
              backgroundSize: templateData.canvasSize.backgroundImage ? 
                `cover${showGrid ? ', 20px 20px, 20px 20px' : ''}` : 
                showGrid ? '20px 20px' : 'auto',
              backgroundPosition: 'center'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedElement(null);
              }
            }}
          >
            {templateData.elements.map((element) => (
              <div
                key={element.id}
                onMouseDown={(e) => handleMouseDown(e, element)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(element);
                }}
                className={`absolute cursor-move transition-all ${
                  selectedElement?.id === element.id 
                    ? 'ring-2 ring-blue-500 shadow-lg z-50' 
                    : 'hover:ring-1 hover:ring-gray-400 z-10'
                }`}
                style={{
                  left: (element.x * zoom / 100) + 'px',
                  top: (element.y * zoom / 100) + 'px',
                  width: (element.width * zoom / 100) + 'px',
                  height: (element.height * zoom / 100) + 'px',
                  transform: `rotate(${element.rotation || 0}deg)`,
                  zIndex: element.zIndex || 1
                }}
              >
                {element.type === 'text' && (
                  <div
                    style={{
                      fontSize: (element.fontSize * zoom / 100) + 'px',
                      fontFamily: element.fontFamily,
                      color: element.color,
                      fontWeight: element.fontWeight,
                      textAlign: element.textAlign,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: element.textAlign === 'center' ? 'center' : 
                        element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.4
                    }}
                  >
                    {element.content}
                  </div>
                )}
                
                {element.type === 'image' && (
                  <img
                    src={element.src}
                    alt="Element"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      borderRadius: (element.borderRadius * zoom / 100) + 'px'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="space-y-6">
        {selectedElement ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Element Ayarları
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateElement(selectedElement)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedElement.type === 'text' && (
                <>
                  {/* Element Purpose */}
                  {selectedElement.purpose && (
                    <div>
                      <Label>Element Təyinatı</Label>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-md mt-1">
                        <span className="text-sm text-blue-800">
                          {selectedElement.purposeLabel || selectedElement.purpose}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Mətn</Label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Şrift</Label>
                    <select
                      value={selectedElement.fontFamily}
                      onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      {fontOptions.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Ölçü</Label>
                      <Input
                        type="number"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        min="8"
                        max="72"
                      />
                    </div>
                    <div>
                      <Label>Çəki</Label>
                      <select
                        value={selectedElement.fontWeight}
                        onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Qalın</option>
                        <option value="300">Yüngül</option>
                        <option value="600">Orta</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Düzləndirmə</Label>
                    <div className="flex space-x-1 mt-1">
                      {['left', 'center', 'right'].map(align => (
                        <Button
                          key={align}
                          variant={selectedElement.textAlign === align ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                          className="flex-1"
                        >
                          {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Rəng</Label>
                    <div className="grid grid-cols-6 gap-1 mt-2">
                      {colorPalette.map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement(selectedElement.id, { color })}
                          className={`w-8 h-8 rounded border-2 ${
                            selectedElement.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <>
                  <div>
                    <Label>Şəkil URL</Label>
                    <Input
                      value={selectedElement.src}
                      onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Künc Radiusu</Label>
                    <Input
                      type="number"
                      value={selectedElement.borderRadius || 0}
                      onChange={(e) => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                      min="0"
                      max="50"
                    />
                  </div>
                </>
              )}

              {/* Common Properties */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>X</Label>
                    <Input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Y</Label>
                    <Input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label>En</Label>
                    <Input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Hündürlük</Label>
                    <Input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Element seçin və ya yenisini əlavə edin</p>
            </CardContent>
          </Card>
        )}

        {/* Elements List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Elementlər ({templateData.elements.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templateData.elements.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Hələ element yoxdur</p>
            ) : (
              templateData.elements.map((element) => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element)}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedElement?.id === element.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {element.type === 'text' ? (
                        <Type className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Image className="h-4 w-4 text-gray-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">
                          {element.type === 'text' 
                            ? element.content?.substring(0, 20) + (element.content?.length > 20 ? '...' : '')
                            : 'Şəkil'
                          }
                        </span>
                        {element.purposeLabel && (
                          <span className="text-xs text-blue-600 truncate block">
                            {element.purposeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                      className="text-red-600 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Purpose Selection Modal */}
      {showPurposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-in fade-in-0">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl animate-in zoom-in-95 relative z-[10000]">
            <h3 className="text-lg font-semibold mb-2">Element Təyinatını Seçin</h3>
            <p className="text-sm text-gray-600 mb-4">Bu element hansı məlumatı göstərəcək?</p>
            
            <div className="grid gap-2 max-h-80 overflow-y-auto pr-2">
              {elementPurposes.map((purpose) => (
                <button
                  key={purpose.value}
                  onClick={() => handlePurposeAssignment(purpose.value)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{purpose.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{purpose.placeholder}</div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <button 
                onClick={() => {
                  setShowPurposeModal(false);
                  setPendingElement(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTemplateBuilder;