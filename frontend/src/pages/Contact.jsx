import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Contact = () => {
  const [content, setContent] = useState({
    title: 'Əlaqə',
    content: ''
  });
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cms/contact`);
      setContent(response.data);
    } catch (error) {
      console.error('Contact content fetch error:', error);
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
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content.content || 'Bizimlə əlaqə saxlayın:\n\nEmail: info@vivento.az\nTelefon: +994 XX XXX XX XX\nÜnvan: Bakı, Azərbaycan'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;