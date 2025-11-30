import React, { createContext, useContext, useState, useEffect } from 'react';

const SiteSettingsContext = createContext();

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site_logo: null,
    hero_title: 'Rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb',
    hero_subtitle: 'Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın.',
    facebook_url: null,
    instagram_url: null,
    tiktok_url: null
  });
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/site/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        console.log('Site settings loaded:', data);
      }
    } catch (error) {
      console.error('Site settings fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (newSettings) => {
    console.log('SiteSettings context: updateSettings called with:', newSettings);
    console.log('Previous settings:', settings);
    
    if (!newSettings || typeof newSettings !== 'object') {
      console.warn('Invalid newSettings provided:', newSettings);
      return;
    }
    
    setSettings(prev => {
      if (!prev) {
        console.warn('Previous settings is null, using defaults');
        prev = {
          site_logo: null,
          hero_title: 'Rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb',
          hero_subtitle: 'Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın.',
          facebook_url: null,
          instagram_url: null,
          tiktok_url: null
        };
      }
      const updated = { ...prev, ...newSettings };
      console.log('New settings state:', updated);
      return updated;
    });
  };

  const value = {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSiteSettings
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};