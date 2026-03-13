from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Cookie, Response, File, UploadFile, Body, Request, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import jwt
from passlib.context import CryptContext
import shutil
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Import email service
from email_service import send_welcome_email, send_password_reset_email, send_payment_invoice_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8001')

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

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
    show_envelope_animation: bool = False  # Enable/disable envelope animation per event
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

class GalleryPhoto(BaseModel):
    """Gallery photo model - photos auto-expire after 5 days"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    user_id: str
    url: str  # Cloudinary URL
    cloudinary_public_id: str  # For deletion
    caption: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=5))

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
    # Multi-language title
    title: str  # Default (AZ)
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    slug: str
    # Multi-language excerpt
    excerpt: str  # Default (AZ)
    excerpt_en: Optional[str] = None
    excerpt_ru: Optional[str] = None
    # Multi-language content
    content: str  # Default (AZ)
    content_en: Optional[str] = None
    content_ru: Optional[str] = None
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
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    slug: str
    excerpt: str
    excerpt_en: Optional[str] = None
    excerpt_ru: Optional[str] = None
    content: str
    content_en: Optional[str] = None
    content_ru: Optional[str] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    published: bool = False

class UpdateBlogRequest(BaseModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    excerpt_en: Optional[str] = None
    excerpt_ru: Optional[str] = None
    content: Optional[str] = None
    content_en: Optional[str] = None
    content_ru: Optional[str] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    published: Optional[bool] = None


# Page Model (for static pages like Privacy, Terms, Contact)
class Page(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str  # privacy, terms, contact
    # Multi-language title
    title: str  # Default (AZ)
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    # Multi-language content
    content: str  # Default (AZ)
    content_en: Optional[str] = None
    content_ru: Optional[str] = None
    meta_description: Optional[str] = None
    meta_description_en: Optional[str] = None
    meta_description_ru: Optional[str] = None
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UpdatePageRequest(BaseModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    content: Optional[str] = None
    content_en: Optional[str] = None
    content_ru: Optional[str] = None
    meta_description: Optional[str] = None
    meta_description_en: Optional[str] = None
    meta_description_ru: Optional[str] = None
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


# Hero Slider Model - Multilingual
class MultilingualText(BaseModel):
    az: str = ""
    en: str = ""
    ru: str = ""

class HeroSlide(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: Union[str, Dict[str, str]] = ""  # Can be string or {az, en, ru}
    subtitle: Union[str, Dict[str, str]] = ""  # Can be string or {az, en, ru}
    button_text: Union[str, Dict[str, str]] = "Başla"  # Can be string or {az, en, ru}
    image_url: str = ""
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
    show_envelope_animation: Optional[bool] = False

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
    
    # Send welcome email (non-blocking, don't wait for result)
    try:
        asyncio.create_task(send_welcome_email(request.email, request.name))
        logger.info(f"Welcome email queued for: {request.email}")
    except Exception as e:
        logger.error(f"Failed to queue welcome email: {e}")
    
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

class ForgotPasswordRequest(BaseModel):
    email: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Handle forgot password request.
    Sends a password reset email with a secure token.
    """
    # Check if user exists (but don't reveal this to the client)
    user_doc = await db.users.find_one({"email": request.email})
    
    if user_doc:
        # Generate a password reset token
        reset_token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Store reset token in database
        await db.password_resets.delete_many({"email": request.email})  # Remove old tokens
        await db.password_resets.insert_one({
            "email": request.email,
            "token": reset_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Send password reset email
        try:
            user_name = user_doc.get("name", "İstifadəçi")
            await send_password_reset_email(request.email, user_name, reset_token)
            logger.info(f"Password reset email sent to: {request.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
    
    # Always return success for security
    return {"success": True, "message": "Əgər bu e-poçt mövcuddursa, şifrə bərpa linki göndərildi"}

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password using token from email.
    """
    # Find the reset token
    reset_doc = await db.password_resets.find_one({"token": request.token})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Etibarsız və ya müddəti bitmiş link")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": request.token})
        raise HTTPException(status_code=400, detail="Linkın müddəti bitib. Zəhmət olmasa yenidən cəhd edin.")
    
    # Validate new password
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Şifrə minimum 6 simvol olmalıdır")
    
    # Update user's password
    hashed_password = simple_hash_password(request.new_password)
    result = await db.users.update_one(
        {"email": reset_doc["email"]},
        {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="İstifadəçi tapılmadı")
    
    # Delete used token
    await db.password_resets.delete_one({"token": request.token})
    
    logger.info(f"Password reset successful for: {reset_doc['email']}")
    
    return {"success": True, "message": "Şifrəniz uğurla yeniləndi. İndi daxil ola bilərsiniz."}

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
    """Upload profile picture to Cloudinary"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Yalnız JPG, PNG və WEBP formatları dəstəklənir")
    
    # Validate file size (10MB for Cloudinary free tier)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Şəkil 10MB-dan kiçik olmalıdır")
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="profiles",
            public_id=f"profile_{current_user.id}_{int(datetime.now(timezone.utc).timestamp())}",
            transformation={
                'width': 400,
                'height': 400,
                'crop': 'fill',
                'gravity': 'face',
                'quality': 'auto',
                'fetch_format': 'auto'
            },
            tags=["profile", "user"]
        )
        
        return {
            "file_url": result['secure_url'],
            "public_id": result['public_id'],
            "width": result.get('width'),
            "height": result.get('height')
        }
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Şəkil yüklənərkən xəta: {str(e)}")

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
        custom_design=request.custom_design,
        show_envelope_animation=request.show_envelope_animation or False
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
    
    # Get current user data with balance
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    
    free_invitations_used = user.get("free_invitations_used", 0)
    current_balance = user.get("balance", 0.0)
    
    # Check if user needs to pay (after 30 free invitations)
    invitation_cost = 0.10  # AZN per invitation
    needs_payment = free_invitations_used >= 30
    
    if needs_payment:
        # Check if balance is sufficient
        if current_balance < invitation_cost:
            raise HTTPException(
                status_code=402,
                detail=f"Balansınız kifayət deyil. Qonaq əlavə etmək üçün {invitation_cost} AZN lazımdır. Cari balans: {current_balance} AZN"
            )
        
        # Deduct from balance
        new_balance = current_balance - invitation_cost
        
        # Update user balance
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Create transaction record
        transaction = BalanceTransaction(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=-invitation_cost,  # Negative for deduction
            transaction_type="invitation_charge",
            description=f"Qonaq əlavə edilməsi: {request.name}",
            payment_method=None,
            payment_id=None,
            status="completed"
        )
        
        await db.balance_transactions.insert_one(transaction.model_dump())
        
        logger.info(f"Charged {invitation_cost} AZN from user {current_user.id}. New balance: {new_balance} AZN")
    
    # Increment free invitations counter
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$inc": {"free_invitations_used": 1},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Create guest
    guest = Guest(
        event_id=event_id,
        name=request.name,
        phone=request.phone,
        email=request.email
    )
    await db.guests.insert_one(guest.model_dump())
    
    logger.info(f"Guest added: {guest.name} (Free invitations used: {free_invitations_used + 1}/30, Charged: {needs_payment})")
    
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
    """Upload an image file to Cloudinary and return the URL"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
    
    # Read file contents
    contents = await file.read()
    
    # Validate file size (max 10MB)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl ölçüsü 10MB-dan böyük ola bilməz")
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="images",
            public_id=f"image_{uuid.uuid4()}",
            quality='auto',
            fetch_format='auto',
            tags=["generic", "user"]
        )
        
        return {
            "filename": result['public_id'],
            "file_url": result['secure_url'],
            "url": result['secure_url'],
            "public_id": result['public_id'],
            "width": result.get('width'),
            "height": result.get('height'),
            "message": "Şəkil uğurla yükləndi"
        }
        
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Fayl yüklənərkən xəta baş verdi: {str(e)}")

@api_router.post("/upload/background")
async def upload_background_image(file: UploadFile = File(...)):
    """Upload background image to Cloudinary for admin templates (no auth required for admin users)"""
    
    # Check Cloudinary credentials
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key = os.environ.get('CLOUDINARY_API_KEY')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')
    
    if not all([cloud_name, api_key, api_secret]):
        logger.error("Cloudinary credentials missing!")
        raise HTTPException(
            status_code=500, 
            detail="Cloudinary konfiqurasiyası səhvdir. Zəhmət olmasa environment variables-i yoxlayın."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
    
    # Read file contents
    contents = await file.read()
    
    # Validate file size (max 10MB for backgrounds)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl ölçüsü 10MB-dan böyük ola bilməz")
    
    try:
        logger.info(f"Uploading background image to Cloudinary: {file.filename}, size: {len(contents)} bytes")
        
        # Upload to Cloudinary WITHOUT transformation to preserve aspect ratio
        # For invitation thumbnails (400x600 portrait), we keep original dimensions
        result = cloudinary.uploader.upload(
            contents,
            folder="backgrounds",
            public_id=f"bg_{uuid.uuid4()}",
            quality='auto',
            fetch_format='auto',
            tags=["background", "template"]
        )
        
        logger.info(f"Successfully uploaded to Cloudinary: {result['secure_url']}")
        
        return {
            "filename": result['public_id'],
            "file_url": result['secure_url'],
            "url": result['secure_url'],
            "public_id": result['public_id'],
            "width": result.get('width'),
            "height": result.get('height'),
            "message": "Background şəkil uğurla yükləndi"
        }
        
    except Exception as e:
        logger.error(f"Cloudinary upload error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Şəkil yüklənərkən xəta: {str(e)}. Cloudinary əlaqəsi və credentials-i yoxlayın."
        )

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
async def get_slides(lang: Optional[str] = None):
    """Get all active hero slides (public)"""
    try:
        slides = await db.hero_slides.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(length=None)
        return slides
    except Exception as e:
        logger.error(f"Get slides error: {e}")
        raise HTTPException(status_code=500, detail="Sliderlər yüklənərkən xəta baş verdi")

@api_router.get("/admin/slides")
async def get_all_slides(current_user: User = Depends(get_current_user)):
    """Get all hero slides including inactive (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        slides = await db.hero_slides.find({}, {"_id": 0}).sort("order", 1).to_list(length=None)
        return slides
    except Exception as e:
        logger.error(f"Get all slides error: {e}")
        raise HTTPException(status_code=500, detail="Sliderlər yüklənərkən xəta baş verdi")

class SlideCreate(BaseModel):
    title: Dict[str, str] = {"az": "", "en": "", "ru": ""}
    subtitle: Dict[str, str] = {"az": "", "en": "", "ru": ""}
    button_text: Dict[str, str] = {"az": "Başla", "en": "Start", "ru": "Начать"}
    image_url: str = ""
    button_link: str = "/register"
    order: int = 0
    is_active: bool = True

@api_router.post("/admin/slides")
async def create_slide(
    slide_data: SlideCreate,
    current_user: User = Depends(get_current_user)
):
    """Create hero slide (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        new_slide = {
            "id": str(uuid.uuid4()),
            "title": slide_data.title,
            "subtitle": slide_data.subtitle,
            "button_text": slide_data.button_text,
            "image_url": slide_data.image_url,
            "button_link": slide_data.button_link,
            "order": slide_data.order,
            "is_active": slide_data.is_active,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.hero_slides.insert_one(new_slide)
        if "_id" in new_slide:
            del new_slide["_id"]
        return new_slide
    except Exception as e:
        logger.error(f"Create slide error: {e}")
        raise HTTPException(status_code=500, detail="Slider yaradılarkən xəta baş verdi")

class SlideUpdate(BaseModel):
    title: Optional[Dict[str, str]] = None
    subtitle: Optional[Dict[str, str]] = None
    button_text: Optional[Dict[str, str]] = None
    image_url: Optional[str] = None
    button_link: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

@api_router.put("/admin/slides/{slide_id}")
async def update_slide(
    slide_id: str,
    slide_data: SlideUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update hero slide (Admin only)"""
    if current_user.email != "admin@vivento.az" and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin hüquqları tələb olunur")
    
    try:
        update_data = {}
        if slide_data.title is not None:
            update_data["title"] = slide_data.title
        if slide_data.subtitle is not None:
            update_data["subtitle"] = slide_data.subtitle
        if slide_data.button_text is not None:
            update_data["button_text"] = slide_data.button_text
        if slide_data.image_url is not None:
            update_data["image_url"] = slide_data.image_url
        if slide_data.button_link is not None:
            update_data["button_link"] = slide_data.button_link
        if slide_data.order is not None:
            update_data["order"] = slide_data.order
        if slide_data.is_active is not None:
            update_data["is_active"] = slide_data.is_active
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Heç bir məlumat dəyişdirilmədi")
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.hero_slides.update_one(
            {"id": slide_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Slider tapılmadı")
        
        updated_slide = await db.hero_slides.find_one({"id": slide_id}, {"_id": 0})
        return updated_slide
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
# PAGES MANAGEMENT (Privacy, Terms, Contact)
# ============================================

@api_router.get("/pages/{slug}")
async def get_page_by_slug(slug: str, lang: str = "az"):
    """Get a page by slug (public endpoint) with language support"""
    try:
        page = await db.pages.find_one({"slug": slug, "published": True}, {"_id": 0})
        
        if not page:
            raise HTTPException(status_code=404, detail="Səhifə tapılmadı")
        
        # Return localized content based on language
        if lang == "en" and page.get("title_en"):
            page["title"] = page.get("title_en") or page["title"]
            page["content"] = page.get("content_en") or page["content"]
            page["meta_description"] = page.get("meta_description_en") or page.get("meta_description")
        elif lang == "ru" and page.get("title_ru"):
            page["title"] = page.get("title_ru") or page["title"]
            page["content"] = page.get("content_ru") or page["content"]
            page["meta_description"] = page.get("meta_description_ru") or page.get("meta_description")
        
        return page
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get page error: {e}")
        raise HTTPException(status_code=500, detail="Səhifə yüklənərkən xəta baş verdi")

@api_router.get("/admin/pages")
async def get_all_pages_admin(current_user: User = Depends(get_current_user)):
    """Get all pages for admin (including unpublished)"""
    try:
        # Check if user is admin (you can add is_admin field to User model)
        # For now, any authenticated user can access
        
        pages = await db.pages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        return pages
    except Exception as e:
        logger.error(f"Get pages admin error: {e}")
        raise HTTPException(status_code=500, detail="Səhifələr yüklənərkən xəta baş verdi")

@api_router.put("/admin/pages/{slug}")
async def update_page_admin(
    slug: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Update a page (admin only)"""
    try:
        # Parse request body
        body = await request.json()
        
        # Check if page exists
        page = await db.pages.find_one({"slug": slug})
        
        if not page:
            raise HTTPException(status_code=404, detail="Səhifə tapılmadı")
        
        # Prepare update data
        update_data = {}
        
        # Basic fields
        if "title" in body:
            update_data["title"] = body["title"]
        if "content" in body:
            update_data["content"] = body["content"]
        if "meta_description" in body:
            update_data["meta_description"] = body["meta_description"]
        if "published" in body:
            update_data["published"] = body["published"]
        
        # Multi-language fields
        if "title_en" in body:
            update_data["title_en"] = body["title_en"]
        if "title_ru" in body:
            update_data["title_ru"] = body["title_ru"]
        if "content_en" in body:
            update_data["content_en"] = body["content_en"]
        if "content_ru" in body:
            update_data["content_ru"] = body["content_ru"]
        if "meta_description_en" in body:
            update_data["meta_description_en"] = body["meta_description_en"]
        if "meta_description_ru" in body:
            update_data["meta_description_ru"] = body["meta_description_ru"]
        
        # Always update timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update page
        await db.pages.update_one(
            {"slug": slug},
            {"$set": update_data}
        )
        
        # Get updated page
        updated_page = await db.pages.find_one({"slug": slug}, {"_id": 0})
        
        logger.info(f"Page updated: {slug} by user {current_user.id}")
        
        return updated_page
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update page error: {e}")
        raise HTTPException(status_code=500, detail="Səhifə yenilənərkən xəta baş verdi")

# ============================================
# STATIC PAGES SETUP ENDPOINT (One-time DB Seeding)
# ============================================

@api_router.post("/admin/setup-pages")
async def setup_static_pages():
    """
    One-time endpoint to create default static pages in the database.
    This is used to seed the production database with initial page content.
    Can be called without authentication for initial setup.
    """
    try:
        default_pages = [
            {
                "id": str(uuid.uuid4()),
                "slug": "privacy",
                "title": "Məxfilik Siyasəti",
                "content": """<h2>Məxfilik Siyasəti</h2>
<p>Vivento platformasına xoş gəlmisiniz. Məxfiliyiniz bizim üçün vacibdir.</p>

<h3>1. Toplanılan Məlumatlar</h3>
<p>Xidmətlərimizdən istifadə etdiyiniz zaman aşağıdakı məlumatları toplaya bilərik:</p>
<ul>
  <li>Ad və soyad</li>
  <li>E-poçt ünvanı</li>
  <li>Telefon nömrəsi</li>
  <li>Profil şəkli</li>
  <li>Tədbir məlumatları (ad, tarix, məkan)</li>
</ul>

<h3>2. Məlumatların İstifadəsi</h3>
<p>Topladığımız məlumatları aşağıdakı məqsədlərlə istifadə edirik:</p>
<ul>
  <li>Xidmətlərimizi təmin etmək və təkmilləşdirmək</li>
  <li>Sizinlə əlaqə saxlamaq</li>
  <li>Dəvətnamələrinizi yaratmaq və göndərmək</li>
  <li>Texniki dəstək göstərmək</li>
</ul>

<h3>3. Məlumatların Qorunması</h3>
<p>Şəxsi məlumatlarınızın təhlükəsizliyini təmin etmək üçün müasir şifrələmə texnologiyalarından istifadə edirik.</p>

<h3>4. Əlaqə</h3>
<p>Suallarınız üçün bizimlə əlaqə saxlaya bilərsiniz: <a href="mailto:info@vivento.az">info@vivento.az</a></p>""",
                "meta_description": "Vivento platformasının məxfilik siyasəti",
                "published": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "terms",
                "title": "İstifadə Şərtləri",
                "content": """<h2>İstifadə Şərtləri</h2>
<p>Bu şərtlər Vivento platformasından istifadə qaydalarını müəyyən edir.</p>

<h3>1. Xidmətlərin Təsviri</h3>
<p>Vivento rəqəmsal dəvətnamə yaratma və göndərmə platformasıdır. İstifadəçilər toy, nişan, doğum günü və digər tədbirlər üçün dəvətnamələr yarada bilərlər.</p>

<h3>2. Hesab Yaratma</h3>
<p>Xidmətlərimizdən tam istifadə etmək üçün hesab yaratmalısınız. Hesab yaratarkən:</p>
<ul>
  <li>Doğru məlumatlar təqdim etməyə</li>
  <li>Hesabınızın təhlükəsizliyini qorumağa</li>
  <li>Parolunuzu başqaları ilə paylaşmamağa</li>
</ul>
<p>borclusunuz.</p>

<h3>3. Ödəniş Şərtləri</h3>
<p>Bəzi xidmətlərimiz ödənişlidir. Ödənişlər Azərbaycan manatı (AZN) ilə həyata keçirilir.</p>
<ul>
  <li>İlk 30 dəvətnamə pulsuzdur</li>
  <li>Premium şablonlar əlavə ödəniş tələb edir</li>
  <li>Balans artırma minimum 5 AZN-dən başlayır</li>
</ul>

<h3>4. Qadağan Edilmiş Fəaliyyətlər</h3>
<p>Aşağıdakı fəaliyyətlər qadağandır:</p>
<ul>
  <li>Qanunsuz məzmun paylaşmaq</li>
  <li>Başqalarının hüquqlarını pozmaq</li>
  <li>Platformadan sui-istifadə etmək</li>
  <li>Spam və ya zərərli məzmun yaymaq</li>
</ul>

<h3>5. Məsuliyyətin Məhdudlaşdırılması</h3>
<p>Vivento xidmətlərin fasiləsiz işləyəcəyinə zəmanət vermir. Texniki problemlər və ya xarici amillər səbəbindən yaranan zərərlərə görə məsuliyyət daşımırıq.</p>

<h3>6. Şərtlərin Dəyişdirilməsi</h3>
<p>Bu şərtləri istənilən vaxt dəyişdirmək hüququmuzu saxlayırıq. Dəyişikliklər saytda dərc edildikdən sonra qüvvəyə minir.</p>

<h3>7. Əlaqə</h3>
<p>Suallarınız üçün: <a href="mailto:info@vivento.az">info@vivento.az</a></p>""",
                "meta_description": "Vivento platformasının istifadə şərtləri",
                "published": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "contact",
                "title": "Əlaqə",
                "content": """<h2>Bizimlə Əlaqə</h2>
<p>Vivento komandası ilə əlaqə saxlamaq üçün aşağıdakı üsullardan istifadə edə bilərsiniz.</p>

<h3>E-poçt</h3>
<p>Ümumi sorğular üçün: <a href="mailto:info@vivento.az">info@vivento.az</a></p>
<p>Texniki dəstək üçün: <a href="mailto:support@vivento.az">support@vivento.az</a></p>

<h3>Sosial Şəbəkələr</h3>
<ul>
  <li>Instagram: <a href="https://instagram.com/vivento.az" target="_blank">@vivento.az</a></li>
  <li>Facebook: <a href="https://facebook.com/viventoaz" target="_blank">Vivento Azerbaijan</a></li>
</ul>

<h3>İş Saatları</h3>
<p>Bazar ertəsi - Cümə: 09:00 - 18:00</p>
<p>Şənbə: 10:00 - 14:00</p>
<p>Bazar: Bağlı</p>

<h3>Ünvan</h3>
<p>Bakı, Azərbaycan</p>

<p><strong>Sizə kömək etməkdən məmnun olarıq!</strong></p>""",
                "meta_description": "Vivento ilə əlaqə məlumatları",
                "published": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]
        
        created_pages = []
        updated_pages = []
        
        for page_data in default_pages:
            # Check if page already exists
            existing = await db.pages.find_one({"slug": page_data["slug"]})
            
            if existing:
                # Update existing page if content is empty or minimal
                if not existing.get("content") or len(existing.get("content", "")) < 100:
                    await db.pages.update_one(
                        {"slug": page_data["slug"]},
                        {"$set": {
                            "title": page_data["title"],
                            "content": page_data["content"],
                            "meta_description": page_data["meta_description"],
                            "published": True,
                            "updated_at": datetime.now(timezone.utc)
                        }}
                    )
                    updated_pages.append(page_data["slug"])
                else:
                    # Page exists with content, skip
                    pass
            else:
                # Create new page
                await db.pages.insert_one(page_data)
                created_pages.append(page_data["slug"])
        
        logger.info(f"Setup pages completed. Created: {created_pages}, Updated: {updated_pages}")
        
        return {
            "success": True,
            "message": "Statik səhifələr uğurla yaradıldı/yeniləndi",
            "created": created_pages,
            "updated": updated_pages,
            "total_pages": len(default_pages)
        }
        
    except Exception as e:
        logger.error(f"Setup pages error: {e}")
        raise HTTPException(status_code=500, detail=f"Səhifələr yaradılarkən xəta: {str(e)}")


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

@api_router.post("/payments/confirm-success")
async def confirm_payment_success(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Confirm successful payment and add balance.
    IMPORTANT: This should only be called after Epoint callback confirms payment.
    For security, we check if payment was already marked as 'callback_received'.
    """
    try:
        body = await request.json()
        payment_id = body.get("payment_id")
        order_id = body.get("order_id")
        
        logger.info(f"Confirming payment - payment_id: {payment_id}, order_id: {order_id}, user: {current_user.id}")
        
        # Find the payment by payment_id or order_id
        payment = None
        if payment_id:
            payment = await db.payments.find_one({
                "id": payment_id,
                "user_id": current_user.id
            }, {"_id": 0})
        
        if not payment and order_id:
            payment = await db.payments.find_one({
                "order_id": order_id,
                "user_id": current_user.id
            }, {"_id": 0})
        
        if not payment:
            logger.warning(f"Payment not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Ödəniş tapılmadı")
        
        # Check if already completed
        if payment.get("status") == "completed":
            logger.info(f"Payment already completed: {payment.get('id')}")
            user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
            return {
                "success": True,
                "message": "Ödəniş artıq tamamlanıb",
                "amount": payment["amount"],
                "new_balance": user.get("balance", 0)
            }
        
        # SECURITY: Only confirm if payment status is 'callback_received'
        # This means Epoint callback already confirmed this payment
        if payment.get("status") != "callback_received":
            logger.warning(f"Payment {payment.get('id')} not yet confirmed by Epoint callback. Status: {payment.get('status')}")
            raise HTTPException(
                status_code=400, 
                detail="Ödəniş hələ Epoint tərəfindən təsdiqlənməyib. Zəhmət olmasa bir neçə saniyə gözləyin."
            )
        
        # Mark payment as completed
        await db.payments.update_one(
            {"id": payment["id"]},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Update user balance
        user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
        current_balance = user.get("balance", 0.0)
        new_balance = current_balance + payment["amount"]
        
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Create balance transaction record
        transaction = BalanceTransaction(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=payment["amount"],
            transaction_type="payment",
            description=f"Balans artırma: {payment['amount']} AZN",
            payment_method="epoint",
            payment_id=payment["id"],
            status="completed"
        )
        await db.balance_transactions.insert_one(transaction.model_dump())
        
        logger.info(f"Payment confirmed! User {current_user.id} balance updated: {current_balance} -> {new_balance} AZN")
        
        return {
            "success": True,
            "message": "Ödəniş uğurla tamamlandı",
            "amount": payment["amount"],
            "new_balance": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Confirm payment error: {e}")
        raise HTTPException(status_code=500, detail="Ödəniş təsdiqlənərkən xəta baş verdi")

@api_router.get("/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    """Get user's current balance - NO auto-confirm pending payments"""
    try:
        # Get user data
        user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
        
        # Expire old pending payments (older than 30 minutes)
        thirty_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=30)
        await db.payments.update_many(
            {
                "user_id": current_user.id,
                "status": "pending",
                "created_at": {"$lt": thirty_minutes_ago.isoformat()}
            },
            {
                "$set": {
                    "status": "expired",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "balance": user.get("balance", 0),
            "free_invitations_used": user.get("free_invitations_used", 0),
            "free_invitations_remaining": max(0, 30 - user.get("free_invitations_used", 0))
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
async def payment_callback(request: Request):
    """
    Handle payment callback from Epoint.az
    Accepts both JSON and form-urlencoded data
    Verify signature and update balance
    """
    try:
        # Get content type
        content_type = request.headers.get("content-type", "")
        logger.info(f"Payment callback received. Content-Type: {content_type}")
        
        # Parse request data based on content type
        if "application/x-www-form-urlencoded" in content_type:
            # Form data from Epoint
            form_data = await request.form()
            data = form_data.get("data", "")
            signature = form_data.get("signature", "")
            logger.info(f"Received form data - data length: {len(data)}, signature: {signature[:20] if signature else 'None'}...")
        elif "application/json" in content_type:
            # JSON data
            json_data = await request.json()
            data = json_data.get("data", "")
            signature = json_data.get("signature", "")
            logger.info(f"Received JSON data - data length: {len(data)}, signature: {signature[:20] if signature else 'None'}...")
        else:
            # Try to parse as form data first, then JSON
            try:
                form_data = await request.form()
                data = form_data.get("data", "")
                signature = form_data.get("signature", "")
                logger.info(f"Parsed as form data - data length: {len(data)}")
            except:
                try:
                    json_data = await request.json()
                    data = json_data.get("data", "")
                    signature = json_data.get("signature", "")
                    logger.info(f"Parsed as JSON - data length: {len(data)}")
                except:
                    logger.error("Failed to parse callback request")
                    raise HTTPException(status_code=400, detail="Invalid request format")
        
        if not data or not signature:
            logger.error(f"Missing data or signature. Data: {bool(data)}, Signature: {bool(signature)}")
            raise HTTPException(status_code=400, detail="Missing data or signature")
        
        # Verify signature
        if not epoint_service.verify_callback_signature(data, signature):
            logger.warning("Invalid payment callback signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Decode callback data
        callback_data = epoint_service.decode_callback_data(data)
        
        logger.info(f"Payment callback decoded successfully: {callback_data}")
        
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
                
                # Send payment invoice email (non-blocking)
                try:
                    user_email = user.get("email")
                    user_name = user.get("name", "İstifadəçi")
                    if user_email:
                        asyncio.create_task(send_payment_invoice_email(
                            user_email, 
                            user_name, 
                            payment["amount"], 
                            new_balance, 
                            transaction_id or order_id
                        ))
                        logger.info(f"Payment invoice email queued for: {user_email}")
                except Exception as e:
                    logger.error(f"Failed to queue payment invoice email: {e}")
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

@api_router.post("/payments/{payment_id}/verify")
async def verify_payment_with_epoint(
    payment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Verify payment status directly with Epoint API and update balance if successful.
    This is a fallback when Epoint callback doesn't reach our server.
    """
    try:
        # Find payment
        payment = await db.payments.find_one(
            {"id": payment_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not payment:
            raise HTTPException(status_code=404, detail="Ödəniş tapılmadı")
        
        # If already completed, return success
        if payment.get("status") == "completed":
            user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
            return {
                "success": True,
                "status": "completed",
                "message": "Ödəniş artıq tamamlanıb",
                "amount": payment["amount"],
                "balance": user.get("balance", 0)
            }
        
        # If expired or failed, return error
        if payment.get("status") in ["expired", "failed"]:
            return {
                "success": False,
                "status": payment["status"],
                "message": "Ödəniş uğursuz olub və ya müddəti bitib"
            }
        
        # Check status with Epoint API
        order_id = payment.get("order_id")
        if not order_id:
            raise HTTPException(status_code=400, detail="Order ID tapılmadı")
        
        # Create status check request
        status_request = epoint_service.get_payment_status_request(order_id)
        
        # Call Epoint API to check status
        async with httpx.AsyncClient() as client:
            response = await client.post(
                status_request["url"],
                data={
                    "data": status_request["data"],
                    "signature": status_request["signature"]
                },
                timeout=30.0
            )
        
        logger.info(f"Epoint status check response: {response.status_code} - {response.text}")
        
        if response.status_code != 200:
            logger.error(f"Epoint status check failed: {response.text}")
            return {
                "success": False,
                "status": "pending",
                "message": "Epoint ilə əlaqə qurula bilmədi. Zəhmət olmasa bir az gözləyin."
            }
        
        # Parse response
        try:
            epoint_response = response.json()
        except:
            # Try to decode base64 response
            try:
                import base64
                decoded = base64.b64decode(response.text).decode('utf-8')
                epoint_response = json.loads(decoded)
            except:
                logger.error(f"Failed to parse Epoint response: {response.text}")
                return {
                    "success": False,
                    "status": "pending", 
                    "message": "Epoint cavabı oxuna bilmədi"
                }
        
        logger.info(f"Epoint status response parsed: {epoint_response}")
        
        # Check if payment was successful
        epoint_status = epoint_response.get("status", "").lower()
        transaction_id = epoint_response.get("transaction") or epoint_response.get("transaction_id")
        
        if epoint_status == "success" or epoint_response.get("code") == "00":
            # Payment successful - update balance
            
            # Mark payment as completed
            await db.payments.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "transaction_id": transaction_id,
                        "verified_via": "manual_check"
                    }
                }
            )
            
            # Update user balance
            user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
            current_balance = user.get("balance", 0.0)
            new_balance = current_balance + payment["amount"]
            
            await db.users.update_one(
                {"id": current_user.id},
                {
                    "$set": {
                        "balance": new_balance,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Create balance transaction record
            transaction = BalanceTransaction(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                amount=payment["amount"],
                transaction_type="payment",
                description=f"Balans artırma: {payment['amount']} AZN",
                payment_method="epoint",
                payment_id=transaction_id or payment_id,
                status="completed"
            )
            await db.balance_transactions.insert_one(transaction.model_dump())
            
            logger.info(f"Payment verified and balance updated for user {current_user.id}: +{payment['amount']} AZN (new balance: {new_balance} AZN)")
            
            # Send invoice email
            try:
                user_email = user.get("email")
                user_name = user.get("name", "İstifadəçi")
                if user_email:
                    asyncio.create_task(send_payment_invoice_email(
                        user_email,
                        user_name,
                        payment["amount"],
                        new_balance,
                        transaction_id or payment_id
                    ))
            except Exception as e:
                logger.error(f"Failed to send invoice email: {e}")
            
            return {
                "success": True,
                "status": "completed",
                "message": "Ödəniş uğurla təsdiqləndi!",
                "amount": payment["amount"],
                "balance": new_balance
            }
        
        elif epoint_status in ["failed", "error", "declined"]:
            # Payment failed
            await db.payments.update_one(
                {"id": payment_id},
                {"$set": {"status": "failed", "completed_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {
                "success": False,
                "status": "failed",
                "message": "Ödəniş uğursuz oldu"
            }
        
        else:
            # Still pending or unknown status
            return {
                "success": False,
                "status": "pending",
                "message": "Ödəniş hələ emal olunur. Zəhmət olmasa bir az gözləyin.",
                "epoint_status": epoint_status
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify payment error: {e}")
        raise HTTPException(status_code=500, detail="Ödəniş yoxlanılarkən xəta baş verdi")

@api_router.get("/balance/transactions")
async def get_balance_transactions(
    current_user: User = Depends(get_current_user),
    limit: int = 50
):
    """Get user's balance transaction history"""
    try:
        transactions = await db.balance_transactions.find(
            {"user_id": current_user.id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(limit)
        
        return transactions
    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        raise HTTPException(status_code=500, detail="Tranzaksiya tarixçəsi alınarkən xəta")

@api_router.post("/admin/expire-pending-payments")
async def admin_expire_pending_payments(current_user: User = Depends(get_current_user)):
    """
    Admin endpoint to expire ALL pending payments for the current user.
    This does NOT add balance - only marks stuck payments as expired.
    Balans artirmaq ucun YALNIZ Epoint callback istifade edilmelidir.
    """
    try:
        # Find all pending payments
        pending_payments = await db.payments.find({
            "user_id": current_user.id,
            "status": "pending"
        }, {"_id": 0}).to_list(100)
        
        if not pending_payments:
            return {
                "success": True,
                "message": "Gözləyən ödəniş yoxdur",
                "expired": 0
            }
        
        expired_count = 0
        
        for payment in pending_payments:
            # Mark as EXPIRED - NOT completed
            await db.payments.update_one(
                {"id": payment["id"]},
                {"$set": {
                    "status": "expired",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            expired_count += 1
            logger.info(f"Expired pending payment {payment['id']} for {payment['amount']} AZN")
        
        return {
            "success": True,
            "message": f"{expired_count} gözləyən ödəniş müddəti bitmiş kimi işarələndi",
            "expired": expired_count
        }
        
    except Exception as e:
        logger.error(f"Expire payments error: {e}")
        raise HTTPException(status_code=500, detail="Ödənişlər işarələnərkən xəta")

# ================== GALLERY ENDPOINTS ==================

@api_router.get("/events/{event_id}/gallery")
async def get_event_gallery(event_id: str):
    """
    Get gallery photos for an event (public endpoint for invitation page)
    Only returns non-expired photos
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Find non-expired photos
        photos = await db.gallery_photos.find({
            "event_id": event_id,
            "expires_at": {"$gt": now.isoformat()}
        }, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        return {
            "event_id": event_id,
            "photos": photos,
            "count": len(photos)
        }
        
    except Exception as e:
        logger.error(f"Get gallery error: {e}")
        raise HTTPException(status_code=500, detail="Qalereya yüklənərkən xəta")

@api_router.post("/events/{event_id}/gallery")
async def upload_gallery_photo(
    event_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a photo to event gallery
    Photos expire after 5 days automatically
    """
    try:
        # Verify event belongs to user
        event = await db.events.find_one({
            "id": event_id,
            "user_id": current_user.id
        }, {"_id": 0})
        
        if not event:
            raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
        
        # Check file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
        
        # Check file size (max 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Fayl ölçüsü 10MB-dan çox olmamalıdır")
        
        # Upload to Cloudinary with auto-delete tag
        result = cloudinary.uploader.upload(
            contents,
            folder=f"vivento/gallery/{event_id}",
            resource_type="image",
            tags=["gallery", f"event_{event_id}", "auto_delete_5d"]
        )
        
        # Create gallery photo record
        expires_at = datetime.now(timezone.utc) + timedelta(days=5)
        
        photo = GalleryPhoto(
            event_id=event_id,
            user_id=current_user.id,
            url=result["secure_url"],
            cloudinary_public_id=result["public_id"],
            caption=caption,
            expires_at=expires_at
        )
        
        await db.gallery_photos.insert_one(photo.model_dump())
        
        logger.info(f"Gallery photo uploaded: {photo.id} for event {event_id}, expires: {expires_at}")
        
        return {
            "success": True,
            "photo": {
                "id": photo.id,
                "url": photo.url,
                "caption": photo.caption,
                "created_at": photo.created_at.isoformat(),
                "expires_at": photo.expires_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload gallery photo error: {e}")
        raise HTTPException(status_code=500, detail="Foto yüklənərkən xəta")

@api_router.delete("/events/{event_id}/gallery/{photo_id}")
async def delete_gallery_photo(
    event_id: str,
    photo_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a gallery photo"""
    try:
        # Find photo
        photo = await db.gallery_photos.find_one({
            "id": photo_id,
            "event_id": event_id,
            "user_id": current_user.id
        }, {"_id": 0})
        
        if not photo:
            raise HTTPException(status_code=404, detail="Foto tapılmadı")
        
        # Delete from Cloudinary
        try:
            cloudinary.uploader.destroy(photo["cloudinary_public_id"])
        except Exception as e:
            logger.warning(f"Could not delete from Cloudinary: {e}")
        
        # Delete from database
        await db.gallery_photos.delete_one({"id": photo_id})
        
        logger.info(f"Gallery photo deleted: {photo_id}")
        
        return {"success": True, "message": "Foto silindi"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete gallery photo error: {e}")
        raise HTTPException(status_code=500, detail="Foto silinərkən xəta")

@api_router.post("/cleanup/expired-gallery")
async def cleanup_expired_gallery_photos():
    """
    Cleanup expired gallery photos (called by cron job or manually)
    Deletes photos older than 5 days from both Cloudinary and database
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Find expired photos
        expired_photos = await db.gallery_photos.find({
            "expires_at": {"$lt": now.isoformat()}
        }, {"_id": 0}).to_list(1000)
        
        deleted_count = 0
        failed_count = 0
        
        for photo in expired_photos:
            try:
                # Delete from Cloudinary
                cloudinary.uploader.destroy(photo["cloudinary_public_id"])
                
                # Delete from database
                await db.gallery_photos.delete_one({"id": photo["id"]})
                
                deleted_count += 1
                logger.info(f"Expired gallery photo deleted: {photo['id']}")
                
            except Exception as e:
                logger.error(f"Failed to delete expired photo {photo['id']}: {e}")
                failed_count += 1
        
        return {
            "success": True,
            "message": f"{deleted_count} müddəti bitmiş foto silindi",
            "deleted": deleted_count,
            "failed": failed_count
        }
        
    except Exception as e:
        logger.error(f"Cleanup expired gallery error: {e}")
        raise HTTPException(status_code=500, detail="Təmizləmə zamanı xəta")

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