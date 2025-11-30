import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const CMSManager = ({ token }) => {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const [aboutContent, setAboutContent] = useState({
    title: '',
    description: '',
    mission: '',
    vision: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cms/about`);
      setAboutContent(response.data);
    } catch (error) {
      console.error('Fetch about content error:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/cms/about`,
        aboutContent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Haqqımızda səhifəsi yeniləndi!');
    } catch (error) {
      console.error('Save about content error:', error);
      toast.error('Yeniləmə uğursuz oldu: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Haqqımızda Səhifəsi</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cms-title">Başlıq</Label>
          <Input
            id="cms-title"
            value={aboutContent.title}
            onChange={(e) => setAboutContent({ ...aboutContent, title: e.target.value })}
            placeholder="Haqqımızda"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cms-description">Təsvir</Label>
          <Textarea
            id="cms-description"
            value={aboutContent.description}
            onChange={(e) => setAboutContent({ ...aboutContent, description: e.target.value })}
            placeholder="Vivento haqqında ümumi məlumat..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cms-mission">Missiyamız</Label>
          <Textarea
            id="cms-mission"
            value={aboutContent.mission}
            onChange={(e) => setAboutContent({ ...aboutContent, mission: e.target.value })}
            placeholder="Şirkətimizin missiyası..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cms-vision">Vizyonumuz</Label>
          <Textarea
            id="cms-vision"
            value={aboutContent.vision}
            onChange={(e) => setAboutContent({ ...aboutContent, vision: e.target.value })}
            placeholder="Şirkətimizin vizyonu..."
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saxlanılır...' : 'Yadda Saxla'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CMSManager;