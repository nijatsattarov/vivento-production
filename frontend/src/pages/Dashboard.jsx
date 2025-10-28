import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  Clock,
  MapPin,
  Share2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  UserPlus
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({
    balance: 0,
    free_invitations_used: 0,
    free_invitations_remaining: 30,
    currency: 'AZN'
  });
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalGuests: 0,
    respondedGuests: 0,
    upcomingEvents: 0
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEvents(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Tədbirlər alınarkən xəta:', error);
      toast.error('Tədbir məlumatları yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (eventList) => {
    let totalGuests = 0;
    let respondedGuests = 0;
    const upcomingEvents = eventList.filter(event => new Date(event.date) > new Date()).length;

    // Her event üçün qonaq məlumatlarını al
    for (const event of eventList) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/events/${event.id}/guests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        totalGuests += response.data.length;
        respondedGuests += response.data.filter(guest => guest.rsvp_status).length;
      } catch (error) {
        console.error(`Event ${event.id} üçün qonaq məlumatları alınamadı:`, error);
      }
    }

    setStats({
      totalEvents: eventList.length,
      totalGuests,
      respondedGuests,
      upcomingEvents
    });
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

  const getEventStatusColor = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-gray-500';
    if (diffDays <= 7) return 'bg-red-500';
    if (diffDays <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return <LoadingSpinner text="Məlumatlar yüklənir..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-welcome">
                Xoş gəlmisiniz, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Tədbirlərinizi idarə edin və qonaqlarınızla əlaqə saxlayın
              </p>
            </div>
            <Button 
              onClick={() => navigate('/create-event')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white btn-hover"
              data-testid="create-event-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni tədbir yarat
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover bg-white shadow-lg border-0" data-testid="stats-total-events">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Ümumi tədbir</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-white shadow-lg border-0" data-testid="stats-total-guests">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Ümumi qonaq</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalGuests}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-white shadow-lg border-0" data-testid="stats-responded-guests">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Cavab verən qonaq</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.respondedGuests}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-white shadow-lg border-0" data-testid="stats-upcoming-events">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Gələcək tədbir</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.upcomingEvents}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Tədbirlərim</h2>
            {events.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => navigate('/create-event')}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                data-testid="add-another-event"
              >
                <Plus className="mr-2 h-4 w-4" />
                Başqa tədbir əlavə et
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            // Empty State
            <Card className="bg-white border-2 border-dashed border-gray-300 p-12" data-testid="empty-state">
              <CardContent className="text-center space-y-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Hələ ki tədbir yoxdur</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    İlk tədbirinizi yaradın və gözəl dəvətnamələrlə qonaqlarınızı dəvet edin
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/create-event')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white btn-hover"
                  data-testid="create-first-event"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  İlk tədbirinizi yaradın
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Events List
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="card-hover bg-white shadow-lg border-0 overflow-hidden" data-testid={`event-card-${event.id}`}>
                  <CardContent className="p-0">
                    {/* Event Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <Badge 
                          className={`${getEventStatusColor(event.date)} text-white border-0`}
                        >
                          {isUpcoming(event.date) ? 'Gələcək' : 'Keçmiş'}
                        </Badge>
                      </div>
                    </div>

                    {/* Event Actions */}
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Link
                          to={`/events/${event.id}`}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                          data-testid={`view-event-${event.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ətraflı</span>
                        </Link>
                        
                        <Link
                          to={`/editor/${event.id}`}
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium"
                          data-testid={`edit-event-${event.id}`}
                        >
                          <Edit className="h-4 w-4" />
                          <span>Redaktə</span>
                        </Link>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-green-600"
                          data-testid={`share-event-${event.id}`}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                          data-testid={`delete-event-${event.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Status */}
        {user?.subscription_type === 'free' && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" data-testid="upgrade-prompt">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Premium xüsusiyyətləri kəşf edin</h3>
                  <p className="text-gray-600 mt-1">
                    Limitsiz tədbir, premium şablonlar və daha çox imkan əldə edin
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  data-testid="upgrade-button"
                >
                  Yeniləyin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;