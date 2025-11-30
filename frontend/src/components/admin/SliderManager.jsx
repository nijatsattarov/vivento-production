import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Trash2, Edit, Plus, Upload, Image as ImageIcon, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const SliderManager = ({ token }) => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: 'Başla',
    button_link: '/register',
    order: 0,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/slides`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlides(response.data);
    } catch (error) {
      console.error('Sliderlər yüklənərkən xəta:', error);
      toast.error('Sliderlər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/upload/background`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Backend returns relative path like /api/uploads/filename.jpg
      const imageUrl = response.data.file_url || response.data.url;
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast.success('Şəkil yükləndi');
      console.log('✅ Image uploaded:', imageUrl);
    } catch (error) {
      console.error('Şəkil yüklənərkən xəta:', error);
      toast.error('Şəkil yüklənə bilmədi');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSlide) {
        // Update existing slide
        await axios.put(
          `${API_BASE_URL}/api/admin/slides/${editingSlide.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: formData
          }
        );
        toast.success('Slider yeniləndi');
      } else {
        // Create new slide
        await axios.post(
          `${API_BASE_URL}/api/admin/slides`,
          null,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: formData
          }
        );
        toast.success('Slider yaradıldı');
      }

      fetchSlides();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Slider əməliyyatı xətası:', error);
      toast.error(error.response?.data?.detail || 'Əməliyyat uğursuz oldu');
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      image_url: slide.image_url,
      button_text: slide.button_text || 'Başla',
      button_link: slide.button_link || '/register',
      order: slide.order,
      is_active: slide.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (slideId) => {
    if (!window.confirm('Bu slideri silmək istədiyinizə əminsiniz?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/slides/${slideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Slider silindi');
      fetchSlides();
    } catch (error) {
      console.error('Slider silinərkən xəta:', error);
      toast.error('Slider silinə bilmədi');
    }
  };

  const handleReorder = async (slideId, newOrder) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/slides/${slideId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { order: newOrder }
        }
      );
      fetchSlides();
    } catch (error) {
      console.error('Sıra dəyişdirilərkən xəta:', error);
      toast.error('Sıra dəyişdirilə bilmədi');
    }
  };

  const resetForm = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      button_text: 'Başla',
      button_link: '/register',
      order: 0,
      is_active: true
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hero Slider İdarəetməsi</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Slider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Slideri Redaktə Et' : 'Yeni Slider Yarat'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Başlıq *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Rəqəmsal dəvətnamə yaratmaq..."
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Alt başlıq *</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  required
                  placeholder="Vivento ilə toy, nişan..."
                />
              </div>

              <div>
                <Label htmlFor="image">Arxa fon şəkli *</Label>
                <div className="space-y-2">
                  {formData.image_url && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <Input
                    placeholder="və ya URL daxil edin"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button_text">Düymə mətni</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Başla"
                  />
                </div>
                <div>
                  <Label htmlFor="button_link">Düymə linki</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/register"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order">Sıra nömrəsi</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Ləğv et
                </Button>
                <Button type="submit">
                  {editingSlide ? 'Yenilə' : 'Yarat'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {slides.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Hələ slider yoxdur. Yeni slider yaradın.
            </CardContent>
          </Card>
        ) : (
          slides.map((slide, index) => (
            <Card key={slide.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">{slide.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{slide.subtitle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Sıra: {slide.order}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            slide.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {slide.is_active ? 'Aktiv' : 'Deaktiv'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReorder(slide.id, slide.order - 1)}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReorder(slide.id, slide.order + 1)}
                          disabled={index === slides.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(slide)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(slide.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SliderManager;
