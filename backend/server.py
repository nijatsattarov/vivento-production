from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Cookie, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    category: str  # toy, nişan, doğum_günü, korporativ
    thumbnail_url: str
    design_data: Dict[str, Any]
    is_premium: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Guest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    unique_token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rsvp_status: Optional[str] = None  # gəlirəm, gəlmirəm
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    responded_at: Optional[datetime] = None

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

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Giriş tələb olunur"
        )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
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

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Template routes
@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    templates = await db.templates.find().to_list(100)
    return [Template(**template) for template in templates]

@api_router.get("/templates/{category}")
async def get_templates_by_category(category: str):
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

@api_router.get("/events/{event_id}/guests", response_model=List[Guest])
async def get_event_guests(event_id: str, current_user: User = Depends(get_current_user)):
    # Verify event ownership
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id})
    if not event:
        raise HTTPException(status_code=404, detail="Tədbir tapılmadı")
    
    guests = await db.guests.find({"event_id": event_id}).to_list(1000)
    return [Guest(**guest) for guest in guests]

# RSVP routes (public)
@api_router.get("/invite/{token}")
async def get_invitation(token: str):
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
    
    await db.guests.update_one(
        {"unique_token": token},
        {
            "$set": {
                "rsvp_status": response.status,
                "responded_at": datetime.now(timezone.utc)
            }
        }
    )
    
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