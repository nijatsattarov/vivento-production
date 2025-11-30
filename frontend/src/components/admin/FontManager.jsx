import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const FontManager = () => {
  const { token } = useAuth();
  const [fonts, setFonts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    font_name: '',
    font_family: '',
    category: 'sans-serif',
    file: null
  });
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchFonts();
  }, [selectedCategory]);

  const fetchFonts = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? `${API_BASE_URL}/api/fonts`
        : `${API_BASE_URL}/api/fonts?category=${selectedCategory}`;
      
      const response = await axios.get(url);
      setFonts(response.data);
    } catch (error) {
      console.error('Fontlar yüklənərkən xəta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['.ttf', '.otf', '.woff', '.woff2'];
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExt)) {
        toast.error('Yalnız TTF, OTF, WOFF, WOFF2 formatları dəstəklənir');
        return;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Font faylı çox böyükdür (maksimum 5MB)');
        return;
      }

      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.font_name || !uploadForm.font_family) {
      toast.error('Bütün sahələri doldurun');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('font_name', uploadForm.font_name);
    formData.append('font_family', uploadForm.font_family);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/fonts/upload?font_name=${encodeURIComponent(uploadForm.font_name)}&font_family=${encodeURIComponent(uploadForm.font_family)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      toast.success('Font uğurla yükləndi!');
      setIsUploadDialogOpen(false);
      setUploadForm({
        font_name: '',
        font_family: '',
        category: 'sans-serif',
        file: null
      });
      fetchFonts();
    } catch (error) {
      console.error('Font yükləmə xətası:', error);
      toast.error(error.response?.data?.detail || 'Font yüklənə bilmədi');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fontId) => {
    if (!window.confirm('Bu fontu silmək istədiyinizə əminsiniz?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/fonts/${fontId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Font silindi');
      fetchFonts();
    } catch (error) {
      console.error('Font silmə xətası:', error);
      toast.error('Font silinə bilmədi');
    }
  };

  const categories = [
    { value: 'all', label: 'Hamısı', color: 'gray' },
    { value: 'sans-serif', label: 'Sans-serif', color: 'blue' },
    { value: 'serif', label: 'Serif', color: 'purple' },
    { value: 'script', label: 'Script', color: 'pink' },
    { value: 'decorative', label: 'Dekorativ', color: 'orange' }
  ];

  const groupedFonts = fonts.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.value
                  ? `bg-${cat.color}-600 text-white`
                  : `bg-${cat.color}-100 text-${cat.color}-700 hover:bg-${cat.color}-200`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Font Yüklə
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Font Yüklə</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="font_name">Font Adı *</Label>
                <Input
                  id="font_name"
                  value={uploadForm.font_name}
                  onChange={(e) => setUploadForm({ ...uploadForm, font_name: e.target.value })}
                  placeholder="Məsələn: Mənzərə Font"
                  required
                />
              </div>

              <div>
                <Label htmlFor="font_family">Font Family (CSS) *</Label>
                <Input
                  id="font_family"
                  value={uploadForm.font_family}
                  onChange={(e) => setUploadForm({ ...uploadForm, font_family: e.target.value })}
                  placeholder="Məsələn: Menzere, sans-serif"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSS-də istifadə olunacaq font family adı
                </p>
              </div>

              <div>
                <Label htmlFor="category">Kateqoriya</Label>
                <select
                  id="category"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="script">Script</option>
                  <option value="decorative">Dekorativ</option>
                </select>
              </div>

              <div>
                <Label htmlFor="font_file">Font Faylı *</Label>
                <Input
                  id="font_file"
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dəstəklənən formatlar: TTF, OTF, WOFF, WOFF2 (max 5MB)
                </p>
                {uploadForm.file && (
                  <p className="text-sm text-green-600 mt-2">
                    Seçildi: {uploadForm.file.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    setUploadForm({
                      font_name: '',
                      font_family: '',
                      category: 'sans-serif',
                      file: null
                    });
                  }}
                >
                  Ləğv et
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Yüklənir...' : 'Yüklə'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Font Count */}
      <div className="text-sm text-gray-600">
        <strong>{fonts.length}</strong> font tapıldı
      </div>

      {/* Fonts Display */}
      {selectedCategory === 'all' ? (
        // Show grouped by category
        <div className="space-y-6">
          {Object.entries(groupedFonts).map(([category, categoryFonts]) => (
            <Card key={category}>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 capitalize">
                  {category} ({categoryFonts.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryFonts.map((font) => (
                    <div
                      key={font.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group"
                    >
                      <link rel="stylesheet" href={font.file_url} />
                      
                      {/* Delete button - only show for custom fonts */}
                      {font.uploaded_by !== 'system' && (
                        <button
                          onClick={() => handleDelete(font.id)}
                          className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                          title="Fontu sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <div
                        className="text-2xl mb-2"
                        style={{ fontFamily: font.font_family }}
                      >
                        Aa Bb Cc
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {font.name}
                      </div>
                      <div
                        className="text-lg mt-2 text-gray-700"
                        style={{ fontFamily: font.font_family }}
                      >
                        Azərbaycan dili
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {font.font_family}
                      </div>
                      {font.uploaded_by !== 'system' && (
                        <div className="text-xs text-blue-600 mt-1">
                          Custom
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Show single category
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonts.map((font) => (
            <Card key={font.id} className="hover:shadow-lg transition-shadow relative group">
              <CardContent className="p-4">
                <link rel="stylesheet" href={font.file_url} />
                
                {/* Delete button */}
                {font.uploaded_by !== 'system' && (
                  <button
                    onClick={() => handleDelete(font.id)}
                    className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
                    title="Fontu sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div
                  className="text-3xl mb-3 font-bold"
                  style={{ fontFamily: font.font_family }}
                >
                  Aa Bb Cc
                </div>
                <div className="text-base font-medium text-gray-900 mb-2">
                  {font.name}
                  {font.uploaded_by !== 'system' && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <div
                  className="text-xl text-gray-700 mb-2"
                  style={{ fontFamily: font.font_family }}
                >
                  Azərbaycan dili dəstəyi
                </div>
                <div
                  className="text-sm text-gray-600 mb-2"
                  style={{ fontFamily: font.font_family }}
                >
                  1234567890
                </div>
                <div className="text-xs text-gray-500 mt-3 border-t pt-2">
                  {font.font_family}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Qeyd:</strong> Bütün fontlar Google Fonts-dan yüklənir və Azərbaycan dilini (Latin və Kiril) dəstəkləyir.
          İstifadəçilər template editor-də bu fontları seçə bilərlər.
        </p>
      </div>
    </div>
  );
};

export default FontManager;
