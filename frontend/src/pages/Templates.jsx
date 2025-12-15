import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import { ChevronLeft, Crown, Palette } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Templates = () => {
  const navigate = useNavigate();
  const { parent, sub } = useParams();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const categoryNames = {
    toy: 'Toy',
    dogum: 'Doğum günü',
    usaq: 'Uşaq',
    biznes: 'Biznes',
    tebrik: 'Təbrik postları',
    bayram: 'Bayramlar',
    diger: 'Digər'
  };

  const subCategoryNames = {
    // Toy
    nisan: 'Nişan',
    qiz_isteme: 'Qız İstəmə',
    xina: 'Xınayaxdı',
    evlenme: 'Evlənmə',
    qosatoy: 'Qoşatoy',
    
    // Doğum günü
    ad_gunu: 'Ad günü',
    
    // Uşaq
    xitay_sunet: 'Xitay-Sünnət',
    
    // Biznes
    acilis: 'Açılış',
    
    // Bayram
    novr