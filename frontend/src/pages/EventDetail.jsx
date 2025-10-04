import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Share2, 
  Edit,
  CheckCircle,
  XCircle,
  Copy,
  Mail,
  MessageSquare,
  QrCode,
  BarChart3,
  User,
  Phone
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '' });
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch event details
      const eventResponse = await axios.get(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch guests
      const guestsResponse = await axios.get(`${API_BASE_URL}/api/events/${eventId}/guests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEvent(eventResponse.data);
      setGuests(guestsResponse.data);
    } catch (error) {
      console.error('Məlumatlar yüklənərkən xəta:', error);
      if (error.response?.status === 404) {
        toast.error('Tədbir tapılmadı');
        navigate('/dashboard');
      } else {
        toast.error('Məlumatlar yüklənə bilmədi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.name.trim()) {
      toast.error('Qonaq adı daxil edilməlidir');
      return;
    }

    setIsAddingGuest(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/api/events/${eventId}/guests`,
        newGuest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setGuests(prev => [...prev, response.data]);
      setNewGuest({ name: '', phone: '', email: '' });
      setIsAddGuestOpen(false);
      toast.success('Qonaq əlavə edildi');
    } catch (error) {
      console.error('Qonaq əlavə edilərkən xəta:', error);
      toast.error(error.response?.data?.detail || 'Qonaq əlavə edilə bilmədi');
    } finally {
      setIsAddingGuest(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const getStats = () => {
    const total = guests.length;
    const responded = guests.filter(guest => guest.rsvp_status).length;
    const attending = guests.filter(guest => guest.rsvp_status === 'gəlirəm').length;
    const notAttending = guests.filter(guest => guest.rsvp_status === 'gəlmirəm').length;

    return { total, responded, attending, notAttending };
  };

  const copyInviteLink = (guestToken) => {
    const link = `${window.location.origin}/invite/${guestToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopyalandı');
  };

  const shareViaWhatsApp = (guestToken, guestName) => {
    const link = `${window.location.origin}/invite/${guestToken}`;
    const message = `Salam ${guestName}! ${event?.name} tədbirimizə dəvətlisiniz. Dəvətnamənizi baxın: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <LoadingSpinner text="Tədbir məlumatları yüklənir..." />;
  }

  if (!event) {
    return null;
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
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
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="event-detail-title">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <Badge className={isUpcoming(event.date) ? 'bg-green-500' : 'bg-gray-500'}>
                  {isUpcoming(event.date) ? 'Gələcək' : 'Keçmiş'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link to={`/editor/${eventId}`}>
                <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50" data-testid="edit-event-button">
                  <Edit className="mr-2 h-4 w-4" />
                  Dizayn et
                </Button>
              </Link>
              
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="share-event-button">
                <Share2 className="mr-2 h-4 w-4" />
                Paylaş
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0" data-testid="stats-total-guests">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Ümumi qonaq</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0" data-testid="stats-responded">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Cavab verən</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.responded}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0" data-testid="stats-attending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Gələcək</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.attending}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0" data-testid="stats-not-attending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Gəlməyəcək</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.notAttending}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="guests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="guests" data-testid="guests-tab">Qonaqlar</TabsTrigger>
            <TabsTrigger value="details" data-testid="details-tab">Təfərrüatlar</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">Analitika</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-6">
            {/* Add Guest Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Qonaq siyahısı</h2>
              
              <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="add-guest-button">
                    <Plus className="mr-2 h-4 w-4" />
                    Qonaq əlavə et
                  </Button>
                </DialogTrigger>
                
                <DialogContent data-testid="add-guest-dialog">
                  <DialogHeader>
                    <DialogTitle>Yeni qonaq əlavə et</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="guest-name">Ad və soyad *</Label>
                      <Input
                        id="guest-name"
                        placeholder="Qonaq adı"
                        value={newGuest.name}
                        onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="guest-name-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guest-phone">Telefon (ixtiyari)</Label>
                      <Input
                        id="guest-phone"
                        placeholder="+994 xx xxx xx xx"
                        value={newGuest.phone}
                        onChange={(e) => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="guest-phone-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guest-email">Email (ixtiyari)</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="email@example.com"
                        value={newGuest.email}
                        onChange={(e) => setNewGuest(prev => ({ ...prev, email: e.target.value }))}
                        data-testid="guest-email-input"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsAddGuestOpen(false)} data-testid="cancel-add-guest">
                        Ləğv et
                      </Button>
                      <Button onClick={handleAddGuest} disabled={isAddingGuest} data-testid="confirm-add-guest">
                        {isAddingGuest ? 'Əlavə edilir...' : 'Əlavə et'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Guests List */}
            {guests.length === 0 ? (
              <Card className="bg-white border-2 border-dashed border-gray-300 p-12">
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Hələ qonaq əlavə edilməyib</h3>
                    <p className="text-gray-600">İlk qonağınızı əlavə edin və dəvətnamə göndərməyə başlayın</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {guests.map((guest) => (
                  <Card key={guest.id} className="bg-white shadow-lg border-0 card-hover" data-testid={`guest-card-${guest.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                            {guest.phone && (
                              <p className="text-xs text-gray-600 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {guest.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Badge 
                          className={
                            guest.rsvp_status === 'gəlirəm' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : guest.rsvp_status === 'gəlmirəm'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        >
                          {guest.rsvp_status || 'Cavab yoxdur'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(guest.unique_token)}
                          className="flex-1 text-xs"
                          data-testid={`copy-link-${guest.id}`}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Link
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareViaWhatsApp(guest.unique_token, guest.name)}
                          className="flex-1 text-xs border-green-600 text-green-600 hover:bg-green-50"
                          data-testid={`whatsapp-${guest.id}`}
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                          WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Tədbir təfərrüatları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Əsas məlumatlar</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Tədbir adı:</span>
                        <p className="font-medium">{event.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Tarix və vaxt:</span>
                        <p className="font-medium">{formatDate(event.date)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Yer:</span>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Əlavə məlumatlar</h4>
                    <div className="space-y-3">
                      {event.map_link && (
                        <div>
                          <span className="text-sm text-gray-600">Xəritə linki:</span>
                          <p>
                            <a 
                              href={event.map_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Google Maps-də aç
                            </a>
                          </p>
                        </div>
                      )}
                      
                      {event.additional_notes && (
                        <div>
                          <span className="text-sm text-gray-600">Əlavə qeydlər:</span>
                          <p className="font-medium">{event.additional_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>RSVP analitikası</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Cavab dərəcəsi</span>
                        <span className="text-sm text-gray-600">
                          {stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.total > 0 ? (stats.responded / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Gələcək qonaqlar</span>
                        <span className="text-sm text-gray-600">
                          {stats.responded > 0 ? Math.round((stats.attending / stats.responded) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stats.responded > 0 ? (stats.attending / stats.responded) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Xülasə</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Ümumi {stats.total} qonaq dəvət edilib</p>
                      <p>• {stats.responded} qonaq cavab verib ({stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0}%)</p>
                      <p>• {stats.attending} qonaq gələcəyini təsdiq edib</p>
                      <p>• {stats.notAttending} qonaq gəlməyəcəyini bildirb</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventDetail;