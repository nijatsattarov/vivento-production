# ⚡ Vercel Frontend Deployment Guide

## Step 1: Vercel Project Setup
1. **Vercel.com-a daxil olun** (token: W00LS440dlB5QiAvYaBcIh31)
2. **"New Project"** → **"Import Git Repository"**
3. **"nijatsattarov/vivento-production"** seçin
4. **Framework Preset:** Create React App
5. **Root Directory:** `frontend`

## Step 2: Build Settings
```bash
Build Command: npm run build
Output Directory: build  
Install Command: npm install
Node.js Version: 18.x
```

## Step 3: Environment Variables
**Environment Variables** section-da əlavə edin:

```bash
REACT_APP_BACKEND_URL = https://your-railway-backend-url.railway.app
```

⚠️ **Vacib:** Railway backend URL-ni əvvəl alıb buraya yazın!

## Step 4: Deploy
1. **"Deploy"** düyməsini basın
2. 2-3 dəqiqə deploy process gözləyin
3. **Success** olduqdan sonra URL alın

## Step 5: Custom Domain (Optional)
1. **Settings** → **Domains**
2. **Add Domain** → **yourdomain.com** 
3. DNS settings-ə CNAME əlavə edin

## ✅ Vercel Frontend Ready!  
Frontend URL: https://vivento-production.vercel.app