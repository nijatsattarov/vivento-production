from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Cookie, Response, File, UploadFile, Body, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import jwt
from passlib.context import CryptContext
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Helper function to generate absolute file URLs
def get_absolute_file_url(relative_path: str) -> str:
    """Convert relative file path to absolute URL"""
    if relative_path.startswith('http'):
        return relative_path
    # Remove leading slash if present
    path = relative_path.lstrip('/')
    return f"{BACKEND_URL}/{path}"

# Security
import hashlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def simple_hash_password(password: str) -> str:
    """Simple password hashing for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Simple password verification for testing"""
    return simple_hash_password(plain_password) == hashed_password
SECRET_KEY = os.environ.get("SECRET_KEY", "your-super-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app
app = FastAPI(title="Vivento - Dəvətnamə Platforması")

# Mount static files for uploads
# Must be done before including the API router
# Using /api/uploads to avoid conflict with frontend routes
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    facebook_id: Optional[str] = None
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool = True
    subscription_type: str = "free"  # free, premium, vip
    balance: float = 0.0  # AZN balance
    free_invitations_used: int = 0  # Track free invitations used (max 30)
    favorites: List[str] = []  # List of template IDs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    date: datetime
    location: str
    map_link: Optional[str] = None
    additional_notes: Optional[str] = None
    template_id: Optional[str] = None
    custom_design: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Template(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # Kept for backward compatibility
    parent_category: Optional[str] = "toy"  # toy, dogum-gunu, usaq, biznes, tebrik, bayramlar, diger
    sub_category: Optional[str] = "toy-devetname"  # toy-devetname, nisan, ad-gunu-devetname, etc.
    thumbnail_url: str
    design_data: Dict[str, Any]
    is_premium: bool = False
    price_per_invitation: float = 0.10  # AZN per invitation for premium templates
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Guest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    unique_token: str = Field(default_factory=lambda: str(uuid.uuid4()))

class BalanceTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float  # AZN
    transaction_type: str  # "payment", "invitation_charge", "refund"
    description: str
    payment_method: Optional[str] = None  # "card", "bank_transfer", etc.
    payment_id: Optional[str] = None  # External payment system ID
    status: str = "completed"  # "pending", "completed", "failed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float  # AZN
    payment_method: str
    status: str = "pending"  # "pending", "completed", "failed"
    payment_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class SiteSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site_logo: Optional[str] = None
    hero_title: str = "Rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb"
    hero_subtitle: str = "Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın."
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UpdateSiteSettingsRequest(BaseModel):
    site_logo: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    rsvp_status: Optional[str] = None  # gəlirəm, gəlmirəm
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    responded_at: Optional[datetime] = None

# CMS Models
class CMSPage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_type: str  # about, contact, terms, privacy
    title: str
    description: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    content: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    author_id: str
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    published: bool = False
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Blog Request Models
class CreateBlogRequest(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    published: bool = False

class UpdateBlogRequest(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    published: Optional[bool] = None


# Font Model
class CustomFont(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    file_url: str
    font_format: str  # ttf, woff, woff2, otf
    font_family: str  # CSS font-family name
    category: Optional[str] = "sans-serif"  # sans-serif, serif, script, decorative
    uploaded_by: str  # admin user_id or system
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Hero Slider Model
class HeroSlide(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str
    image_url: str
    button_text: Optional[str] = "Başla"
    button_link: Optional[str] = "/register"
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class FacebookLoginRequest(BaseModel):
    access_token: str

class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class EventCreate(BaseModel):
    name: str
    date: datetime
    location: str
    map_link: Optional[str] = None
    additional_notes: Optional[str] = None
    template_id: Optional[str] = None
    custom_design: Optional[Dict[str, Any]] = None

class GuestCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None

class RSVPResponse(BaseModel):
    status: str  # gəlirəm, gəlmirəm

# Security helpers
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_token: Optional[str] = Cookie(None)
):
    """
    Get current user from either session_token cookie or Authorization header
    Supports both Emergent Auth sessions and JWT tokens
    """
    token = None
    
    # Try session token from cookie first
    if session_token:
        # Check if it's an Emergent Auth session
        session = await db.user_sessions.find_one({"session_token": session_token})
        if session:
            # Check expiry
            if session["expires_at"] >= datetime.now(timezone.utc):
                user = await db.users.find_one({"id": session["user_id"]})
                if user:
                    return User(**user)
        token = session_token
    
    # Fallback to Authorization header (JWT or session token)
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Giriş tələb olunur"
        )
    
    # Try as JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Etibarsız token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Etibarsız token"
        )
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="İstifadəçi tapılmadı"
        )
    return User(**user)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_token: Optional[str] = Cookie(None)
) -> Optional[User]:
    """
    Optional user authentication - returns None if not authenticated
    """
    try:
        return await get_current_user(credentials, session_token)
    except HTTPException:
        return None

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    # Check if user exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email artıq istifadədədir")
    
    # Create user
    hashed_password = simple_hash_password(request.password)
    user = User(
        name=request.name,
        email=request.email
    )
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user_doc = await db.users.find_one({"email": request.email})
    if not user_doc or not verify_password(request.password, user_doc.get("password", "")):
        raise HTTPException(status_code=400, detail="Email və ya parol səhvdir")
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@api_router.post("/auth/facebook", response_model=TokenResponse)
async def facebook_login(request: FacebookLoginRequest):
    # Verify Facebook token
    url = "https://graph.facebook.com/me"
    params = {
        "access_token": request.access_token,
        "fields": "id,name,email,picture"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Facebook token etibarsızdır")
    
    facebook_data = response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"facebook_id": facebook_data["id"]})
    
    if not user_doc and facebook_data.get("email"):
        # Try to find by email
        user_doc = await db.users.find_one({"email": facebook_data["email"]})
        if user_doc:
            # Link Facebook account
            await db.users.update_one(
                {"id": user_doc["id"]}, 
                {"$set": {"facebook_id": facebook_data["id"], "profile_picture": facebook_data.get("picture", {}).get("data", {}).get("url")}}
            )
    
    if not user_doc:
        # Create new user
        user = User(
            name=facebook_data["name"],
            email=facebook_data.get("email", ""),
            facebook_id=facebook_data["id"],
            profile_picture=facebook_data.get("picture", {}).get("data", {}).get("url")
        )
        await db.users.insert_one(user.dict())
    else:
        user = User(**user_doc)
    
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@api_router.post("/auth/google", response_model=TokenResponse)
async def google_login(request: GoogleLoginRequest):
    """Google OAuth authentication with real token verification"""
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        credential = request.credential
        
        if not credential:
            raise HTTPException(status_code=400, detail="Google credential tələb olunur")
        
        # Verify Google token
        try:
            GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
            
            if not GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=500, detail="Google OAuth konfiqurasiya edilməyib")
            
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                credential, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # Get user info from token
            google_user_id = idinfo.get('sub')
            email = idinfo.get('email')
            name = idinfo.get('name', email.split('@')[0])
            picture = idinfo.get('picture')
            
            logger.info(f"Google auth successful for: {email}")
            
        except ValueError as e:
            logger.error(f"Invalid Google token: {e}")
            raise HTTPException(status_code=400, detail="Etibarsız Google token")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email})
        
        if not user_doc:
            # Create new user
            new_user = User(
                email=email,
                name=name,
                google_id=google_user_id,
                profile_picture=picture
            )
            await db.users.insert_one(new_user.dict())
            user = new_user
            logger.info(f"Created new user: {email}")
        else:
            user = User(**user_doc)
            # Update google_id and picture if not set
            if not user_doc.get('google_id'):
                await db.users.update_one(
                    {"id": user.id},
                    {"$set": {"google_id": google_user_id, "profile_picture": picture}}
                )
        
        # Create JWT token
        access_token = create_access_token(data={"sub": user.id})
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Google ilə giriş zamanı xəta baş verdi")


