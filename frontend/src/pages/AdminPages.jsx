import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FileText, 
  Save, 
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
// React Quill removed due to React 19 compatibility issues
// Using textarea with HTML preview instead

const AdminPages = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [activeTab, setActiveTab] = useState('privacy');
  const [formData, setFormData] = useState({});
  const [preview, setPreview] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // HTML formatting helper buttons
  const insertHTML = (slug, tag) => {
    const data = formData[slug] || {};
    const textarea = document.getElementById(`content-${slug}`);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = data.content.substring(start, end);
    const beforeText = data.content.substring(0, start);
    const afterText = data.content.substring(end);
    
    let newText = '';
    switch(tag) {
      case 'h2':
        newText = `<h2>${selectedText || 'Başlıq'}</h2>`;
        break;
      case 'h3':
        newText = `<h3>${selectedText || 'Alt başlıq'}</h3>`;
        break;
      case 'p':
        newText = `<p>${selectedText || 'Paraqraf'}</p>`;
        break;
      case 'bold':
        newText = `<strong>${selectedText || 'Qalın mətn'}</strong>`;
        break;
      case 'link':
        newText = `<a href="https://example.com">${selectedText || 'Link'}</a>`;
        break;
      case 'ul':
        newText = `<ul>\n  <li>${selectedText || 'Siyahı elementi'}</li>\n</ul>`;
        break;
      default:
        newText = selectedText;
    }
    
    const updatedContent = beforeText + newText + afterText;
    handleInputChange(slug, 'content', updatedContent);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPages();
  }, [user]);

  const fetchPages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPages(response.data);
      
      // Initialize form data
      const initialData = {};
      response.data.forEach(page => {
        initialData[page.slug] = {
          title: page.title,
          content: page.content,
          meta_description: page.meta_description || '',
          published: page.published
        };
      });
      setFormData(initialData);
      
    } catch (error) {
      console.error('Fetch pages error:', error);
      toast.error('Səhifələr yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slug) => {
    if (!formData[slug]) {
      toast.error('Məlumat tapılmadı');
      return;
    }

    setSaving(true);

    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/pages/${slug}`,
        formData[slug],
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Səhifə uğurla yadda saxlanıldı');
      fetchPages(); // Refresh data
    } catch (error) {
      console.error('Save page error:', error);
      toast.error(error.response?.data?.detail || 'Saxlanarkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (slug, field, value) => {
    setFormData(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        [field]: value
      }
    }));
  };

  const PageEditor = ({ page }) => {
    const slug = page.slug;
    const data = formData[slug] || {};

    return (
      <div className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor={`title-${slug}`} className="text-base font-semibold">
            Başlıq
          </Label>
          <Input
            id={`title-${slug}`}
            value={data.title || ''}
            onChange={(e) => handleInputChange(slug, 'title', e.target.value)}
            className="mt-2"
            placeholder="Səhifə başlığı"
          />
        </div>

        {/* Meta Description */}
        <div>
          <Label htmlFor={`meta-${slug}`} className="text-base font-semibold">
            Meta Təsvir (SEO)
          </Label>
          <Textarea
            id={`meta-${slug}`}
            value={data.meta_description || ''}
            onChange={(e) => handleInputChange(slug, 'meta_description', e.target.value)}
            className="mt-2"
            rows={2}
            placeholder="Axtarış motorları üçün qısa təsvir"
          />
        </div>

        {/* Content Editor */}
        <div>
          <Label className="text-base font-semibold mb-2 block">
            Məzmun
          </Label>
          
          {!preview ? (
            <ReactQuill
              theme="snow"
              value={data.content || ''}
              onChange={(value) => handleInputChange(slug, 'content', value)}
              modules={modules}
              formats={formats}
              className="bg-white"
              style={{ height: '400px', marginBottom: '50px' }}
            />
          ) : (
            <div 
              className="prose max-w-none p-6 bg-gray-50 rounded-lg border min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {preview ? 'Redaktə et' : 'Baxış'}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {data.published ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Aktiv</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600 font-medium">Deaktiv</span>
                </>
              )}
            </div>

            <Button
              onClick={() => handleSave(slug)}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? (
                <>Saxlanılır...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Yadda Saxla
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-gray-500 pt-4 border-t">
          Son yenilənmə: {new Date(page.updated_at).toLocaleDateString('az-AZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Səhifələr yüklənir..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Səhifə İdarəetməsi
          </h1>
          <p className="text-gray-600">
            Məxfilik, şərtlər və əlaqə səhifələrini redaktə edin
          </p>
        </div>

        {/* Tabs */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Səhifələr
            </CardTitle>
            <CardDescription>
              Hər bir səhifəni seçib redaktə edə bilərsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="privacy">Məxfilik</TabsTrigger>
                <TabsTrigger value="terms">Şərtlər</TabsTrigger>
                <TabsTrigger value="contact">Əlaqə</TabsTrigger>
              </TabsList>

              {pages.map(page => (
                <TabsContent key={page.slug} value={page.slug}>
                  <PageEditor page={page} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPages;
