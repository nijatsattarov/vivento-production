import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { Calendar, MapPin, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    map_link: '',
    additional_notes: ''
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Tədbir adı daxil edilməlidir');
      return false;
    }
    
    if (!formData.date) {
      toast.error('Tədbir tarixi seçilməlidir');
      return false;
    }

    if (!formData.location.trim()) {
      toast.error('Tədbir yeri daxil edilməlidir');
      return false;
    }

    // Check if date is in future
    const eventDate = new Date(formData.date);
    const now = new Date();
    if (eventDate <= now) {
      toast.error('Tədbir tarixi gələcəkdə olmalıdır');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/api/events`,
        {
          ...formData,
          date: new Date(formData.date).toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Tədbir uğurla yaradıldı!');
      navigate(`/events/${response.data.id}`);
    } catch (error) {
      console.error('Tədbir yaradılarkən xəta:', error);
      toast.error(error.response?.data?.detail || 'Tədbir yaradıla bilmədi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard-a qayıt</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900" data-testid="create-event-title">
            Yeni tədbir yarat
          </h1>
          <p className="text-gray-600 mt-2">
            Tədbirinizin əsas məlumatlarını daxil edin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Tədbir məlumatları
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="create-event-form">
                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Tədbir adı *</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="məs: Ayşən və Elnurun toy mərasimi"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-12 border-gray-200 focus:border-blue-500 custom-input"
                      data-testid="event-name-input"
                      required
                    />
                  </div>

                  {/* Event Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Tədbir tarixi və vaxtı *</span>
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="h-12 border-gray-200 focus:border-blue-500 custom-input"
                      data-testid="event-date-input"
                      required
                    />
                  </div>

                  {/* Event Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Tədbir yeri *</span>
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="məs: Şəhər Sarayı, Bakı"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="h-12 border-gray-200 focus:border-blue-500 custom-input"
                      data-testid="event-location-input"
                      required
                    />
                  </div>

                  {/* Map Link */}
                  <div className="space-y-2">
                    <Label htmlFor="map_link" className="text-sm font-medium text-gray-700">
                      Google Maps linki (ixtiyari)
                    </Label>
                    <Input
                      id="map_link"
                      name="map_link"
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={formData.map_link}
                      onChange={handleInputChange}
                      className="h-12 border-gray-200 focus:border-blue-500 custom-input"
                      data-testid="event-map-link-input"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="additional_notes" className="text-sm font-medium text-gray-700">
                      Əlavə qeydlər (ixtiyari)
                    </Label>
                    <Textarea
                      id="additional_notes"
                      name="additional_notes"
                      placeholder="Geyim kodu, xüsusi tələblər və s."
                      value={formData.additional_notes}
                      onChange={handleInputChange}
                      className="min-h-[100px] border-gray-200 focus:border-blue-500 custom-input"
                      data-testid="event-notes-input"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      data-testid="cancel-create-event"
                    >
                      Ləğv et
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white btn-hover"
                      data-testid="submit-create-event"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Yaradılır...</span>
                        </div>
                      ) : (
                        <>
                          <span>Tədbiri yarat</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview/Tips */}
          <div className="space-y-6">
            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  💡 Məsləhətlər
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      <strong>Tədbir adı:</strong> Açıq və cəlbedici olsun. Məsələn: "Ayşən və Elnurun toy mərasimi"
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      <strong>Tarix:</strong> Qonaqlarınızın planlama edə bilməsi üçün ən az 2-3 həftə əvvəldən elan edin
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      <strong>Yer:</strong> Dəqiq ünvan və yol tarifi əlavə edin
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      <strong>Google Maps:</strong> Qonaqların asan tapması üçün xəritə linki əlavə edin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Card */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  📝 Növbəti addımlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span className="text-gray-700">Şablon seç və dizayn et</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span className="text-gray-700">Qonaq siyahısı əlavə et</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span className="text-gray-700">Dəvətnamələri göndər</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;