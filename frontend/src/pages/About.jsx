import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

const About = () => {
  const [content, setContent] = useState({
    title: 'Haqqımızda',
    description: '',
    mission: '',
    vision: ''
  });
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cms/about`);
      setContent(response.data);
    } catch (error) {
      console.error('About content fetch error:', error);
      // Use default content if fetch fails
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {content.title}
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <div className="mb-8">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {content.description || 'Vivento - rəqəmsal dəvətnamə platforması. Tədbirləriniz üçün gözəl və peşəkar dəvətnamələr yaradın.'}
                </p>
              </div>

              {content.mission && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Missiyamız</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.mission}
                  </p>
                </div>
              )}

              {content.vision && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Vizyonumuz</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.vision}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
