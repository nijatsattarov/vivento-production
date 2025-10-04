import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Heart,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const InvitationPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [responding, setResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/invite/${token}`);
      setInvitation(response.data);
      setHasResponded(!!response.data.guest.rsvp_status);
    } catch (error) {
      console.error('Dəvətnamə alınarkən xəta:', error);
      toast.error('Dəvətnamə tapılmadı və ya etibarsızdır');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    setResponding(true);
    
    try {
      await axios.post(`${API_BASE_URL}/api/invite/${token}/rsvp`, {
        status: status
      });
      
      setHasResponded(true);
      setInvitation(prev => ({
        ...prev,
        guest: {
          ...prev.guest,
          rsvp_status: status
        }
      }));
      
      toast.success(
        status === 'gəlirəm' 
          ? 'Təşəkkür edirik! Cavabınız qeydə alındı - Gələcəksiniz 🎉' 
          : 'Cavabınız qeydə alındı. Başqa vaxt görüşək! 😊'
      );
    } catch (error) {
      console.error('RSVP cavabı verilirkən xəta:', error);
      toast.error('Cavab verə bilmədi. Xahiş edirik yenidən cəhd edin.');
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('az-AZ', {
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('az-AZ', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return <LoadingSpinner text="Dəvətnamə yüklənir..." />;
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Dəvətnamə tapılmadı
            </h1>
            <p className="text-gray-600">
              Bu link etibarsızdır və ya dəvətnamə mövcud deyil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { guest, event } = invitation;
  const eventDateTime = formatDate(event.date);
  const upcoming = isUpcoming(event.date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Main Invitation Card */}
        <Card className="glass border-0 shadow-2xl overflow-hidden" data-testid="invitation-card">
          {/* Header with decorative elements */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 text-center space-y-4">
              <div className="flex justify-center mb-4">
                <Heart className="h-12 w-12 text-pink-200 fill-current" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold" data-testid="event-title">
                {event.name}
              </h1>
              <p className="text-purple-100 text-lg">
                Hörmətli <span className="font-semibold">{guest.name}</span>,
              </p>
              <p className="text-purple-100">
                Tədbirimizə dəvətlisiniz!
              </p>
            </div>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* Event Details */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Tarix və vaxt</h3>
                  <p className="text-gray-700 font-medium">{eventDateTime.date}</p>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {eventDateTime.time}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Yer</h3>
                  <p className="text-gray-700 font-medium">{event.location}</p>
                  {event.map_link && (
                    <a
                      href={event.map_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center mt-2 transition-colors"
                      data-testid="map-link"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Xəritədə gör
                    </a>
                  )}
                </div>
              </div>

              {event.additional_notes && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h3 className="font-semibold text-amber-900 mb-2">Əlavə məlumat</h3>
                  <p className="text-amber-800">{event.additional_notes}</p>
                </div>
              )}
            </div>

            {/* RSVP Section */}
            <div className="border-t pt-8">
              {!hasResponded ? (
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Gələcəksinizmi?</h2>
                    <p className="text-gray-600">
                      Xahiş edirik cavabınızı {upcoming ? 'mümkün qədər tez' : ''} bildirin
                    </p>
                  </div>
                  
                  {upcoming && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => handleRSVP('gəlirəm')}
                        disabled={responding}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 text-lg btn-hover"
                        data-testid="rsvp-yes-button"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {responding ? 'Saxlanılır...' : 'Bəli, gələcəm! 🎉'}
                      </Button>
                      
                      <Button
                        onClick={() => handleRSVP('gəlmirəm')}
                        disabled={responding}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-3 text-lg"
                        data-testid="rsvp-no-button"
                      >
                        <XCircle className="mr-2 h-5 w-5" />
                        {responding ? 'Saxlanılır...' : 'Təəssüf ki, gələ bilməm 😔'}
                      </Button>
                    </div>
                  )}

                  {!upcoming && (
                    <div className="p-4 bg-gray-100 rounded-xl">
                      <p className="text-gray-600">
                        Bu tədbir artıq keçib. RSVP müddəti bitib.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4" data-testid="rsvp-response">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    guest.rsvp_status === 'gəlirəm' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {guest.rsvp_status === 'gəlirəm' ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Təşəkkür edirik!
                    </h2>
                    <p className={`text-lg font-medium ${
                      guest.rsvp_status === 'gəlirəm' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {guest.rsvp_status === 'gəlirəm' 
                        ? 'Sizin iştirakınızı gözləyirik! 🎉' 
                        : 'Cavabınız qeydə alındı. Başqa vaxt görüşək! 😊'
                      }
                    </p>
                    
                    {guest.rsvp_status === 'gəlirəm' && upcoming && (
                      <div className="mt-4 p-4 bg-green-50 rounded-xl">
                        <p className="text-green-800 text-sm">
                          📱 Tədbir yaxınlaşdıqca sizə xatırladıcı mesaj göndərəcəyik.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {upcoming && (
                    <p className="text-gray-500 text-sm mt-4">
                      Fikirlərinizi dəyişsəniz, yenidən cavab verə bilərsiniz.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            Bu dəvətnamə <span className="font-semibold text-purple-600">Vivento</span> ilə yaradılıb
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;