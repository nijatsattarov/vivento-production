# 🚂 Railway Backend Deployment Guide

## Step 1: Railway Project Setup
1. **Railway.app-a daxil olun** (token: 3b2ba103-001f-406d-8f2f-bbbf1cf82c9c)
2. **"New Project"** düyməsini basın
3. **"Deploy from GitHub repo"** seçin
4. **"nijatsattarov/vivento-production"** repo seçin
5. **"Deploy Now"** basın

## Step 2: Backend Configuration
1. Project yaradıldıqdan sonra **Settings** → **General** 
2. **Root Directory:** `backend` yazın
3. **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

## Step 3: Environment Variables
Settings → Variables → Add bütün variables:

```bash
MONGO_URL=mongodb+srv://vivento_user:PASSWORD@vivento-cluster.xxxxx.mongodb.net/vivento?retryWrites=true&w=majority
SECRET_KEY=vivento-production-secret-key-2024
CORS_ORIGINS=*
PORT=8001
DB_NAME=vivento_production
```

## Step 4: Get Backend URL
Deploy olduqdan sonra:
1. **Deployments** tab-a baxın
2. **Domain** URL-ni copy edin: `https://vivento-production-production.up.railway.app`
3. Bu URL-ni save edin (Vercel üçün lazımdır)

## Step 5: MongoDB Atlas Setup
1. **atlas.mongodb.com** → Create free cluster
2. **Database Access** → Create user (vivento_user/password)
3. **Network Access** → Add IP (0.0.0.0/0)
4. **Connect** → Get connection string
5. Railway-də **MONGO_URL** update edin

## ✅ Railway Backend Ready!
Backend URL: https://your-project.railway.app
API Test: https://your-project.railway.app/api/