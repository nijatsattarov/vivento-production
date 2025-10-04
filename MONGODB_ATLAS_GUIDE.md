# 🍃 MongoDB Atlas Setup Guide

## Step 1: Create Free Cluster
1. **atlas.mongodb.com** → Sign up with Google
2. **"Create a deployment"** → **M0 Sandbox (FREE)**
3. **Provider:** AWS, **Region:** Frankfurt 
4. **Cluster Name:** vivento-production
5. **"Create Deployment"** (2-3 dəqiqə gözləyin)

## Step 2: Database User
1. **Security** → **Database Access**
2. **"Add New Database User"**
   - **Username:** vivento_user
   - **Password:** GÜCLÜ_PAROL_YAZIN (save edin!)
   - **Database User Privileges:** Read and write to any database
3. **"Add User"**

## Step 3: Network Access  
1. **Security** → **Network Access**
2. **"Add IP Address"** → **"Allow access from anywhere"** (0.0.0.0/0)
3. **"Confirm"**

## Step 4: Get Connection String
1. **Database** → **"Connect"**
2. **"Drivers"** → **Python 3.12+**  
3. **Copy connection string:**

```
mongodb+srv://vivento_user:<password>@vivento-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

4. `<password>` yerinə real parolunuzu yazın
5. URL sonuna `/vivento` əlavə edin:

```  
mongodb+srv://vivento_user:REAL_PASSWORD@vivento-production.xxxxx.mongodb.net/vivento?retryWrites=true&w=majority
```

## Step 5: Test Connection
Railway-də MONGO_URL-ni update etdikdən sonra:
- Backend logs yoxlayın (Railway dashboard)
- API test edin: `https://your-backend.railway.app/api/`

## ✅ MongoDB Atlas Ready!
Connection String hazır - Railway-də update edin!