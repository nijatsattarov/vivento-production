import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
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
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              {content.title}
            </h1>
            
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">E-poçt</h3>
                  <a href="mailto:info@vivento.az" className="text-blue-600 hover:underline">
                    info@vivento.az
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Telefon</h3>
                  <a href="tel:+994502001234" className="text-green-600 hover:underline">
                    +994 50 200 12 34
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ünvan</h3>
                  <p className="text-gray-600">Bakı, Azərbaycan</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">İş saatları</h3>
                  <p className="text-gray-600">B.e - Cümə: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
            
            {/* Additional Content */}
            {content.content && (
              <div className="prose prose-lg max-w-none border-t pt-8">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {content.content}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;