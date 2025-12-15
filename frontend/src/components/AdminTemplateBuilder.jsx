import React, { useState, useRef, useEffect } from 'react';
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
  Tag,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';
import axios from 'axios';

const AdminTemplateBuilder = ({ 
  template, 
  onSave, 
  onCancel, 
  isEditing = false 
}) => {
  const { token } = useAuth();
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    category: template?.category || 'toy',
    parent_category: template?.parent_category || 'toy',
    sub_category: template?.sub_category || '',
    thumbnail_url: template?.thumbnail_url || '',
    is_premium: template?.is_premium || false,
    price_per_invitation: template?.price_per_invitation || 0.10,
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
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [customFonts, setCustomFonts] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const canvasRef = useRef(null);
  
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Standard font options
  const standardFonts = [
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
  
  // Combined font options (standard + custom)
  const fontOptions = [
    ...standardFonts,
    ...customFonts.map(font => font.font_family)
  ];

  // Fetch custom fonts on component mount
  useEffect(() => {
    fetchCustomFonts();
  }, []);

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

  const fetchCustomFonts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fonts`);
      console.log('Admin: Custom fonts loaded:', response.data.length);
      setCustomFonts(response.data);
      
      // Load font faces
      response.data.forEach(font => {
        if (font.url && font.font_family) {
          const fontUrl = font.url.startsWith('http') ? font.url : `${API_BASE_URL}${font.url}`;
          const fontFace = new FontFace(font.font_family, `url(${fontUrl})`);
          fontFace.load()
            .then(() => {
              document.fonts.add(fontFace);
              console.log(`Admin: Font loaded - ${font.name}`);
            })
            .catch(err => console.error('Admin: Font load error:', font.name, err));
        }
      });
    } catch (error) {
      console.error('Admin: Custom fonts fetch error:', error);
    }
  };

  // Category structure
  const categoryStructure = [
    {
      id: 'toy',
      name: 'Toy',
      subcategories: [
        { id: 'toy-devetname', name: 'Dəvətnamələr' },
        { id: 'nisan', name: 'Nişan' }
      ]
    },
    {
      id: 'dogum-gunu',
      name: 'Doğum günü',
      subcategories: [
        { id: 'ad-gunu-devetname', name: 'Ad günü dəvətnaməsi' },
        { id: 'ad-gunu-sam', name: 'Ad günü şam yeyməyi' },
        { id: 'ad-gunu-kart', name: 'Ad günü kartları' }
      ]
    },
    {
      id: 'usaq',
      name: 'Uşaq',
      subcategories: [
        { id: 'korpe', name: 'Körpə' },
        { id: 'cinsiyyet-partisi', name: 'Cinsiyyət partisi' },
        { id: 'usaq-ad-gunu', name: 'Ad günü' }
      ]
    },
    {
      id: 'biznes',
      name: 'Biznes',
      subcategories: [
        { id: 'forum', name: 'Forum' },
        { id: 'korporativ', name: 'Korporativ tədbir' },
        { id: 'vip-event', name: 'VIP Event' },
        { id: 'networking', name: 'Networking' },
        { id: 'launch-party', name: 'Launch Party' },
        { id: 'breakfast', name: 'Breakfast' },
        { id: 'biznes-idlonumu', name: 'Biznes görüşü' },
        { id: 'sam-yemeyi', name: 'Şam yeməyi' },
        { id: 'mukafatlandirma', name: 'Mükafatlandırma' }
      ]
    },
    {
      id: 'tebrik',
      name: 'Təbrik postları-flayer',
      subcategories: [
        { id: 'tebrik-umumi', name: 'Ümumi təbriklər' }
      ]
    },
    {
      id: 'bayramlar',
      name: 'Bayramlar',
      subcategories: [
        { id: 'novruz', name: 'Novruz bayramı' },
        { id: 'qurban', name: 'Qurban bayramı' },
        { id: 'yeni-il', name: 'Yeni il' },
        { id: 'ramazan', name: 'Ramazan bayramı' },
        { id: '8-mart', name: '8 Mart' }
      ]
    },
    {
      id: 'diger',
      name: 'Digər',
      subcategories: [
        { id: 'ad-gunu', name: 'Ad günü' },
        { id: 'tesekkur', name: 'Təşəkkür' },
        { id: 'yubiley', name: 'Yubiley' },
        { id: 'tebrik', name: 'Təbrik' },
        { id: 'teqaud', name: 'Təqaüd' }
      ]
    }
  ];

  // Get available subcategories based on selected parent
  const availableSubcategories = categoryStructure.find(
    cat => cat.id === templateData.parent_category
  )?.subcategories || [];

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

  // Color schemes (like user editor)
  const colorSchemes = [
    {
      name: 'Classic',
      colors: ['#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff']
    },
    {
      name: 'Warm',
      colors: ['#8B4513', '#CD853F', '#DEB887', '#F5DEB3', '#FFF8DC']
    },
    {
      name: 'Cool',
      colors: ['#2C3E50', '#34495E', '#5D6D7E', '#85929E', '#D5DBDB']
    },
    {
      name: 'Romantic',
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFF0F5']
    },
    {
      name: 'Elegant',
      colors: ['#1a1a1a', '#8B7355', '#DDA15E', '#BC6C25', '#F4E3D7']
    },
    {
      name: 'Vibrant',
      colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF']
    },
    {
      name: 'Nature',
      colors: ['#2d5016', '#4a7c24', '#6aa832', '#a3d55d', '#d4f1a7']
    },
    {
      name: 'Ocean',
      colors: ['#003F5C', '#2C5F77', '#58A4B0', '#73C2D1', '#A9DDD6']
    }
  ];

  // All colors combined for quick access
  const allColors = colorSchemes.flatMap(scheme => scheme.colors);

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

  // Handle background image upload
  const handleBackgroundImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylları qəbul edilir');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fayl ölçüsü 10MB-dan böyük ola bilməz');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/upload/background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload xətası');
      }

      const result = await response.json();
      
      setTemplateData(prev => ({
        ...prev,
        canvasSize: { ...prev.canvasSize, backgroundImage: result.url }
      }));
      
      toast.success('Background şəkil uğurla yükləndi');
    } catch (error) {
      console.error('Background upload error:', error);
      toast.error('Şəkil yüklənərkən xəta baş verdi');
    }
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
  // Generate thumbnail from canvas
  const generateThumbnail = async () => {
    try {
      setIsGeneratingThumbnail(true);
      toast.info('Thumbnail yaradılır...');
      
      // Wait a bit for canvas to render fully
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the canvas element - try multiple methods
      let canvasElement = canvasRef.current;
      
      if (!canvasElement) {
        canvasElement = document.getElementById('design-canvas');
      }
      
      if (!canvasElement) {
        canvasElement = document.querySelector('[data-testid="design-canvas"]');
      }
      
      if (!canvasElement) {
        console.error('Canvas element not found with any method');
        console.log('canvasRef.current:', canvasRef.current);
        console.log('By ID:', document.getElementById('design-canvas'));
        console.log('By selector:', document.querySelector('[data-testid="design-canvas"]'));
        throw new Error('Canvas tapılmadı - canvas element mövcud deyil');
      }

      console.log('Canvas element found:', canvasElement);
      console.log('Canvas size:', canvasElement.offsetWidth, 'x', canvasElement.offsetHeight);
      console.log('Canvas element found, generating screenshot...');

      // Capture canvas as image with optimized settings
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: templateData.canvasSize.background || '#ffffff',
        scale: 1.5, // Balanced quality and performance
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        width: templateData.canvasSize.width,
        height: templateData.canvasSize.height
      });

      console.log('Screenshot captured, converting to blob...');

      // Convert to blob with better error handling
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Blob yaradıla bilmədi'));
            }
          },
          'image/jpeg',
          0.85
        );
      });
      
      console.log('Blob created, size:', blob.size, 'bytes');

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, `thumbnail-${Date.now()}.jpg`);

      // Upload to backend
      const token = localStorage.getItem('accessToken');
      
      console.log('Uploading to backend...');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/upload/background`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      console.log('Upload response:', response.data);

      const thumbnailUrl = response.data.file_url;
      
      // Update template data with new thumbnail
      setTemplateData(prev => ({ ...prev, thumbnail_url: thumbnailUrl }));
      
      toast.success('Thumbnail uğurla yaradıldı!');
      return thumbnailUrl;
      
    } catch (error) {
      console.error('Thumbnail yaratma xətası:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Thumbnail yaradıla bilmədi';
      if (error.response?.data?.detail) {
        errorMessage += `: ${error.response.data.detail}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage, { duration: 5000 });
      return null;
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleSave = async () => {
    if (!templateData.name.trim()) {
      toast.error('Şablon adı daxil edilməlidir');
      return;
    }

    if (!templateData.parent_category) {
      toast.error('Ana kateqoriya seçilməlidir');
      return;
    }

    if (!templateData.sub_category) {
      toast.error('Alt kateqoriya seçilməlidir');
      return;
    }

    // Generate thumbnail from canvas automatically
    let thumbnailUrl = templateData.thumbnail_url; // Use existing if available
    
    try {
      toast.info('Thumbnail yaradılır...');
      const newThumbnailUrl = await generateThumbnail();
      
      if (newThumbnailUrl) {
        thumbnailUrl = newThumbnailUrl;
        console.log('New thumbnail created:', thumbnailUrl);
      } else {
        console.warn('Thumbnail creation failed, using existing or placeholder');
        
        // If no existing thumbnail, use a placeholder
        if (!thumbnailUrl) {
          toast.warning('Thumbnail yaradıla bilmədi, placeholder istifadə olunur');
          thumbnailUrl = 'https://via.placeholder.com/400x600/f0f0f0/666666?text=Template';
        } else {
          toast.warning('Yeni thumbnail yaradıla bilmədi, köhnə qalır');
        }
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      if (!thumbnailUrl) {
        thumbnailUrl = 'https://via.placeholder.com/400x600/f0f0f0/666666?text=Template';
      }
    }

    const saveData = {
      ...template,
      name: templateData.name,
      category: templateData.category,
      parent_category: templateData.parent_category,
      sub_category: templateData.sub_category,
      thumbnail_url: thumbnailUrl,
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
              <Label htmlFor="parent-category">Ana Kateqoriya *</Label>
              <select
                id="parent-category"
                value={templateData.parent_category}
                onChange={(e) => {
                  const newParent = e.target.value;
                  setTemplateData(prev => ({ 
                    ...prev, 
                    parent_category: newParent,
                    sub_category: '', // Reset sub category when parent changes
                    category: newParent // Keep for backward compatibility
                  }));
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Kateqoriya seçin</option>
                {categoryStructure.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="sub-category">Alt Kateqoriya *</Label>
              <select
                id="sub-category"
                value={templateData.sub_category}
                onChange={(e) => setTemplateData(prev => ({ ...prev, sub_category: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!templateData.parent_category || availableSubcategories.length === 0}
              >
                <option value="">Alt kateqoriya seçin</option>
                {availableSubcategories.map(subcat => (
                  <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                ))}
              </select>
              {!templateData.parent_category && (
                <p className="text-xs text-gray-500 mt-1">Əvvəlcə ana kateqoriya seçin</p>
              )}
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

            <div>
              <Label htmlFor="price-per-invitation">Dəvətnamə başına qiymət (AZN)</Label>
              <Input
                id="price-per-invitation"
                type="number"
                min="0"
                step="0.01"
                value={templateData.price_per_invitation}
                onChange={(e) => setTemplateData(prev => ({ ...prev, price_per_invitation: parseFloat(e.target.value) || 0.10 }))}
                placeholder="0.10"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                {templateData.is_premium ? 'Premium şablon qiyməti' : 'Standard şablon (30 pulsuzdan sonra)'}
              </p>
            </div>

            <div className="pt-4 border-t">
              <Label className="mb-2 block">Thumbnail Şəkli</Label>
              
              {/* Thumbnail URL Input */}
              <div className="space-y-2 mb-3">
                <Label htmlFor="thumbnail-url" className="text-sm">Thumbnail URL</Label>
                <Input
                  id="thumbnail-url"
                  value={templateData.thumbnail_url}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="text-sm"
                />
              </div>
              
              {/* Thumbnail Upload Button */}
              <div className="space-y-2 mb-3">
                <Label className="text-sm">və ya Şəkil Yüklə (400x600px)</Label>
                <input
                  type="file"
                  accept="image/*"
                  id="thumbnail-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Şəkil 5MB-dan kiçik olmalıdır');
                      return;
                    }
                    
                    try {
                      toast.info('Thumbnail yüklənir...');
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      // Get token for authentication
                      const token = localStorage.getItem('accessToken');
                      
                      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/upload/background`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        },
                        body: formData
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || 'Upload failed');
                      }
                      
                      const data = await response.json();
                      setTemplateData(prev => ({ ...prev, thumbnail_url: data.file_url }));
                      toast.success('Thumbnail yükləndi!');
                    } catch (error) {
                      console.error('Thumbnail upload error:', error);
                      toast.error(`Thumbnail yüklənə bilmədi: ${error.message}`);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('thumbnail-upload').click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Thumbnail Yüklə
                </Button>
              </div>
              
              {/* Thumbnail Preview */}
              {templateData.thumbnail_url && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm mb-2 block">Thumbnail Önizləmə</Label>
                  <div className="relative aspect-[2/3] bg-white rounded-lg overflow-hidden border flex items-center justify-center">
                    <img 
                      src={templateData.thumbnail_url} 
                      alt="Thumbnail önizləmə"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x600/f0f0f0/666666?text=No+Image';
                      }}
                    />
                  </div>
                </div>
              )}
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
              <Label>Fon Rəngi (Bərk)</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  type="color"
                  value={templateData.canvasSize.background || '#ffffff'}
                  onChange={(e) => setTemplateData(prev => ({
                    ...prev,
                    canvasSize: { 
                      ...prev.canvasSize, 
                      background: e.target.value,
                      backgroundGradient: null 
                    }
                  }))}
                  className="w-16 h-10"
                />
                <Input
                  value={templateData.canvasSize.background || '#ffffff'}
                  onChange={(e) => setTemplateData(prev => ({
                    ...prev,
                    canvasSize: { 
                      ...prev.canvasSize, 
                      background: e.target.value,
                      backgroundGradient: null 
                    }
                  }))}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Gradient Fon</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={templateData.canvasSize.gradientStart || '#ffffff'}
                    onChange={(e) => {
                      const start = e.target.value;
                      const end = templateData.canvasSize.gradientEnd || '#000000';
                      setTemplateData(prev => ({
                        ...prev,
                        canvasSize: {
                          ...prev.canvasSize,
                          gradientStart: start,
                          gradientEnd: end,
                          backgroundGradient: `linear-gradient(to bottom, ${start}, ${end})`
                        }
                      }));
                    }}
                    className="w-16 h-10"
                  />
                  <span className="text-gray-500">→</span>
                  <Input
                    type="color"
                    value={templateData.canvasSize.gradientEnd || '#000000'}
                    onChange={(e) => {
                      const start = templateData.canvasSize.gradientStart || '#ffffff';
                      const end = e.target.value;
                      setTemplateData(prev => ({
                        ...prev,
                        canvasSize: {
                          ...prev.canvasSize,
                          gradientStart: start,
                          gradientEnd: end,
                          backgroundGradient: `linear-gradient(to bottom, ${start}, ${end})`
                        }
                      }));
                    }}
                    className="w-16 h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplateData(prev => ({
                      ...prev,
                      canvasSize: {
                        ...prev.canvasSize,
                        backgroundGradient: null,
                        gradientStart: null,
                        gradientEnd: null
                      }
                    }))}
                  >
                    Təmizlə
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Yuxarıdan aşağıya gradient</p>
              </div>
            </div>

            <div>
              <Label>Fon Şəkli</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-sm">URL ilə əlavə et</Label>
                  <Input
                    placeholder="https://example.com/background.jpg"
                    value={templateData.canvasSize.backgroundImage || ''}
                    onChange={(e) => setTemplateData(prev => ({
                      ...prev,
                      canvasSize: { ...prev.canvasSize, backgroundImage: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">və ya</span>
                </div>
                <div>
                  <Label className="text-sm">Fayl yüklə</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {templateData.canvasSize.backgroundImage && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600 truncate">
                      {templateData.canvasSize.backgroundImage.includes('http') ? 
                        'URL şəkil' : 
                        templateData.canvasSize.backgroundImage.split('/').pop()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateData(prev => ({
                        ...prev,
                        canvasSize: { ...prev.canvasSize, backgroundImage: '' }
                      }))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
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
          <div>
            <h3 className="text-lg font-semibold">Dizayn Canvas</h3>
            <p className="text-sm text-gray-500 mt-1">
              💡 Canvas dizaynınız avtomatik olaraq thumbnail şəkli kimi istifadə olunacaq
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCancel} variant="outline">
              Ləğv et
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isGeneratingThumbnail}
            >
              <Save className="mr-2 h-4 w-4" />
              {isGeneratingThumbnail ? 'Thumbnail yaradılır...' : (isEditing ? 'Yenilə' : 'Saxla')}
            </Button>
          </div>
        </div>

        <div className="flex justify-center p-6 bg-gray-100 rounded-lg">
          <div 
            ref={canvasRef}
            data-testid="design-canvas"
            id="design-canvas"
            className="relative border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden select-none"
            style={{
              width: (templateData.canvasSize.width * zoom / 100) + 'px',
              height: (templateData.canvasSize.height * zoom / 100) + 'px',
              background: templateData.canvasSize.backgroundGradient || templateData.canvasSize.background || '#ffffff',
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
                    <Label>Rəng Seçimi</Label>
                    
                    {/* Color Schemes */}
                    <div className="space-y-3 mt-3">
                      {colorSchemes.map((scheme) => (
                        <div key={scheme.name}>
                          <p className="text-xs text-gray-600 mb-1">{scheme.name}</p>
                          <div className="flex gap-1">
                            {scheme.colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => updateElement(selectedElement.id, { color })}
                                className={`w-10 h-10 rounded border-2 transition-all ${
                                  selectedElement.color === color 
                                    ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Custom Color Picker */}
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-gray-600 mb-2 block">Xüsusi Rəng</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={selectedElement.color}
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={selectedElement.color}
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                          className="flex-1 font-mono text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <>
                  <div>
                    <Label>Şəkil Yüklə</Label>
                    <div className="flex flex-col gap-2 mt-2">
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
                        id="admin-image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('admin-image-upload').click()}
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

                  <div>
                    <Label>və ya Şəkil URL</Label>
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