# Emergent Auth Integration - Session Management
@api_router.post("/auth/emergent/session")
async def process_emergent_session(
    request: Dict[str, str],
    response: Response
):
    """
    Process Emergent Auth session ID and create local session
    Receives session_id from frontend, exchanges it for session_token
    """
    try:
        session_id = request.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id tələb olunur")
        
        # Exchange session_id for user data and session_token
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Sessiya etibarsızdır")
            
            auth_data = auth_response.json()
        
        # Extract user data
        user_id = auth_data.get("id")
        email = auth_data.get("email")
        name = auth_data.get("name", "User")
        picture = auth_data.get("picture")
        session_token = auth_data.get("session_token")
        
        if not all([user_id, email, session_token]):
            raise HTTPException(status_code=400, detail="Natamam məlumat")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email})
        
        if not user_doc:
            # Create new user
            new_user = User(
                id=user_id,  # Use Emergent's user ID
                email=email,
                name=name,
                google_id=user_id,  # Store as Google ID
                profile_picture=picture
            )
            await db.users.insert_one(new_user.dict())
            user_doc = new_user.dict()
        
        # Create session in database
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        session_data = {
            "user_id": user_doc["id"],
            "session_token": session_token,
            "expires_at": session_expires,
            "created_at": datetime.now(timezone.utc)
        }
        
        # Remove old sessions for this user
        await db.user_sessions.delete_many({"user_id": user_doc["id"]})
        # Insert new session
        await db.user_sessions.insert_one(session_data)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        user = User(**user_doc)
        return {
            "success": True,
            "user": user,
            "session_token": session_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emergent session error: {e}")
        raise HTTPException(status_code=500, detail="Sessiya yaradılarkən xəta")

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Logout user and clear session"""
    try:
        # If we have a session token from cookie, delete it
        if session_token:
            await db.user_sessions.delete_one({"session_token": session_token})
        
        # If we have current user, delete all their sessions
        if current_user:
            await db.user_sessions.delete_many({"user_id": current_user.id})
        
        # Clear cookie
        response.delete_cookie(
            key="session_token",
            path="/",
            secure=True,
            httponly=True,
            samesite="none"
        )
        
        return {"success": True, "message": "Çıxış uğurla tamamlandı"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Çıxış zamanı xəta")

@api_router.get("/auth/session")
async def check_session(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
):
    """Check if user has valid session"""
    try:
        # Try cookie first
        token = session_token
        
        # Fallback to Authorization header
        if not token and authorization:
            if authorization.startswith("Bearer "):
                token = authorization.replace("Bearer ", "")
        
        if not token:
            return {"authenticated": False, "user": None}
        
        # Find session
        session = await db.user_sessions.find_one({"session_token": token})
        if not session:
            # Try JWT token
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = payload.get("sub")
                if user_id:
                    user_doc = await db.users.find_one({"id": user_id})
                    if user_doc:
                        return {"authenticated": True, "user": User(**user_doc)}
            except:
                pass
            return {"authenticated": False, "user": None}
        
        # Check expiry
        if session["expires_at"] < datetime.now(timezone.utc):
            await db.user_sessions.delete_one({"session_token": token})
            response.delete_cookie(key="session_token")
            return {"authenticated": False, "user": None}
        
        # Get user
        user_doc = await db.users.find_one({"id": session["user_id"]})
        if not user_doc:
            return {"authenticated": False, "user": None}
        
        return {"authenticated": True, "user": User(**user_doc)}
        
    except Exception as e:
        logger.error(f"Session check error: {e}")
        return {"authenticated": False, "user": None}

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/profile", response_model=User)
async def update_profile(
    name: Optional[str] = None,
    profile_picture: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update user profile (name and profile picture)"""
    update_data = {}
    
    if name:
        update_data["name"] = name
    if profile_picture:
        update_data["profile_picture"] = profile_picture
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Heç bir məlumat dəyişdirilmədi")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return User(**updated_user)

@api_router.put("/auth/email")
async def update_email(
    new_email: str,
    password: str,
    current_user: User = Depends(get_current_user)
):
    """Update user email"""
    # Check if new email already exists
    existing_user = await db.users.find_one({"email": new_email})
    if existing_user and existing_user["id"] != current_user.id:
        raise HTTPException(status_code=400, detail="Bu email artıq istifadə olunur")
    
    # Verify current password
    user_doc = await db.users.find_one({"id": current_user.id})
    if not user_doc.get("password"):
        raise HTTPException(status_code=400, detail="Bu hesab social login ilə yaradılıb")
    
    if not verify_password(password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Cari parol səhvdir")
    
    # Update email
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"email": new_email, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Email uğurla dəyişdirildi"}

@api_router.put("/auth/password")
async def update_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    """Update user password"""
    user_doc = await db.users.find_one({"id": current_user.id})
    
    if not user_doc.get("password"):
        raise HTTPException(status_code=400, detail="Bu hesab social login ilə yaradılıb")
    
    # Verify current password
    if not verify_password(current_password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Cari parol səhvdir")
    
    # Hash new password
    hashed_password = simple_hash_password(new_password)
    
    # Update password
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Parol uğurla dəyişdirildi"}

@api_router.post("/upload/profile")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload profile picture"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Yalnız JPG, PNG və WEBP formatları dəstəklənir")
    
    # Validate file size (5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Şəkil 5MB-dan kiçik olmalıdır")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"profile_{current_user.id}_{int(datetime.now().timestamp())}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, 'wb') as f:
        f.write(contents)
    
    # Return absolute file URL
    file_url = get_absolute_file_url(f"/api/uploads/{filename}")
    
    return {"file_url": file_url, "filename": filename}

# Template routes
@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    templates = await db.templates.find().to_list(100)
    return [Template(**template) for template in templates]

@api_router.get("/templates/category/{parent_category}")
async def get_templates_by_parent_category(parent_category: str):
    """Get all templates for a parent category"""
    templates = await db.templates.find({"parent_category": parent_category}).to_list(100)
    return [Template(**template) for template in templates]

@api_router.get("/templates/category/{parent_category}/{sub_category}")
async def get_templates_by_full_category(parent_category: str, sub_category: str):
    """Get templates by both parent and sub category"""
    templates = await db.templates.find({
        "parent_category": parent_category,
        "sub_category": sub_category
    }).to_list(100)
    return [Template(**template) for template in templates]

@api_router.get("/templates/{category}")
async def get_templates_by_category(category: str):
    """Legacy endpoint - kept for backward compatibility"""
    templates = await db.templates.find({"category": category}).to_list(100)
    return [Template(**template) for template in templates]

# Event routes
@api_router.post("/events", response_model=Event)
async def create_event(request: EventCreate, current_user: User = Depends(get_current_user)):
    event = Event(
        user_id=current_user.id,
        name=request.name,
        date=request.date,
        location=request.location,
        map_link=request.map_link,
        additional_notes=request.additional_notes,
        template_id=request.template_id,
        custom_design=request.custom_design
    )
    await db.events.insert_one(event.dict())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_user_events(current_user: User = Depends(get_current_user)):
    events = await db.events.find({"user_id": current_user.id}).to_list(100)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: User = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id})
    if not event:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, request: EventCreate, current_user: User = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id})
    if not event:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    
    update_data = request.dict(exclude_none=True)  # Don't update None values
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    updated_event = await db.events.find_one({"id": event_id})
    return Event(**updated_event)

