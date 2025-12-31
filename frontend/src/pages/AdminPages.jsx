import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  AlertCircle,
  Globe
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const languages = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

// Multi-language Page Editor Component
const PageEditor = ({ page, formData, handleInputChange, handleSave, saving }) => {
  const slug = page.slug;
  const data = formData[slug] || {};
  const [activeLang, setActiveLang] = useState('az');

  const getFieldName = (field, lang) => {
    if (lang === 'az') return field;
    return `${field}_${lang}`;
  };

  return (
    <div className="space-y-6">
      {/* Language Tabs */}
      <div className="border-b pb-4">
        <Label className="text-base font-semibold mb-3 block">
          <Globe className="inline-block w-4 h-4 mr-2" />
          Dil Seçimi
        </Label>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={activeLang === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLang(lang.code)}
              className="flex items-center gap-2"
            >
              <span>{lang.flag}</span>
              {lang.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor={`title-${slug}-${activeLang}`} className="text-base font-semibold">
          Başlıq ({languages.find(l => l.code === activeLang)?.name})
        </Label>
        <Input
          id={`title-${slug}-${activeLang}`}
          value={data[getFieldName('title', activeLang)] || ''}
          onChange={(e) => handleInputChange(slug, getFieldName('title', activeLang), e.target.value)}
          className="mt-2"
          placeholder={`Səhifə başlığı (${activeLang.toUpperCase()})`}
        />
      </div>

      {/* Meta Description */}
      <div>
        <Label htmlFor={`meta-${slug}-${activeLang}`} className="text-base font-semibold">
          Meta Təsvir ({languages.find(l => l.code === activeLang)?.name})
        </Label>
        <Textarea
          id={`meta-${slug}-${activeLang}`}
          value={data[getFieldName('meta_description', activeLang)] || ''}
          onChange={(e) => handleInputChange(slug, getFieldName('meta_description', activeLang), e.target.value)}
          className="mt-2"
          rows={2}
          placeholder={`SEO meta təsviri (${activeLang.toUpperCase()})`}
        />
      </div>

      {/* Content */}
      <div>
        <Label htmlFor={`content-${slug}-${activeLang}`} className="text-base font-semibold">
          Məzmun ({languages.find(l => l.code === activeLang)?.name})
        </Label>
        <p className="text-sm text-gray-500 mt-1 mb-2">
          HTML formatında yazın. Başlıqlar üçün &lt;h2&gt;, &lt;h3&gt;, paraqraf üçün &lt;p&gt;, siyahı üçün &lt;ul&gt;&lt;li&gt; istifadə edin.
        </p>
        <Textarea
          id={`content-${slug}-${activeLang}`}
          value={data[getFieldName('content', activeLang)] || ''}
          onChange={(e) => handleInputChange(slug, getFieldName('content', activeLang), e.target.value)}
          className="mt-2 font-mono text-sm"
          rows={15}
          placeholder={`Səhifə məzmunu (${activeLang.toUpperCase()})`}
        />
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4 text-sm">
        {languages.map((lang) => {
          const hasContent = data[getFieldName('content', lang.code)]?.length > 10;
          return (
            <div key={lang.code} className="flex items-center gap-1">
              <span>{lang.flag}</span>
              {hasContent ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={() => handleSave(slug)} 
          disabled={saving}
          className="min-w-[150px]"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saxlanılır...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Yadda Saxla
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const AdminPages = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('privacy');
  const [formData, setFormData] = useState({});
  
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPages();
  }, [user, navigate]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPages(response.data);
      
      // Initialize form data with all language fields
      const initialData = {};
      response.data.forEach(page => {
        initialData[page.slug] = {
          title: page.title || '',
          title_en: page.title_en || '',
          title_ru: page.title_ru || '',
          content: page.content || '',
          content_en: page.content_en || '',
          content_ru: page.content_ru || '',
          meta_description: page.meta_description || '',
          meta_description_en: page.meta_description_en || '',
          meta_description_ru: page.meta_description_ru || ''
        };
      });
      setFormData(initialData);
      
      if (response.data.length > 0) {
        setActiveTab(response.data[0].slug);
      }
    } catch (error) {
      console.error('Səhifələr yüklənərkən xəta:', error);
      toast.error('Səhifələr yüklənə bilmədi');
    } finally {
      setLoading(false);
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

  const handleSave = async (slug) => {
    try {
      setSaving(true);
      const data = formData[slug];
      
      await axios.put(
        `${API_BASE_URL}/api/admin/pages/${slug}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Səhifə uğurla yeniləndi!');
    } catch (error) {
      console.error('Səhifə saxlanarkən xəta:', error);
      toast.error('Səhifə saxlanarkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Səhifələr yüklənir..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Səhifə İdarəetməsi (CMS)
          </h1>
          <p className="text-gray-600 mt-2">
            Statik səhifələrin məzmununu 3 dildə (AZ, EN, RU) redaktə edin
          </p>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle>Səhifələr</CardTitle>
            <CardDescription>
              Hər səhifənin məzmununu Azərbaycan, İngilis və Rus dillərində yazın
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {pages.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">Heç bir səhifə tapılmadı</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-white px-4 pt-4">
                  {pages.map((page) => (
                    <TabsTrigger 
                      key={page.slug} 
                      value={page.slug}
                      className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-6"
                    >
                      {page.slug === 'privacy' && '🔒 Məxfilik'}
                      {page.slug === 'terms' && '📋 Şərtlər'}
                      {page.slug === 'contact' && '📧 Əlaqə'}
                      {!['privacy', 'terms', 'contact'].includes(page.slug) && page.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {pages.map((page) => (
                  <TabsContent key={page.slug} value={page.slug} className="p-6 m-0">
                    <PageEditor
                      page={page}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      handleSave={handleSave}
                      saving={saving}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPages;
