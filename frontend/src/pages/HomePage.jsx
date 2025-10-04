import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { 
  Calendar, 
  Users, 
  Share2, 
  Smartphone, 
  CheckCircle, 
  Star,
  ArrowRight,
  Zap,
  Palette,
  MessageSquare
} from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Palette className="h-8 w-8 text-blue-600" />,
      title: "Canva Tipli Editor",
      description: "Drag & drop ilə dəvətnamələrinizi asanlıqla dizayn edin. Şəkil, mətn və rəngləri dəyişdirin."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Qonaq İdarəetməsi",
      description: "Qonaqlarınızı əlavə edin, RSVP cavablarını izləyin və hesabatlar alın."
    },
    {
      icon: <Share2 className="h-8 w-8 text-green-600" />,
      title: "Asan Paylaşım",
      description: "WhatsApp və email ilə dəvətnamələrinizi bir kliklə paylaşın."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      title: "Mobil Uyğun",
      description: "Bütün cihazlarda mükəmməl görünən responsive dizayn."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "QR Kod",
      description: "Hər dəvətnamə üçün unikal QR kod yaradın və paylaşın."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-pink-600" />,
      title: "Real-vaxt RSVP",
      description: "Qonaqlarınızdan dərhal cavab alın və statistikalar görün."
    }
  ];

  const templates = [
    {
      id: 1,
      name: "Toy dəvətnaməsi",
      category: "toy",
      image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop&crop=center",
      premium: false
    },
    {
      id: 2,
      name: "Nişan mərasimi",
      category: "nişan",
      image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=300&fit=crop&crop=center",
      premium: true
    },
    {
      id: 3,
      name: "Doğum günü",
      category: "doğum_günü",
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center",
      premium: false
    },
    {
      id: 4,
      name: "Korporativ tədbir",
      category: "korporativ",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop&crop=center",
      premium: true
    }
  ];

  const pricingPlans = [
    {
      name: "Pulsuz",
      price: "0",
      features: [
        "1 tədbir",
        "Maksimum 50 dəvətnamə",
        "Əsas şablonlar",
        "WhatsApp paylaşımı"
      ]
    },
    {
      name: "Premium",
      price: "9.99",
      features: [
        "Limitsiz tədbir",
        "Limitsiz dəvətnamə",
        "Premium şablonlar",
        "Email & WhatsApp",
        "QR kod generasiyası",
        "Detallı statistikalar"
      ],
      popular: true
    },
    {
      name: "VIP",
      price: "19.99",
      features: [
        "Bütün Premium xüsusiyyətlər",
        "Şəkil və video qalereya",
        "Öz brendinizi əlavə edin",
        "Priority dəstək",
        "Analytics və hesabatlar"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            <div className="space-y-4 fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="gradient-text">Rəqəmsal dəvətnamə</span><br />
                yaratmaq heç vaxt bu qədər <span className="text-blue-600">asan olmayıb</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın. 
                Qonaqlarınızı dəvet edin və RSVP cavablarını real vaxtda izləyin.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up stagger-delay-2">
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg btn-hover"
                  data-testid="hero-dashboard-button"
                >
                  Dashboard-a get <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate('/register')} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg btn-hover"
                    data-testid="hero-register-button"
                  >
                    Pulsuz başla <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/login')} 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg btn-hover"
                    data-testid="hero-login-button"
                  >
                    Giriş et
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16 fade-in-up stagger-delay-3">
              <div className="text-center space-y-2">
                <div className="stats-number">10K+</div>
                <div className="stats-label">Yaradılmış dəvətnamə</div>
              </div>
              <div className="text-center space-y-2">
                <div className="stats-number">5K+</div>
                <div className="stats-label">Xoşbəxt müştəri</div>
              </div>
              <div className="text-center space-y-2">
                <div className="stats-number">99%</div>
                <div className="stats-label">Məmnuniyyət dərəcəsi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Niyə <span className="gradient-text">Vivento</span> seçməlisiniz?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dəvətnamə yaratmaqdan RSVP cavablarını toplamağa qədər bütün prosesi sadələşdiririk
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-0 shadow-lg bg-white">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Gözəl <span className="gradient-text">şablonlar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hər növ tədbir üçün peşəkar dizayn edilmiş şablonlardan seçin
            </p>
          </div>

          <div className="template-grid">
            {templates.map((template) => (
              <Card key={template.id} className="card-hover overflow-hidden bg-white shadow-lg">
                <div className="relative">
                  <img 
                    src={template.image} 
                    alt={template.name}
                    className="w-full h-48 object-cover"
                  />
                  {template.premium && (
                    <div className="absolute top-4 right-4">
                      <span className="premium-badge">Premium</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm capitalize">{template.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Sadə və <span className="gradient-text">şəffaf qiymətlər</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ehtiyaclarınıza uyğun planı seçin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`card-hover relative ${plan.popular ? 'ring-2 ring-blue-600 shadow-xl scale-105' : 'shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Ən populyar
                    </span>
                  </div>
                )}
                <CardContent className="p-8 text-center space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="space-y-1">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">₼ / ay</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                      : 'bg-gray-900 hover:bg-gray-800'
                    } text-white btn-hover`}
                    onClick={() => navigate('/register')}
                    data-testid={`pricing-plan-${plan.name.toLowerCase()}`}
                  >
                    Seç
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Növbəti tədbirinizi bugün planlaşdırın
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Milyonlarla insan Vivento ilə özlərinin ən vacib anlarını qeyd edir. 
            Siz də bizə qoşulun və mükəmməl dəvətnamələr yaradın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/register')} 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg btn-hover"
              data-testid="cta-register-button"
            >
              İndi başla <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-xl font-bold">Vivento</span>
              </div>
              <p className="text-gray-400">
                Rəqəmsal dəvətnamə platforması
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Məhsul</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Xüsusiyyətlər</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Şablonlar</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Qiymətlər</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Şirkət</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Haqqımızda</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Əlaqə</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Dəstək</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Hüquqi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Məxfilik</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Şərtlər</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Vivento. Bütün hüquqlar qorunur.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;