# Guest routes
@api_router.post("/events/{event_id}/guests", response_model=Guest)
async def add_guest(event_id: str, request: GuestCreate, current_user: User = Depends(get_current_user)):
    # Verify event ownership
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id})
    if not event:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    
    guest = Guest(
        event_id=event_id,
        name=request.name,
        phone=request.phone,
        email=request.email
    )
    await db.guests.insert_one(guest.dict())
    return guest

@api_router.get("/events/{event_id}/guests")
async def get_event_guests(event_id: str, current_user: User = Depends(get_current_user)):
    # Verify event ownership
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id})
    if not event:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    
    guests = await db.guests.find({"event_id": event_id}).to_list(1000)
    
    # Convert to dict and remove MongoDB _id
    result = []
    for guest in guests:
        guest_dict = dict(guest)
        guest_dict.pop('_id', None)
        result.append(guest_dict)
    
    logger.info(f"Returning {len(result)} guests for event {event_id}")
    return result

# RSVP routes (public)
@api_router.get("/invite/{token}")
async def get_invitation(token: str):
    # Handle demo invitations
    if token.startswith('demo-'):
        event_id = token.replace('demo-', '')
        event = await db.events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
        
        # Create a demo guest for preview
        demo_guest = {
            "id": "demo-guest",
            "event_id": event_id,
            "name": "Demo Qonaq",
            "unique_token": token,
            "rsvp_status": None,
            "created_at": datetime.now(timezone.utc),
            "responded_at": None
        }
        
        return {
            "guest": Guest(**demo_guest),
            "event": Event(**event)
        }
    
    # Handle regular invitations
    guest = await db.guests.find_one({"unique_token": token})
    if not guest:
        raise HTTPException(status_code=404, detail="Dəvətnamə tapılmadı")
    
    event = await db.events.find_one({"id": guest["event_id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    
    return {
        "guest": Guest(**guest),
        "event": Event(**event)
    }

@api_router.post("/invite/{token}/rsvp")
async def respond_to_invitation(token: str, response: RSVPResponse):
    guest = await db.guests.find_one({"unique_token": token})
    if not guest:
        raise HTTPException(status_code=404, detail="Dəvətnamə tapılmadı")
    
    logger.info(f"RSVP received - Guest: {guest.get('name')}, Status: {response.status}")
    
    result = await db.guests.update_one(
        {"unique_token": token},
        {
            "$set": {
                "rsvp_status": response.status,
                "responded_at": datetime.now(timezone.utc)
            }
        }
    )
    
    logger.info(f"RSVP updated - Matched: {result.matched_count}, Modified: {result.modified_count}")
    
    # Verify update
    updated_guest = await db.guests.find_one({"unique_token": token})
    logger.info(f"Verified RSVP status: {updated_guest.get('rsvp_status')}")
    
    return {"message": "Cavabınız qeydə alındı"}

# Admin routes
@api_router.post("/admin/templates")
async def create_template(template_data: dict, current_user: User = Depends(get_current_user)):
    # Check if user is admin
    if not (current_user.email == 'admin@vivento.az' or 'admin' in current_user.email):
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    await db.templates.insert_one(template_data)
    return {"message": "Template əlavə edildi", "id": template_data["id"]}

@api_router.put("/admin/templates/{template_id}")
async def update_template(template_id: str, template_data: dict, current_user: User = Depends(get_current_user)):
    # Check if user is admin
    if not (current_user.email == 'admin@vivento.az' or 'admin' in current_user.email):
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    await db.templates.update_one({"id": template_id}, {"$set": template_data})
    return {"message": "Template yeniləndi"}

@api_router.delete("/admin/templates/{template_id}")
async def delete_template(template_id: str, current_user: User = Depends(get_current_user)):
    # Check if user is admin
    if not (current_user.email == 'admin@vivento.az' or 'admin' in current_user.email):
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    await db.templates.delete_one({"id": template_id})
    return {"message": "Template silindi"}

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Vivento API işləyir"}

# File upload endpoints
@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload an image file and return the URL"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
    
    # Validate file size (max 5MB)
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl ölçüsü 5MB-dan böyük ola bilməz")
    
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Return absolute URL
        file_url = get_absolute_file_url(f"/api/uploads/{unique_filename}")
        
        return {
            "filename": unique_filename,
            "file_url": file_url,
            "url": file_url,
            "message": "Şəkil uğurla yükləndi"
        }
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Fayl yüklənərkən xəta baş verdi")

@api_router.post("/upload/background")
async def upload_background_image(file: UploadFile = File(...)):
    """Upload background image for admin templates (no auth required for admin users)"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
    
    # Validate file size (max 10MB for backgrounds)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl ölçüsü 10MB-dan böyük ola bilməz")
    
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"bg_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Return absolute URL for backgrounds
        file_url = get_absolute_file_url(f"/api/uploads/{unique_filename}")
        
        return {
            "filename": unique_filename,
            "file_url": file_url,
            "url": file_url,
            "message": "Background şəkil uğurla yükləndi"
        }
        
    except Exception as e:
        logger.error(f"Background upload error: {e}")
        raise HTTPException(status_code=500, detail="Background şəkil yüklənərkən xəta baş verdi")

# Balance and Payment endpoints
@api_router.get("/user/balance")
async def get_user_balance(current_user: User = Depends(get_current_user)):
    """Get user's current balance and free invitation count"""
    return {
        "balance": current_user.balance,
        "free_invitations_used": current_user.free_invitations_used,
        "free_invitations_remaining": max(0, 30 - current_user.free_invitations_used),
        "currency": "AZN"
    }

# Old mock payment endpoint - removed (replaced by Epoint integration)

# Old mock complete endpoint - removed

@api_router.get("/user/transactions")
async def get_user_transactions(current_user: User = Depends(get_current_user)):
    """Get user's balance transaction history"""
    transactions = await db.balance_transactions.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(length=50)
    
    return [BalanceTransaction(**tx) for tx in transactions]

@api_router.post("/invitations/charge")
async def charge_for_invitation(
    event_id: str,
    guest_count: int,
    current_user: User = Depends(get_current_user)
):
    """Charge user for sending invitations based on template pricing"""
    # Get event and template info
    event_doc = await db.events.find_one({"id": event_id, "user_id": current_user.id})
    if not event_doc:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    
    event = Event(**event_doc)
    
    # Check if template has pricing
    template_price = 0.10  # Default price per invitation
    if event.template_id:
        template_doc = await db.templates.find_one({"id": event.template_id})
        if template_doc:
            template = Template(**template_doc)
            if template.is_premium:
                template_price = template.price_per_invitation
            else:
                template_price = 0  # Standard templates are free after 30 invitations
    
    # Calculate cost
    free_remaining = max(0, 30 - current_user.free_invitations_used)
    paid_invitations = max(0, guest_count - free_remaining)
    total_cost = paid_invitations * template_price
    
    # Check if user has enough balance
    if total_cost > current_user.balance:
        return {
            "success": False,
            "insufficient_balance": True,
            "required_balance": total_cost,
            "current_balance": current_user.balance,
            "message": f"Kifayət qədər balansınız yoxdur. Lazım: {total_cost:.2f} AZN"
        }
    
    # Deduct balance and update free invitation count
    updates = {}
    if total_cost > 0:
        updates["$inc"] = {"balance": -total_cost}
    
    if free_remaining > 0:
        free_used = min(guest_count, free_remaining)
        updates["$inc"] = updates.get("$inc", {})
        updates["$inc"]["free_invitations_used"] = free_used
    
    if updates:
        await db.users.update_one({"id": current_user.id}, updates)
    
    # Create transaction record
    if total_cost > 0:
        transaction = BalanceTransaction(
            user_id=current_user.id,
            amount=-total_cost,
            transaction_type="invitation_charge",
            description=f"Dəvətnamə göndərmə - {paid_invitations} ədəd x {template_price} AZN"
        )
        await db.balance_transactions.insert_one(transaction.dict())
    
    return {
        "success": True,
        "total_cost": total_cost,
        "paid_invitations": paid_invitations,
        "free_invitations_used": min(guest_count, free_remaining),
        "remaining_balance": current_user.balance - total_cost
    }

# Site Settings endpoints
@api_router.get("/site/settings")
async def get_site_settings():
    """Get current site settings"""
    settings_doc = await db.site_settings.find_one({})
    if not settings_doc:
        # Create default settings if none exist
        default_settings = SiteSettings()
        await db.site_settings.insert_one(default_settings.dict())
        return default_settings
    
    return SiteSettings(**settings_doc)

@api_router.put("/site/settings")
async def update_site_settings(
    request: UpdateSiteSettingsRequest,
    current_user: User = Depends(get_current_user)
):
    """Update site settings (admin only)"""
    try:
        # Check if user is admin
        if not (current_user.email == 'admin@vivento.az' or 'admin' in current_user.email):
            raise HTTPException(status_code=403, detail="Yalnız admin istifadə edə bilər")
        
        logger.info(f"Admin {current_user.email} updating site settings: {request}")
        
        site_logo = request.site_logo
        hero_title = request.hero_title
        hero_subtitle = request.hero_subtitle
        facebook_url = request.facebook_url
        instagram_url = request.instagram_url
        tiktok_url = request.tiktok_url
        
        # Get existing settings
        settings_doc = await db.site_settings.find_one({})
        if not settings_doc:
            # Create new settings
            settings = SiteSettings(
                site_logo=site_logo,
                hero_title=hero_title or "Rəqəmsal dəvətnamə yaratmaq heç vaxt bu qədər asan olmayıb",
                hero_subtitle=hero_subtitle or "Vivento ilə toy, nişan, doğum günü və digər tədbirləriniz üçün gözəl dəvətnamələr yaradın.",
                facebook_url=facebook_url,
                instagram_url=instagram_url,
                tiktok_url=tiktok_url
            )
            await db.site_settings.insert_one(settings.dict())
        else:
            # Update existing settings
            update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
            if site_logo is not None:
                update_data["site_logo"] = site_logo
            if hero_title is not None:
                update_data["hero_title"] = hero_title
            if hero_subtitle is not None:
                update_data["hero_subtitle"] = hero_subtitle
            if facebook_url is not None:
                update_data["facebook_url"] = facebook_url
            if instagram_url is not None:
                update_data["instagram_url"] = instagram_url
            if tiktok_url is not None:
                update_data["tiktok_url"] = tiktok_url
            
            await db.site_settings.update_one({}, {"$set": update_data})
            
            # Get updated settings
            settings_doc = await db.site_settings.find_one({})
            settings = SiteSettings(**settings_doc)
        
        return {
            "success": True,
            "message": "Sayt ayarları uğurla yeniləndi",
            "settings": settings
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 403 Forbidden)
        raise
    except Exception as e:
        logger.error(f"Site settings update error: {e}")
        raise HTTPException(status_code=500, detail="Sayt ayarları yenilənərkən xəta baş verdi")

# Favorites endpoints
@api_router.get("/favorites")
async def get_favorites(current_user: User = Depends(get_current_user)):
    """Get user's favorite templates"""
    try:
        # Get user from database to ensure we have latest favorites
        user_data = await db.users.find_one({"id": current_user.id})
        if not user_data:
            raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
        
        favorite_ids = user_data.get("favorites", [])
        
        if not favorite_ids:
            return {"favorites": []}
        
        # Fetch favorite templates
        templates = await db.templates.find({"id": {"$in": favorite_ids}}).to_list(length=100)
        
        # Remove MongoDB _id field to avoid serialization issues
        clean_templates = []
        for template in templates:
            template_dict = dict(template)
            template_dict.pop('_id', None)  # Remove MongoDB ObjectId
            clean_templates.append(template_dict)
        
        return {"favorites": clean_templates}
    except Exception as e:
        logger.error(f"Get favorites error: {e}")
        raise HTTPException(status_code=500, detail="Sevimlilər yüklənərkən xəta baş verdi")

@api_router.post("/favorites/{template_id}")
async def add_to_favorites(template_id: str, current_user: User = Depends(get_current_user)):
    """Add template to favorites"""
    try:
        # Check if template exists
        template = await db.templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(status_code=404, detail="Şablon tapılmadı")
        
        # First ensure the user has a favorites field
        user_doc = await db.users.find_one({"id": current_user.id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
        
        # Initialize favorites field if it doesn't exist
        if "favorites" not in user_doc:
            await db.users.update_one(
                {"id": current_user.id},
                {"$set": {"favorites": []}}
            )
        
        # Add template to favorites using $addToSet to avoid duplicates
        result = await db.users.update_one(
            {"id": current_user.id},
            {"$addToSet": {"favorites": template_id}}
        )
        
        logger.info(f"User {current_user.id} added template {template_id} to favorites")
        return {"message": "Sevimlilərə əlavə edildi", "template_id": template_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add to favorites error: {e}")
        raise HTTPException(status_code=500, detail="Sevimlilərə əlavə edilərkən xəta baş verdi")

@api_router.delete("/favorites/{template_id}")
async def remove_from_favorites(template_id: str, current_user: User = Depends(get_current_user)):
    """Remove template from favorites"""
    try:
        # Remove from favorites
        result = await db.users.update_one(
            {"id": current_user.id},
            {"$pull": {"favorites": template_id}}
        )
        
        return {"message": "Sevimlilərən silindi", "template_id": template_id}
    except Exception as e:
        logger.error(f"Remove from favorites error: {e}")
        raise HTTPException(status_code=500, detail="Sevimlilərədən silinərkən xəta baş verdi")

# CMS Endpoints
@api_router.get("/cms/{page_type}", response_model=CMSPage)
async def get_cms_page(page_type: str):
    """Get CMS page content by type (about, contact, support, privacy, terms)"""
    try:
        valid_types = ["about", "contact", "support", "privacy", "terms"]
        if page_type not in valid_types:
            raise HTTPException(status_code=400, detail="Səhifə tipi etibarsızdır")
        
        page = await db.cms_pages.find_one({"page_type": page_type})
        if not page:
            # Return default content based on page type
            default_contents = {
                "about": {
                    "title": "Haqqımızda",
                    "description": "Vivento - Azərbaycanın rəqəmsal dəvətnamə platforması. Tədbirləriniz üçün gözəl və peşəkar dəvətnamələr yaradın.",
                    "mission": "Hər bir xüsusi anınızı unudulmaz etmək üçün ən yaxşı rəqəmsal həlləri təqdim etmək.",
                    "vision": "Azərbaycanda ən yaxşı dəvətnamə platforması olmaq."
                },
                "contact": {
                    "title": "Əlaqə",
                    "content": "Bizimlə əlaqə saxlayın:\n\nEmail: info@vivento.az\nTelefon: +994 XX XXX XX XX\nÜnvan: Bakı, Azərbaycan"
                },
                "support": {
                    "title": "Dəstək",
                    "content": "Dəstək mərkəzi:\n\nSuallarınız varsa bizimlə əlaqə saxlaya bilərsiniz.\n\nEmail: support@vivento.az\nİş saatları: Bazar ertəsindən Cümə 09:00-18:00"
                },
                "privacy": {
                    "title": "Məxfilik Siyasəti",
                    "content": "Vivento məxfilik siyasəti\n\n1. Məlumat Toplanması\nBiz yalnız zəruri məlumatları toplayırıq.\n\n2. Məlumat Təhlükəsizliyi\nMəlumatlarınız qorunur.\n\n3. Üçüncü Tərəflər\nMəlumatlarınızı üçüncü tərəflərlə paylaşmırıq."
                },
                "terms": {
                    "title": "İstifadə Şərtləri",
                    "content": "Vivento istifadə şərtləri\n\n1. Xidmətdən İstifadə\nPlatformadan düzgün istifadə etməlisiniz.\n\n2. İstifadəçi Məsuliyyəti\nYaratdığınız məzmuna görə məsuliyyət daşıyırsınız.\n\n3. Dəyişikliklər\nŞərtlərdə dəyişiklik etmək hüququmuzu qoruyub saxlayırıq."
                }
            }
            
            default_data = default_contents.get(page_type, {})
            default_page = CMSPage(
                page_type=page_type,
                title=default_data.get("title", page_type.capitalize()),
                description=default_data.get("description"),
                mission=default_data.get("mission"),
                vision=default_data.get("vision"),
                content=default_data.get("content")
            )
            return default_page
        return CMSPage(**page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get CMS page error: {e}")
        raise HTTPException(status_code=500, detail="Səhifə yüklənərkən xəta baş verdi")

@api_router.put("/cms/{page_type}")
async def update_cms_page(
    page_type: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    mission: Optional[str] = None,
    vision: Optional[str] = None,
    content: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update CMS page (Admin only)"""
    # Check if user is admin
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    valid_types = ["about", "contact", "support", "privacy", "terms"]
    if page_type not in valid_types:
        raise HTTPException(status_code=400, detail="Səhifə tipi etibarsızdır")
    
    try:
        update_data = {}
        if title: update_data["title"] = title
        if description: update_data["description"] = description
        if mission: update_data["mission"] = mission
        if vision: update_data["vision"] = vision
        if content: update_data["content"] = content
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Heç bir məlumat dəyişdirilmədi")
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Check if page exists
        page = await db.cms_pages.find_one({"page_type": page_type})
        
        if not page:
            # Create new page
            new_page = CMSPage(
                page_type=page_type, 
                title=title or page_type.capitalize(),
                **update_data
            )
            await db.cms_pages.insert_one(new_page.dict())
        else:
            # Update existing page
            await db.cms_pages.update_one(
                {"page_type": page_type},
                {"$set": update_data}
            )
        
        return {"message": "Səhifə yeniləndi"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update CMS page error: {e}")
        raise HTTPException(status_code=500, detail="Səhifə yenilənərkən xəta baş verdi")

@api_router.get("/cms/about", response_model=CMSPage)
async def get_about_page():
    """Get About Us page content (deprecated - use /cms/about instead)"""
    return await get_cms_page("about")

# Blog Endpoints
@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts(published_only: bool = True, limit: int = 10):
    """Get blog posts"""
    try:
        query = {"published": True} if published_only else {}
        posts = await db.blog_posts.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        return [BlogPost(**post) for post in posts]
    except Exception as e:
        logger.error(f"Get blog posts error: {e}")
        raise HTTPException(status_code=500, detail="Bloq yazıları yüklənərkən xəta baş verdi")

@api_router.get("/blog/{slug}", response_model=BlogPost)
async def get_blog_post(slug: str):
    """Get single blog post by slug"""
    try:
        post = await db.blog_posts.find_one({"slug": slug, "published": True})
        if not post:
            raise HTTPException(status_code=404, detail="Bloq yazısı tapılmadı")
        
        # Increment views
        await db.blog_posts.update_one({"id": post["id"]}, {"$inc": {"views": 1}})
        post["views"] += 1
        
        return BlogPost(**post)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get blog post error: {e}")
        raise HTTPException(status_code=500, detail="Bloq yazısı yüklənərkən xəta baş verdi")

@api_router.post("/admin/blog", response_model=BlogPost)
async def create_blog_post(
    request: CreateBlogRequest,
    current_user: User = Depends(get_current_user)
):
    """Create blog post (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        # Check if slug already exists
        existing = await db.blog_posts.find_one({"slug": request.slug})
        if existing:
            raise HTTPException(status_code=400, detail="Bu slug artıq istifadə olunur")
        
        new_post = BlogPost(
            title=request.title,
            slug=request.slug,
            excerpt=request.excerpt,
            content=request.content,
            author=current_user.name or current_user.email.split('@')[0],
            author_id=current_user.id,
            thumbnail=request.thumbnail,
            category=request.category,
            tags=request.tags,
            published=request.published
        )
        
        await db.blog_posts.insert_one(new_post.dict())
        return new_post
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create blog post error: {e}")
        raise HTTPException(status_code=500, detail="Bloq yazısı yaradılarkən xəta baş verdi")

@api_router.put("/admin/blog/{post_id}", response_model=BlogPost)
async def update_blog_post(
    post_id: str,
    request: UpdateBlogRequest,
    current_user: User = Depends(get_current_user)
):
    """Update blog post (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        update_data = {}
        if request.title: update_data["title"] = request.title
        if request.slug: update_data["slug"] = request.slug
        if request.excerpt: update_data["excerpt"] = request.excerpt
        if request.content: update_data["content"] = request.content
        if request.thumbnail: update_data["thumbnail"] = request.thumbnail
        if request.category: update_data["category"] = request.category
        if request.tags is not None: update_data["tags"] = request.tags
        if request.published is not None: update_data["published"] = request.published
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Heç bir məlumat dəyişdirilmədi")
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.blog_posts.update_one(
            {"id": post_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bloq yazısı tapılmadı")
        
        return {"message": "Bloq yazısı yeniləndi"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update blog post error: {e}")
        raise HTTPException(status_code=500, detail="Bloq yazısı yenilənərkən xəta baş verdi")

@api_router.delete("/admin/blog/{post_id}")
async def delete_blog_post(post_id: str, current_user: User = Depends(get_current_user)):
    """Delete blog post (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        result = await db.blog_posts.delete_one({"id": post_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Bloq yazısı tapılmadı")
        return {"message": "Bloq yazısı silindi"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete blog post error: {e}")
        raise HTTPException(status_code=500, detail="Bloq yazısı silinərkən xəta baş verdi")


# Font Management Endpoints
@api_router.post("/admin/fonts/upload")
async def upload_custom_font(
    file: UploadFile = File(...),
    font_name: str = None,
    font_family: str = None,
    current_user: User = Depends(get_current_user)
):
    """Upload custom font file (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        # Validate file type
        allowed_types = ["font/ttf", "font/otf", "font/woff", "font/woff2", 
                        "application/x-font-ttf", "application/x-font-otf",
                        "application/font-woff", "application/font-woff2"]
        allowed_extensions = [".ttf", ".otf", ".woff", ".woff2"]
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Yalnız {', '.join(allowed_extensions)} formatları dəstəklənir"
            )
        
        # Read file
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="Font faylı çox böyükdür (maksimum 5MB)")
        
        # Generate unique filename
        unique_filename = f"font_{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Generate absolute file URL
        file_url = get_absolute_file_url(f"/api/uploads/{unique_filename}")
        
        # Determine font format
        format_map = {
            ".ttf": "truetype",
            ".otf": "opentype",
            ".woff": "woff",
            ".woff2": "woff2"
        }
        font_format = format_map.get(file_ext, "truetype")
        
        # Create font record
        font_name = font_name or Path(file.filename).stem
        font_family = font_family or font_name.replace(" ", "_")
        
        new_font = CustomFont(
            name=font_name,
            file_url=file_url,
            font_format=font_format,
            font_family=font_family,
            uploaded_by=current_user.id
        )
        
        await db.custom_fonts.insert_one(new_font.dict())
        
        return {
            "success": True,
            "font": new_font,
            "message": "Font uğurla yükləndi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Font upload error: {e}")
        raise HTTPException(status_code=500, detail="Font yüklənərkən xəta baş verdi")

@api_router.get("/fonts")
async def get_fonts(category: Optional[str] = None):
    """Get all custom fonts, optionally filtered by category"""
    try:
        query = {}
        if category:
            query["category"] = category
        
        fonts = await db.custom_fonts.find(query).to_list(length=None)
        
        # Convert to dict and remove MongoDB _id
        result = []
        for font in fonts:
            font_dict = dict(font)
            font_dict.pop('_id', None)  # Remove MongoDB _id
            result.append(font_dict)
        
        return result
    except Exception as e:
        logger.error(f"Get fonts error: {e}")
        raise HTTPException(status_code=500, detail="Fontlar yüklənərkən xəta baş verdi")

@api_router.delete("/admin/fonts/{font_id}")
async def delete_font(font_id: str, current_user: User = Depends(get_current_user)):
    """Delete custom font (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        # Get font to delete file
        font = await db.custom_fonts.find_one({"id": font_id})
        if not font:
            raise HTTPException(status_code=404, detail="Font tapılmadı")
        
        # Delete file
        try:
            file_path = UPLOAD_DIR / Path(font["file_url"]).name
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            logger.warning(f"Could not delete font file: {e}")
        
        # Delete from database
        await db.custom_fonts.delete_one({"id": font_id})
        
        return {"success": True, "message": "Font silindi"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete font error: {e}")
        raise HTTPException(status_code=500, detail="Font silinərkən xəta baş verdi")


# Hero Slider Endpoints
@api_router.get("/slides", response_model=List[HeroSlide])
async def get_slides():
    """Get all active hero slides (public)"""
    try:
        slides = await db.hero_slides.find({"is_active": True}).sort("order", 1).to_list(length=None)
        return [HeroSlide(**slide) for slide in slides]
    except Exception as e:
        logger.error(f"Get slides error: {e}")
        raise HTTPException(status_code=500, detail="Sliderlər yüklənərkən xəta baş verdi")

@api_router.get("/admin/slides", response_model=List[HeroSlide])
async def get_all_slides(current_user: User = Depends(get_current_user)):
    """Get all hero slides including inactive (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        slides = await db.hero_slides.find().sort("order", 1).to_list(length=None)
        return [HeroSlide(**slide) for slide in slides]
    except Exception as e:
        logger.error(f"Get all slides error: {e}")
        raise HTTPException(status_code=500, detail="Sliderlər yüklənərkən xəta baş verdi")

@api_router.post("/admin/slides", response_model=HeroSlide)
async def create_slide(
    title: str,
    subtitle: str,
    image_url: str,
    button_text: Optional[str] = "Başla",
    button_link: Optional[str] = "/register",
    order: int = 0,
    is_active: bool = True,
    current_user: User = Depends(get_current_user)
):
    """Create hero slide (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        new_slide = HeroSlide(
            title=title,
            subtitle=subtitle,
            image_url=image_url,
            button_text=button_text,
            button_link=button_link,
            order=order,
            is_active=is_active
        )
        
        await db.hero_slides.insert_one(new_slide.dict())
        return new_slide
    except Exception as e:
        logger.error(f"Create slide error: {e}")
        raise HTTPException(status_code=500, detail="Slider yaradılarkən xəta baş verdi")

@api_router.put("/admin/slides/{slide_id}", response_model=HeroSlide)
async def update_slide(
    slide_id: str,
    title: Optional[str] = None,
    subtitle: Optional[str] = None,
    image_url: Optional[str] = None,
    button_text: Optional[str] = None,
    button_link: Optional[str] = None,
    order: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user)
):
    """Update hero slide (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if subtitle is not None:
            update_data["subtitle"] = subtitle
        if image_url is not None:
            update_data["image_url"] = image_url
        if button_text is not None:
            update_data["button_text"] = button_text
        if button_link is not None:
            update_data["button_link"] = button_link
        if order is not None:
            update_data["order"] = order
        if is_active is not None:
            update_data["is_active"] = is_active
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Heç bir məlumat dəyişdirilmədi")
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.hero_slides.update_one(
            {"id": slide_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Slider tapılmadı")
        
        updated_slide = await db.hero_slides.find_one({"id": slide_id})
        return HeroSlide(**updated_slide)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update slide error: {e}")
        raise HTTPException(status_code=500, detail="Slider yenilənərkən xəta baş verdi")

@api_router.delete("/admin/slides/{slide_id}")
async def delete_slide(slide_id: str, current_user: User = Depends(get_current_user)):
    """Delete hero slide (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        result = await db.hero_slides.delete_one({"id": slide_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Slider tapılmadı")
        
        return {"success": True, "message": "Slider silindi"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete slide error: {e}")
        raise HTTPException(status_code=500, detail="Slider silinərkən xəta baş verdi")

# ============================================
# PAYMENT & BALANCE ENDPOINTS
# ============================================

from epoint_service import epoint_service

class CreatePaymentRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in AZN to add to balance")
    description: Optional[str] = "Balans artırma"

class PaymentCallbackRequest(BaseModel):
    data: str
    signature: str

@api_router.post("/test-payment")
async def test_payment_endpoint(data: dict = Body(...)):
    """Test endpoint"""
    return {"received": data}

@api_router.get("/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    """Get user's current balance"""
    try:
        user = current_user
        
        return {
            "balance": user.balance,
            "free_invitations_used": user.free_invitations_used,
            "free_invitations_remaining": max(0, 30 - user.free_invitations_used)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get balance error: {e}")
        raise HTTPException(status_code=500, detail="Balans məlumatı alınarkən xəta baş verdi")

@api_router.post("/payments/create")
async def create_payment(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Create a payment request for balance top-up
    Returns checkout URL for Epoint.az
    """
    try:
        user = current_user
        
        # Parse request body
        body = await request.json()
        amount = body.get("amount")
        description = body.get("description", "Balans artırma")
        
        # Validate amount
        if not amount or amount <= 0:
            raise HTTPException(status_code=400, detail="Məbləğ 0-dan böyük olmalıdır")
        
        # Generate unique order ID
        order_id = f"BAL-{user.id[:8]}-{uuid.uuid4().hex[:8].upper()}"
        
        # Create payment record in database
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=user.id,
            amount=amount,
            payment_method="epoint",
            status="pending"
        )
        
        await db.payments.insert_one(payment.model_dump())
        
        # Create payment request with Epoint
        payment_request = epoint_service.create_payment_request(
            order_id=order_id,
            amount=amount,
            currency="AZN",
            description=description or f"Balans artırma: {amount} AZN",
            language="az"
        )
        
        # Store order_id in payment record for callback matching
        await db.payments.update_one(
            {"id": payment.id},
            {"$set": {"payment_url": payment_request["checkout_url"], "order_id": order_id}}
        )
        
        logger.info(f"Payment created: {order_id} for user {user.id}, amount: {amount} AZN")
        
        return {
            "order_id": order_id,
            "payment_id": payment.id,
            "checkout_url": payment_request["checkout_url"],
            "data": payment_request["data"],
            "signature": payment_request["signature"],
            "amount": amount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create payment error: {e}")
        raise HTTPException(status_code=500, detail="Ödəniş yaradılarkən xəta baş verdi")

@api_router.post("/payments/callback")
async def payment_callback(request: PaymentCallbackRequest):
    """
    Handle payment callback from Epoint.az
    Verify signature and update balance
    """
    try:
        # Verify signature
        if not epoint_service.verify_callback_signature(request.data, request.signature):
            logger.warning("Invalid payment callback signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Decode callback data
        callback_data = epoint_service.decode_callback_data(request.data)
        
        logger.info(f"Payment callback received: {callback_data}")
        
        # Extract payment information
        order_id = callback_data.get("order_id")
        status = callback_data.get("status", "").lower()
        transaction_id = callback_data.get("transaction")
        
        # Find payment record
        payment = await db.payments.find_one({"order_id": order_id}, {"_id": 0})
        
        if not payment:
            logger.warning(f"Payment not found for order_id: {order_id}")
            return {"status": "ignored", "message": "Payment not found"}
        
        # Update payment status
        if status == "success":
            # Update payment record
            await db.payments.update_one(
                {"order_id": order_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc),
                        "transaction_id": transaction_id
                    }
                }
            )
            
            # Update user balance
            user = await db.users.find_one({"id": payment["user_id"]}, {"_id": 0})
            if user:
                new_balance = user.get("balance", 0.0) + payment["amount"]
                await db.users.update_one(
                    {"id": payment["user_id"]},
                    {
                        "$set": {
                            "balance": new_balance,
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
                
                # Create balance transaction record
                transaction = BalanceTransaction(
                    id=str(uuid.uuid4()),
                    user_id=payment["user_id"],
                    amount=payment["amount"],
                    transaction_type="payment",
                    description=f"Balans artırma: {payment['amount']} AZN",
                    payment_method="epoint",
                    payment_id=transaction_id,
                    status="completed"
                )
                
                await db.balance_transactions.insert_one(transaction.model_dump())
                
                logger.info(f"Balance updated for user {payment['user_id']}: +{payment['amount']} AZN (new balance: {new_balance} AZN)")
        else:
            # Payment failed
            await db.payments.update_one(
                {"order_id": order_id},
                {
                    "$set": {
                        "status": "failed",
                        "completed_at": datetime.now(timezone.utc)
                    }
                }
            )
            logger.info(f"Payment failed for order: {order_id}")
        
        return {
            "status": "processed",
            "order_id": order_id,
            "payment_status": status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment callback error: {e}")
        raise HTTPException(status_code=500, detail="Ödəniş callback xətası")

@api_router.get("/payments/{payment_id}/status")
async def get_payment_status(
    payment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get payment status"""
    try:
        user = current_user
        
        payment = await db.payments.find_one(
            {"id": payment_id, "user_id": user.id},
            {"_id": 0}
        )
        
        if not payment:
            raise HTTPException(status_code=404, detail="Ödəniş tapılmadı")
        
        return {
            "payment_id": payment["id"],
            "amount": payment["amount"],
            "status": payment["status"],
            "created_at": payment["created_at"],
            "completed_at": payment.get("completed_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get payment status error: {e}")
        raise HTTPException(status_code=500, detail="Ödəniş statusu alınarkən xəta baş verdi")

@api_router.get("/balance/transactions")
async def get_balance_transactions(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's balance transaction history"""
    try:
        user = current_user
        
        transactions = await db.balance_transactions.find(
            {"user_id": user.id},
            {"_id": 0}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
        
        total_count = await db.balance_transactions.count_documents({"user_id": user.id})
        
        return {
            "transactions": transactions,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        raise HTTPException(status_code=500, detail="Tranzaksiya tarixçəsi alınarkən xəta baş verdi")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()