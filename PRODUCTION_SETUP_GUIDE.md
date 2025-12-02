# 🚀 Vivento - Production Deployment Guide

## ⚠️ CRITICAL: Environment Variables Configuration

### 📌 Problem: Şəkillər Production-da Görünmür

**Səbəb**: Backend absolute URL yaratmaq üçün `BACKEND_URL` environment variable-a ehtiyac duyur.

---

## 🔧 Render.com Backend Configuration

### Required Environment Variables:

Render.com dashboard-da **Environment** bölməsinə daxil olun və aşağıdakı variables əlavə edin:

```bash
# 1. Backend URL (ÖNƏMLİ!)
BACKEND_URL=https://your-backend-url.onrender.com
# Nümunə: BACKEND_URL=https://vivento-backend.onrender.com

# 2. MongoDB Connection
MONGO_URL=your_mongodb_connection_string
# Nümunə: MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# 3. Database Name
DB_NAME=your_database_name
# Nümunə: DB_NAME=vivento_production

# 4. CORS Origins (Frontend domain-lərini əlavə edin)
CORS_ORIGINS=https://myvivento.com,https://www.myvivento.com
# Bütün domainlərinizi vergül ilə ayırın

# 5. JWT Secret Key
SECRET_KEY=your-super-long-random-secret-key-here
# Minimum 32 simvol, random string

# 6. Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 7. Epoint.az Payment Gateway (Credentials aldıqdan sonra)
EPOINT_MERCHANT_ID=your_merchant_id
EPOINT_PUBLIC_KEY=your_public_key
EPOINT_PRIVATE_KEY=your_private_key
```

---

## 🌐 Netlify Frontend Configuration

### Required Environment Variables:

Netlify dashboard-da **Site settings → Environment variables** bölməsinə:

```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
# Bu frontend-dən backend-ə API çağırışları üçün istifadə olunur

# Google OAuth (Optional)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## ✅ Yoxlama Checklist

### Backend (Render.com):

- [ ] `BACKEND_URL` set edilib və backend domain-i ilə uyğundur
- [ ] `MONGO_URL` düzgün MongoDB connection string
- [ ] `CORS_ORIGINS` frontend domain-lərini daxil edir
- [ ] `SECRET_KEY` güclü və unikal string-dir

### Frontend (Netlify):

- [ ] `REACT_APP_BACKEND_URL` backend URL ilə eynidir
- [ ] Build və deploy uğurla tamamlanıb

### Test:

1. **Login Test**: Frontend-də login edə bildiyinizi yoxlayın
2. **Balance Test**: Dashboard-da balans göstərilir
3. **Image Upload Test**: Admin paneldə şəkil yükləyin və görünməsini yoxlayın
4. **Guest Add Test**: Qonaq əlavə edərkən balansdan 0.10 AZN çıxılmalıdır

---

## 🐛 Tez-tez Rast Gəlinən Problemlər

### 1. Şəkillər görünmür (`localhost:8001` xətası)

**Səbəb**: `BACKEND_URL` Render.com-da set edilməyib

**Həll**: 
```bash
BACKEND_URL=https://your-backend.onrender.com
```
Render.com-da əlavə edin və servisi restart edin.

---

### 2. CORS xətası (frontend backend-ə çata bilmir)

**Səbəb**: `CORS_ORIGINS` düzgün konfiqurasiya olunmayıb

**Həll**:
```bash
CORS_ORIGINS=https://myvivento.com,https://www.myvivento.com
```
Həm `www` həm də `www-siz` versiyasını əlavə edin.

---

### 3. Login işləmir / 500 xətası

**Səbəb**: MongoDB connection və ya SECRET_KEY problemlidir

**Həll**:
- MongoDB Atlas-da IP whitelist yoxlayın (`0.0.0.0/0` production üçün)
- `SECRET_KEY` set edildiyini təsdiqləyin

---

### 4. Google Login işləmir

**Səbəb**: Google Cloud Console-da production domain authorize edilməyib

**Həll**:
1. Google Cloud Console → Credentials
2. OAuth 2.0 Client ID-yə klik edin
3. **Authorized JavaScript origins** əlavə edin:
   - `https://myvivento.com`
   - `https://www.myvivento.com`
4. **Authorized redirect URIs** əlavə edin:
   - `https://myvivento.com/auth/google/callback`

---

### 5. Payment Gateway test edilməyib

**Səbəb**: Epoint.az credentials hələ əlavə edilməyib

**Həll**:
1. Epoint.az-dan merchant credentials alın
2. Render.com-da environment variables əlavə edin:
   ```bash
   EPOINT_MERCHANT_ID=...
   EPOINT_PUBLIC_KEY=...
   EPOINT_PRIVATE_KEY=...
   ```
3. Backend-i restart edin

---

## 📊 Environment Variables Özət Cədvəli

| Variable | Render.com (Backend) | Netlify (Frontend) | Required |
|----------|---------------------|-------------------|----------|
| `BACKEND_URL` | ✅ | ❌ | ✅ Yes |
| `REACT_APP_BACKEND_URL` | ❌ | ✅ | ✅ Yes |
| `MONGO_URL` | ✅ | ❌ | ✅ Yes |
| `DB_NAME` | ✅ | ❌ | ✅ Yes |
| `CORS_ORIGINS` | ✅ | ❌ | ✅ Yes |
| `SECRET_KEY` | ✅ | ❌ | ✅ Yes |
| `GOOGLE_CLIENT_ID` | ✅ | ✅ | ⚠️ Optional |
| `GOOGLE_CLIENT_SECRET` | ✅ | ❌ | ⚠️ Optional |
| `EPOINT_MERCHANT_ID` | ✅ | ❌ | ⚠️ When ready |
| `EPOINT_PUBLIC_KEY` | ✅ | ❌ | ⚠️ When ready |
| `EPOINT_PRIVATE_KEY` | ✅ | ❌ | ⚠️ When ready |

---

## 🎯 Deployment Steps (Addım-addım)

### 1. Backend Deploy (Render.com)

1. Render.com dashboard-a daxil olun
2. Backend service-ə keçin
3. **Environment** tab-a keçin
4. Yuxarıdakı bütün backend variables-ı əlavə edin
5. **Save Changes** və avtomatik restart gözləyin

### 2. Frontend Deploy (Netlify)

1. Netlify dashboard-a daxil olun
2. Site-a keçin
3. **Site settings → Environment variables**
4. Yuxarıdakı frontend variables-ı əlavə edin
5. **Deploys** tab-a keçin və **Trigger deploy** klik edin

### 3. Test

1. Production URL-ə daxil olun: `https://myvivento.com`
2. Login edin
3. Admin panel-ə keçin
4. Şəkil yükləyin və görünməsini yoxlayın
5. Qonaq əlavə edin və balans deduction yoxlayın

---

## 📞 Dəstək

Problem davam edərsə:
1. Render.com backend logs yoxlayın
2. Netlify build logs yoxlayın
3. Browser developer console-da xətaları yoxlayın
4. Screenshot göndərin və dəstək alın

---

**Son yenilənmə**: 2 Dekabr 2025
**Versiya**: 1.0
