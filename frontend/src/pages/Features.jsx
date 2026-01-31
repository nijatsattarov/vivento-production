import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Palette, 
  Users, 
  Share2, 
  Smartphone, 
  QrCode, 
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

const Features = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: <Palette className="h-8 w-8" />,
      title: t('home.features.feature1.title'),
      description: t('home.features.feature1.description'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: t('home.features.feature2.title'),
      description: t('home.features.feature2.description'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: t('home.features.feature3.title'),
      description: t('home.features.feature3.description'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: t('home.features.feature4.title'),
      description: t('home.features.feature4.description'),
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <QrCode className="h-8 w-8" />,
      title: t('home.features.feature5.title'),
      description: t('home.features.feature5.description'),
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: t('home.features.feature6.title'),
      description: t('home.features.feature6.description'),
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const additionalFeatures = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Peşəkar Şablonlar',
      description: 'Dizaynerlərimiz tərəfindən hazırlanmış yüzlərlə gözəl şablon'
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email Dəvətnamələr',
      description: 'Qonaqlarınıza birbaşa email ilə dəvətnamə göndərin'
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'WhatsApp Paylaşımı',
      description: 'Bir klikdə WhatsApp ilə dəvətnamələrinizi paylaşın'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Statistikalar',
      description: 'RSVP cavablarını real vaxtda izləyin'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Təhlükəsizlik',
      description: 'Məlumatlarınız təhlükəsiz şəkildə saxlanılır'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Sürətli İstifadə',
      description: 'Bir neçə dəqiqə ərzində dəvətnamənizi hazırlayın'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.features.title')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Vivento ilə rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb. 
            Bütün xüsusiyyətlərimizi kəşf edin.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Daha Çox Xüsusiyyətlər
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('home.howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('home.howItWorks.step1.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step1.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('home.howItWorks.step2.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step2.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('home.howItWorks.step3.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            İndi Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Pulsuz qeydiyyatdan keçin və ilk dəvətnamənizi yaradın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/register')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            >
              Pulsuz Başla
            </Button>
            <Button 
              onClick={() => navigate('/templates')}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              Şablonlara Bax
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
