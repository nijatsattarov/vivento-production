import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { FileText } from 'lucide-react';

const PublicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/pages/${slug}`);
      setPage(response.data);
    } catch (error) {
      console.error('Fetch page error:', error);
      setError(error.response?.status === 404 ? 'Səhifə tapılmadı' : 'Səhifə yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Yüklənir..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="shadow-xl">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
              <p className="text-gray-600">
                Axtardığınız səhifə mövcud deyil və ya silinib.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {page?.title}
            </h1>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none
                prose-headings:text-gray-900 
                prose-p:text-gray-700 
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900
                prose-ul:text-gray-700
                prose-ol:text-gray-700"
              dangerouslySetInnerHTML={{ __html: page?.content }}
            />

            {/* Last Updated */}
            <div className="mt-12 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Son yenilənmə: {new Date(page?.updated_at).toLocaleDateString('az-AZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicPage;
