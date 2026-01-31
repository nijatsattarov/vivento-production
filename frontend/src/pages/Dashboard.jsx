import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
  const { user, token, setUser, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
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

  // Process Emergent Auth session_id from URL fragment
  useEffect(() => {
    const processSessionId = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        setProcessingAuth(true);
        try {
          // Extract session_id from URL fragment
          const sessionId = hash.split('session_id=')[1].split('&')[0];
          
          console.log('Processing Emergent Auth session_id...');
          
          // Send session_id to backend
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/emergent/session`,
            { session_id: sessionId },
            { withCredentials: true }
          );
          
          if (response.data.success) {
            console.log('Auth successful:', response.data);
            
            // Set user in context
            setUser(response.data.user);
            setIsAuthenticated(true);
            
            // Save session token to localStorage as fallback
            localStorage.setItem('sessionToken', response.data.session_token);
            
            // Clean URL fragment
            window.history.replaceState(null, '', window.location.pathname);
            
            toast.success('Uğurla giriş etdiniz!');
          }
        } catch (error) {
          console.error('Session processing error:', error);
          toast.error('Giriş zamanı xəta baş verdi');
          navigate('/login');
        } finally {
          setProcessingAuth(false);
        }
      }
    };
    
    processSessionId();
  }, []);

  useEffect(() => {
    if (!processingAuth && user) {
      fetchEvents();
      fetchBalance();
    }
  }, [processingAuth, user]);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance({
        balance: response.data.balance || 0,
        free_invitations_used: response.data.free_invitations_used || 0,
        free_invitations_remaining: response.data.free_invitations_remaining || 30,
        currency: 'AZN'
      });
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  const fetchEvents = async () => {
    try {
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
    // Parse the date string as-is (already in Baku time)
    const date = dateString.replace('T', ' ').substring(0, 16);
    const [datePart, timePart] = date.split(' ');
    const [year, month, day] = datePart.split('-');
    
    const monthNames = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}, ${timePart}`;
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

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Bu tədbiri silmək istədiyinizə əminsiniz?')) {
      return;
    }
    
    setDeletingEventId(eventId);
    try {
      await axios.delete(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tədbir uğurla silindi');
      setEvents(events.filter(e => e.id !== eventId));
      calculateStats(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error('Tədbir silinərkən xəta baş verdi');
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleShareEvent = async (event) => {
    const inviteUrl = `${window.location.origin}/invite/${event.invite_token || event.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `${event.name} tədbirinə dəvət olunursunuz!`,
          url: inviteUrl
        });
      } catch (error) {
        // User cancelled sharing
        if (error.name !== 'AbortError') {
          copyToClipboard(inviteUrl);
        }
      }
    } else {
      copyToClipboard(inviteUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Dəvət linki kopyalandı!');
    }).catch(() => {
      toast.error('Link kopyalana bilmədi');
    });
  };

  if (loading || processingAuth) {
    return <LoadingSpinner text={processingAuth ? "Giriş edilir..." : "Məlumatlar yüklənir..."} />;
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
                {t('dashboard.welcome')}, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                {t('dashboard.recentEvents')}
              </p>
            </div>
            <Button 
              onClick={() => navigate('/create-event')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white btn-hover"
              data-testid="create-event-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('events.createEvent')}
            </Button>
          </div>
        </div>

        {/* Balance Section */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t('dashboard.balance')}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {balance.balance.toFixed(2)} {balance.currency}
                </p>
                <p className="text-green-100 text-sm mt-2">
                  {t('dashboard.freeInvitations')}: {balance.free_invitations_remaining}/30
                </p>
              </div>
              <div className="text-right">
                <Button 
                  onClick={() => navigate('/add-balance')}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('dashboard.addBalance')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover bg-white shadow-lg border-0" data-testid="stats-total-events">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('dashboard.totalEvents')}</p>
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
                  <p className="text-sm text-gray-600 font-medium">{t('dashboard.totalGuests')}</p>
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
                          onClick={() => handleShareEvent(event)}
                          data-testid={`share-event-${event.id}`}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={deletingEventId === event.id}
                          data-testid={`delete-event-${event.id}`}
                        >
                          {deletingEventId === event.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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