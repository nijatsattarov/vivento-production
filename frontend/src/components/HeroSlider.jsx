import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const HeroSlider = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/slides`);
      setSlides(response.data);
    } catch (error) {
      console.error('Sliderlər yüklənərkən xəta:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomPrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
      aria-label="Previous slide"
    >
      <ChevronLeft className="h-6 w-6 text-gray-800" />
    </button>
  );

  const CustomNextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
      aria-label="Next slide"
    >
      <ChevronRight className="h-6 w-6 text-gray-800" />
    </button>
  );

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    cssEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    appendDots: dots => (
      <div className="bottom-8">
        <ul className="flex justify-center space-x-2"> {dots} </ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 mx-1 bg-white/50 rounded-full hover:bg-white transition-all cursor-pointer" />
    )
  };

  if (loading) {
    return (
      <div className="relative h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no slides, show default hero
  if (slides.length === 0) {
    return (
      <section className="relative h-[600px] bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
          <div className="max-w-3xl space-y-8 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              {t('home.hero.defaultTitle').split('asan olmayıb').map((part, i) => 
                i === 0 ? part : (
                  <span key={i}>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                      {i18n.language === 'az' ? 'asan olmayıb' : i18n.language === 'en' ? 'this easy' : 'так просто'}
                    </span>
                    {part}
                  </span>
                )
              )}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed">
              {t('home.hero.defaultSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                {t('home.hero.startFree')}
              </Button>
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-600 px-8 py-4 text-lg rounded-xl"
              >
                {t('home.hero.signIn')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-slider relative">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id} className="relative">
            <div className="relative h-[600px] overflow-hidden">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${slide.image_url})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />
              </div>

              {/* Content */}
              <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
                <div className="max-w-3xl space-y-6 animate-fade-in">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="text-xl sm:text-2xl text-white/90 leading-relaxed drop-shadow-md">
                    {slide.subtitle}
                  </p>
                  {slide.button_text && (
                    <Button
                      onClick={() => navigate(slide.button_link || '/register')}
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                      {slide.button_text}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>

      <style jsx global>{`
        .hero-slider .slick-dots li.slick-active div {
          background-color: white;
          transform: scale(1.5);
        }
        
        .hero-slider .slick-dots li div {
          transition: all 0.3s ease;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </section>
  );
};

export default HeroSlider;
