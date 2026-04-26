from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'retailiq_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Currency Config - Indian Rupees
CURRENCY = "INR"
CURRENCY_SYMBOL = "₹"

# Create the main app
app = FastAPI(title="RetailIQ API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None
    role: str = "customer"
    created_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    cost_price: float
    stock_quantity: int
    reorder_level: int = 10
    unit: str = "piece"
    image_url: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    created_at: datetime

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total: float

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: List[OrderItemResponse]
    total_amount: float
    status: str
    payment_status: str = "pending"
    payment_session_id: Optional[str] = None
    created_at: datetime

class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, shipped, delivered, cancelled

class SupplierBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    model_config = ConfigDict(extra="ignore")
    supplier_id: str
    created_at: datetime

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int

class CartItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_item_id: str
    product_id: str
    product_name: str
    price: float
    quantity: int
    image_url: Optional[str] = None

class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    wishlist_id: str
    product_id: str
    product_name: str
    price: float
    image_url: Optional[str] = None
    category: str
    stock_quantity: int

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class DashboardStats(BaseModel):
    total_revenue: float
    today_orders: int
    total_products: int
    low_stock_count: int

class SalesTrend(BaseModel):
    date: str
    revenue: float
    orders: int

class CustomerStats(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str]
    order_count: int
    total_spent: float

class CheckoutRequest(BaseModel):
    order_id: Optional[str] = None
    items: Optional[List[OrderItemCreate]] = None
    origin_url: str

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    order_id: str

class BuyNowRequest(BaseModel):
    product_id: str
    quantity: int = 1
    origin_url: str

# ===================== MERCHANT ONBOARDING MODELS =====================

class SendOTPRequest(BaseModel):
    phone_number: str  # E.164 format: +91XXXXXXXXXX

class VerifyOTPRequest(BaseModel):
    phone_number: str
    code: str

class MerchantBusinessInfo(BaseModel):
    shop_name: str
    business_category: str
    store_address: str
    city: str
    state: str
    pincode: str

class MerchantKYCInfo(BaseModel):
    gstin: Optional[str] = None  # Optional for small retailers
    pan_number: str
    bank_account_number: str
    bank_ifsc: str
    bank_name: str
    account_holder_name: str

class MerchantOnboardingRequest(BaseModel):
    phone_number: str
    email: EmailStr
    password: str
    name: str
    business_info: MerchantBusinessInfo
    kyc_info: MerchantKYCInfo
    subscription_plan: str = "starter"  # starter, pro, enterprise

class MerchantResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    merchant_id: str
    user_id: str
    email: str
    name: str
    phone: str
    shop_name: str
    business_category: str
    store_address: str
    subscription_plan: str
    kyc_status: str  # pending, verified, rejected
    onboarding_status: str  # phone_verified, business_info, kyc_submitted, active
    created_at: datetime

class SubscriptionPlan(BaseModel):
    plan_id: str
    name: str
    price: float
    currency: str = "INR"
    features: List[str]
    product_limit: Optional[int] = None
    is_popular: bool = False

# ===================== REFERRAL PROGRAM MODELS =====================

class ReferralCreate(BaseModel):
    referrer_code: Optional[str] = None  # Code used during signup

class ReferralResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    referral_id: str
    user_id: str
    referral_code: str
    total_referrals: int = 0
    successful_referrals: int = 0
    credits_earned: float = 0.0
    created_at: datetime

class ReferralHistoryItem(BaseModel):
    referred_user_id: str
    referred_user_name: str
    referred_user_email: str
    status: str  # pending, completed
    credits_earned: float
    created_at: datetime

class ReferralStatsResponse(BaseModel):
    referral_code: str
    total_referrals: int
    successful_referrals: int
    pending_referrals: int
    total_credits_earned: float
    available_credits: float
    referral_link: str

class RedeemCreditsRequest(BaseModel):
    amount: float

# Referral reward settings
REFERRAL_REWARD_REFERRER = 100.0  # ₹100 for referrer when referee completes first order
REFERRAL_REWARD_REFEREE = 50.0   # ₹50 discount for new user on first order

# ===================== EMAIL SERVICE =====================

async def send_order_email(to_email: str, order: dict, email_type: str = "confirmation"):
    """Send order-related emails via SendGrid"""
    sendgrid_key = os.environ.get("SENDGRID_API_KEY")
    from_email = os.environ.get("SENDGRID_FROM_EMAIL", "noreply@retailiq.com")
    
    if not sendgrid_key or sendgrid_key == "YOUR_SENDGRID_API_KEY":
        logger.warning("SendGrid not configured - email not sent")
        return False
    
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        # Generate email content based on type
        if email_type == "confirmation":
            subject = f"Order Confirmed - #{order['order_id'][:12]}"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7c3aed; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">RetailIQ</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2>Order Confirmed!</h2>
                    <p>Thank you for your order. Here are your order details:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Order ID:</strong> {order['order_id']}</p>
                        <p><strong>Total Amount:</strong> {CURRENCY_SYMBOL}{order['total_amount']:,.2f}</p>
                        <p><strong>Status:</strong> {order['status'].title()}</p>
                    </div>
                    <h3>Items Ordered:</h3>
                    <ul>
                        {"".join([f"<li>{item['product_name']} x{item['quantity']} - {CURRENCY_SYMBOL}{item['total']:,.2f}</li>" for item in order['items']])}
                    </ul>
                </div>
                <div style="background: #1a1a1a; color: #888; padding: 20px; text-align: center;">
                    <p>© 2024 RetailIQ. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
        elif email_type == "status_update":
            status_messages = {
                "confirmed": "Your order has been confirmed and is being processed.",
                "shipped": "Great news! Your order has been shipped and is on its way.",
                "delivered": "Your order has been delivered. Thank you for shopping with us!",
                "cancelled": "Your order has been cancelled."
            }
            subject = f"Order Update - #{order['order_id'][:12]} - {order['status'].title()}"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7c3aed; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">RetailIQ</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2>Order Status Update</h2>
                    <p>{status_messages.get(order['status'], 'Your order status has been updated.')}</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Order ID:</strong> {order['order_id']}</p>
                        <p><strong>New Status:</strong> <span style="color: #7c3aed; font-weight: bold;">{order['status'].title()}</span></p>
                        <p><strong>Total Amount:</strong> {CURRENCY_SYMBOL}{order['total_amount']:,.2f}</p>
                    </div>
                </div>
                <div style="background: #1a1a1a; color: #888; padding: 20px; text-align: center;">
                    <p>© 2024 RetailIQ. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
        else:
            return False
        
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        sg = SendGridAPIClient(sendgrid_key)
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> UserResponse:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Then try Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token
    try:
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        role_doc = await db.user_roles.find_one({"user_id": user_id}, {"_id": 0})
        user_doc["role"] = role_doc["role"] if role_doc else "customer"
        return UserResponse(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        pass
    
    # Check session token in DB (for Google OAuth)
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    role_doc = await db.user_roles.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    user_doc["role"] = role_doc["role"] if role_doc else "customer"
    return UserResponse(**user_doc)

def require_admin(user: UserResponse = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(data: UserCreate):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "phone": data.phone,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Set role as customer by default
    await db.user_roles.insert_one({"user_id": user_id, "role": "customer"})
    
    token = create_jwt_token(user_id)
    user_response = UserResponse(
        user_id=user_id,
        email=data.email,
        name=data.name,
        phone=data.phone,
        role="customer"
    )
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user_doc = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login")
    
    if not verify_password(data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    role_doc = await db.user_roles.find_one({"user_id": user_doc["user_id"]}, {"_id": 0})
    role = role_doc["role"] if role_doc else "customer"
    
    token = create_jwt_token(user_doc["user_id"])
    user_response = UserResponse(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        phone=user_doc.get("phone"),
        address=user_doc.get("address"),
        picture=user_doc.get("picture"),
        role=role
    )
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/google-session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Fetch user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user_data = res.json()
    email = user_data.get("email")
    name = user_data.get("name")
    picture = user_data.get("picture")
    session_token = user_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.user_roles.insert_one({"user_id": user_id, "role": "customer"})
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    role_doc = await db.user_roles.find_one({"user_id": user_id}, {"_id": 0})
    role = role_doc["role"] if role_doc else "customer"
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: UserResponse = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ===================== MERCHANT ONBOARDING ROUTES =====================

# Initialize Twilio client
def get_twilio_client():
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        return None
    from twilio.rest import Client
    return Client(account_sid, auth_token)

@api_router.post("/merchant/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number for merchant verification"""
    twilio_client = get_twilio_client()
    verify_service = os.environ.get("TWILIO_VERIFY_SERVICE")
    
    if not twilio_client or not verify_service:
        raise HTTPException(status_code=500, detail="SMS service not configured. Please contact support.")
    
    try:
        # Ensure phone number is in E.164 format
        phone = request.phone_number
        if not phone.startswith("+"):
            phone = f"+91{phone}"  # Default to India
        
        verification = twilio_client.verify.v2.services(verify_service) \
            .verifications.create(to=phone, channel="sms")
        
        # Store OTP request for tracking
        await db.otp_requests.insert_one({
            "phone_number": phone,
            "status": verification.status,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"status": verification.status, "message": "OTP sent successfully"}
    except Exception as e:
        logger.error(f"OTP send error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/merchant/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP code for merchant phone verification"""
    twilio_client = get_twilio_client()
    verify_service = os.environ.get("TWILIO_VERIFY_SERVICE")
    
    if not twilio_client or not verify_service:
        raise HTTPException(status_code=500, detail="SMS service not configured")
    
    try:
        phone = request.phone_number
        if not phone.startswith("+"):
            phone = f"+91{phone}"
        
        verification_check = twilio_client.verify.v2.services(verify_service) \
            .verification_checks.create(to=phone, code=request.code)
        
        is_valid = verification_check.status == "approved"
        
        # Update verification status
        if is_valid:
            await db.phone_verifications.update_one(
                {"phone_number": phone},
                {
                    "$set": {
                        "verified": True,
                        "verified_at": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
        
        return {"valid": is_valid, "status": verification_check.status}
    except Exception as e:
        logger.error(f"OTP verify error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/merchant/register")
async def register_merchant(data: MerchantOnboardingRequest):
    """Complete merchant registration after phone verification"""
    
    # Check if phone is verified
    phone = data.phone_number
    if not phone.startswith("+"):
        phone = f"+91{phone}"
    
    phone_verified = await db.phone_verifications.find_one(
        {"phone_number": phone, "verified": True}, {"_id": 0}
    )
    
    if not phone_verified:
        raise HTTPException(status_code=400, detail="Phone number not verified. Please verify OTP first.")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if phone already registered
    existing_merchant = await db.merchants.find_one({"phone": phone}, {"_id": 0})
    if existing_merchant:
        raise HTTPException(status_code=400, detail="Phone number already registered as merchant")
    
    # Create user account
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    merchant_id = f"merch_{uuid.uuid4().hex[:12]}"
    
    # Create user
    await db.users.insert_one({
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "phone": phone,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set role as admin (merchant is admin of their store)
    await db.user_roles.insert_one({"user_id": user_id, "role": "admin"})
    
    # Create merchant profile
    merchant_doc = {
        "merchant_id": merchant_id,
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "phone": phone,
        "shop_name": data.business_info.shop_name,
        "business_category": data.business_info.business_category,
        "store_address": data.business_info.store_address,
        "city": data.business_info.city,
        "state": data.business_info.state,
        "pincode": data.business_info.pincode,
        "kyc_info": {
            "gstin": data.kyc_info.gstin,
            "pan_number": data.kyc_info.pan_number,
            "bank_account_number": data.kyc_info.bank_account_number[-4:],  # Store only last 4 digits
            "bank_ifsc": data.kyc_info.bank_ifsc,
            "bank_name": data.kyc_info.bank_name,
            "account_holder_name": data.kyc_info.account_holder_name
        },
        "subscription_plan": data.subscription_plan,
        "kyc_status": "pending",
        "onboarding_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.merchants.insert_one(merchant_doc)
    
    # Generate token
    token = create_jwt_token(user_id)
    
    return {
        "token": token,
        "merchant": {
            "merchant_id": merchant_id,
            "user_id": user_id,
            "email": data.email,
            "name": data.name,
            "phone": phone,
            "shop_name": data.business_info.shop_name,
            "subscription_plan": data.subscription_plan,
            "kyc_status": "pending"
        }
    }

@api_router.get("/merchant/profile")
async def get_merchant_profile(user: UserResponse = Depends(get_current_user)):
    """Get merchant profile for logged in user"""
    merchant = await db.merchants.find_one({"user_id": user.user_id}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")
    return merchant

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = [
        {
            "plan_id": "starter",
            "name": "Starter",
            "price": 0,
            "currency": "INR",
            "billing_period": "month",
            "features": [
                "Up to 50 products",
                "Basic analytics dashboard",
                "Email support",
                "1 user account",
                "Standard reports"
            ],
            "product_limit": 50,
            "is_popular": False
        },
        {
            "plan_id": "pro",
            "name": "Pro",
            "price": 999,
            "currency": "INR",
            "billing_period": "month",
            "features": [
                "Unlimited products",
                "Advanced AI analytics",
                "Smart Reorder alerts",
                "Priority support",
                "5 user accounts",
                "Custom reports",
                "Inventory forecasting"
            ],
            "product_limit": None,
            "is_popular": True
        },
        {
            "plan_id": "enterprise",
            "name": "Enterprise",
            "price": 2999,
            "currency": "INR",
            "billing_period": "month",
            "features": [
                "Everything in Pro",
                "API access",
                "Dedicated account manager",
                "Custom integrations",
                "Unlimited users",
                "White-label options",
                "24/7 phone support",
                "Multi-store management"
            ],
            "product_limit": None,
            "is_popular": False
        }
    ]
    return plans

@api_router.post("/merchant/upload-document")
async def upload_kyc_document(
    document_type: str,
    request: Request,
    user: UserResponse = Depends(get_current_user)
):
    """Upload KYC document (stored locally for demo)"""
    import base64
    
    body = await request.json()
    file_data = body.get("file_data")  # Base64 encoded file
    file_name = body.get("file_name")
    
    if not file_data or not file_name:
        raise HTTPException(status_code=400, detail="File data and name required")
    
    # Store document reference
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    await db.kyc_documents.insert_one({
        "doc_id": doc_id,
        "user_id": user.user_id,
        "document_type": document_type,
        "file_name": file_name,
        "file_size": len(file_data),
        "status": "uploaded",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update merchant KYC status
    await db.merchants.update_one(
        {"user_id": user.user_id},
        {"$set": {"kyc_status": "documents_submitted"}}
    )
    
    return {"doc_id": doc_id, "message": "Document uploaded successfully"}

# ===================== REFERRAL PROGRAM ROUTES =====================

def generate_referral_code(user_id: str) -> str:
    """Generate a unique referral code"""
    import hashlib
    hash_input = f"{user_id}_{datetime.now(timezone.utc).isoformat()}"
    return hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()

@api_router.get("/referral/my-code")
async def get_my_referral_code(user: UserResponse = Depends(get_current_user)):
    """Get or create referral code for current user"""
    referral = await db.referrals.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not referral:
        # Create new referral entry
        referral_code = generate_referral_code(user.user_id)
        referral = {
            "referral_id": f"ref_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "referral_code": referral_code,
            "total_referrals": 0,
            "successful_referrals": 0,
            "credits_earned": 0.0,
            "available_credits": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referrals.insert_one(referral)
    
    return {
        "referral_code": referral["referral_code"],
        "referral_link": f"https://retailiq.com/signup?ref={referral['referral_code']}"
    }

@api_router.get("/referral/stats")
async def get_referral_stats(user: UserResponse = Depends(get_current_user)):
    """Get referral statistics for current user"""
    referral = await db.referrals.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not referral:
        # Create new referral entry
        referral_code = generate_referral_code(user.user_id)
        referral = {
            "referral_id": f"ref_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "referral_code": referral_code,
            "total_referrals": 0,
            "successful_referrals": 0,
            "credits_earned": 0.0,
            "available_credits": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referrals.insert_one(referral)
    
    # Get pending referrals count
    pending_count = await db.referral_history.count_documents({
        "referrer_id": user.user_id,
        "status": "pending"
    })
    
    return {
        "referral_code": referral["referral_code"],
        "total_referrals": referral.get("total_referrals", 0),
        "successful_referrals": referral.get("successful_referrals", 0),
        "pending_referrals": pending_count,
        "total_credits_earned": referral.get("credits_earned", 0.0),
        "available_credits": referral.get("available_credits", 0.0),
        "referral_link": f"https://retailiq.com/signup?ref={referral['referral_code']}"
    }

@api_router.get("/referral/history")
async def get_referral_history(user: UserResponse = Depends(get_current_user)):
    """Get list of referred users"""
    history = await db.referral_history.find(
        {"referrer_id": user.user_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return history

@api_router.post("/referral/apply")
async def apply_referral_code(referral_code: str, user: UserResponse = Depends(get_current_user)):
    """Apply a referral code during signup (called after user creation)"""
    # Check if user already has a referrer
    existing = await db.referral_history.find_one({
        "referred_user_id": user.user_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Referral code already applied")
    
    # Find referrer by code
    referrer = await db.referrals.find_one({"referral_code": referral_code.upper()}, {"_id": 0})
    
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referrer["user_id"] == user.user_id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    
    # Get referrer user info
    referrer_user = await db.users.find_one({"user_id": referrer["user_id"]}, {"_id": 0})
    
    # Create referral history entry
    await db.referral_history.insert_one({
        "history_id": f"rh_{uuid.uuid4().hex[:12]}",
        "referrer_id": referrer["user_id"],
        "referred_user_id": user.user_id,
        "referred_user_name": user.name,
        "referred_user_email": user.email,
        "referral_code": referral_code.upper(),
        "status": "pending",  # Will become "completed" after first order
        "credits_earned": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update referrer stats
    await db.referrals.update_one(
        {"user_id": referrer["user_id"]},
        {"$inc": {"total_referrals": 1}}
    )
    
    # Give referee a welcome credit
    await db.user_credits.update_one(
        {"user_id": user.user_id},
        {
            "$setOnInsert": {"user_id": user.user_id, "created_at": datetime.now(timezone.utc).isoformat()},
            "$inc": {"available_credits": REFERRAL_REWARD_REFEREE}
        },
        upsert=True
    )
    
    return {
        "message": f"Referral code applied! You've earned ₹{REFERRAL_REWARD_REFEREE} welcome credit.",
        "credits_earned": REFERRAL_REWARD_REFEREE,
        "referrer_name": referrer_user.get("name", "A friend") if referrer_user else "A friend"
    }

@api_router.post("/referral/complete/{referred_user_id}")
async def complete_referral(referred_user_id: str):
    """
    Called internally when a referred user completes their first order.
    Awards credits to the referrer.
    """
    # Find the referral history entry
    history = await db.referral_history.find_one({
        "referred_user_id": referred_user_id,
        "status": "pending"
    }, {"_id": 0})
    
    if not history:
        return {"message": "No pending referral found"}
    
    # Update history to completed
    await db.referral_history.update_one(
        {"referred_user_id": referred_user_id, "status": "pending"},
        {
            "$set": {
                "status": "completed",
                "credits_earned": REFERRAL_REWARD_REFERRER,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Award credits to referrer
    await db.referrals.update_one(
        {"user_id": history["referrer_id"]},
        {
            "$inc": {
                "successful_referrals": 1,
                "credits_earned": REFERRAL_REWARD_REFERRER,
                "available_credits": REFERRAL_REWARD_REFERRER
            }
        }
    )
    
    return {"message": "Referral completed", "credits_awarded": REFERRAL_REWARD_REFERRER}

@api_router.get("/referral/credits")
async def get_user_credits(user: UserResponse = Depends(get_current_user)):
    """Get user's available credits"""
    credits = await db.user_credits.find_one({"user_id": user.user_id}, {"_id": 0})
    referral = await db.referrals.find_one({"user_id": user.user_id}, {"_id": 0})
    
    user_credits = credits.get("available_credits", 0.0) if credits else 0.0
    referral_credits = referral.get("available_credits", 0.0) if referral else 0.0
    
    return {
        "total_credits": user_credits + referral_credits,
        "welcome_credits": user_credits,
        "referral_credits": referral_credits
    }

@api_router.post("/referral/redeem")
async def redeem_credits(data: RedeemCreditsRequest, user: UserResponse = Depends(get_current_user)):
    """Redeem credits for discount on next order"""
    credits_info = await get_user_credits(user)
    
    if data.amount > credits_info["total_credits"]:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Deduct from referral credits first, then user credits
    remaining = data.amount
    
    referral = await db.referrals.find_one({"user_id": user.user_id}, {"_id": 0})
    if referral and referral.get("available_credits", 0) > 0:
        deduct_from_referral = min(remaining, referral["available_credits"])
        await db.referrals.update_one(
            {"user_id": user.user_id},
            {"$inc": {"available_credits": -deduct_from_referral}}
        )
        remaining -= deduct_from_referral
    
    if remaining > 0:
        await db.user_credits.update_one(
            {"user_id": user.user_id},
            {"$inc": {"available_credits": -remaining}}
        )
    
    # Create redemption record
    await db.credit_redemptions.insert_one({
        "redemption_id": f"red_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "amount": data.amount,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": f"₹{data.amount} credits redeemed successfully",
        "amount_redeemed": data.amount,
        "remaining_credits": credits_info["total_credits"] - data.amount
    }

@api_router.get("/referral/leaderboard")
async def get_referral_leaderboard():
    """Get top referrers leaderboard"""
    pipeline = [
        {"$match": {"successful_referrals": {"$gt": 0}}},
        {"$sort": {"successful_referrals": -1}},
        {"$limit": 10},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user"
        }},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "name": {"$ifNull": ["$user.name", "Anonymous"]},
            "successful_referrals": 1,
            "credits_earned": 1
        }}
    ]
    
    leaderboard = await db.referrals.aggregate(pipeline).to_list(10)
    
    # Add rank
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return leaderboard

# ===================== PRODUCTS ROUTES =====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = True
):
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, user: UserResponse = Depends(require_admin)):
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    product_doc = {
        "product_id": product_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    product_doc["created_at"] = datetime.fromisoformat(product_doc["created_at"])
    return ProductResponse(**product_doc)

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductUpdate, user: UserResponse = Depends(require_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    return ProductResponse(**product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: UserResponse = Depends(require_admin)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.get("/products/categories/list")
async def get_categories():
    categories = await db.products.distinct("category")
    return categories

# ===================== ORDERS ROUTES =====================

async def create_order_internal(user: UserResponse, items: List[OrderItemCreate], payment_status: str = "pending") -> dict:
    """Internal function to create an order"""
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    order_items = []
    total_amount = 0
    
    for item in items:
        product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price"] * item.quantity
        total_amount += item_total
        order_items.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "quantity": item.quantity,
            "unit_price": product["price"],
            "total": item_total
        })
    
    order_doc = {
        "order_id": order_id,
        "customer_id": user.user_id,
        "customer_name": user.name,
        "customer_email": user.email,
        "items": order_items,
        "total_amount": total_amount,
        "status": "pending",
        "payment_status": payment_status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    return order_doc

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(data: OrderCreate, user: UserResponse = Depends(get_current_user)):
    """Create order with pending payment (for cart checkout without Stripe)"""
    order_doc = await create_order_internal(user, data.items, "pending")
    
    # Deduct stock
    for item in data.items:
        await db.products.update_one(
            {"product_id": item.product_id},
            {"$inc": {"stock_quantity": -item.quantity}}
        )
    
    # Update status to confirmed for non-payment orders
    await db.orders.update_one(
        {"order_id": order_doc["order_id"]},
        {"$set": {"status": "confirmed", "payment_status": "cod"}}  # Cash on delivery
    )
    order_doc["status"] = "confirmed"
    order_doc["payment_status"] = "cod"
    
    # Send confirmation email
    await send_order_email(user.email, order_doc, "confirmation")
    
    # Check if this is user's first order - complete referral if pending
    order_count = await db.orders.count_documents({"customer_id": user.user_id})
    if order_count == 1:  # This is their first order
        await complete_referral(user.user_id)
    
    # Clear cart
    await db.cart_items.delete_many({"user_id": user.user_id})
    
    order_doc["created_at"] = datetime.fromisoformat(order_doc["created_at"])
    return OrderResponse(**order_doc)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: UserResponse = Depends(get_current_user)):
    if user.role == "admin":
        orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        orders = await db.orders.find({"customer_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for o in orders:
        if isinstance(o.get("created_at"), str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: UserResponse = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if user.role != "admin" and order["customer_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    return OrderResponse(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user: UserResponse = Depends(require_admin)):
    """Update order status (Admin only)"""
    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": data.status}}
    )
    
    # Send status update email
    order["status"] = data.status
    if order.get("customer_email"):
        await send_order_email(order["customer_email"], order, "status_update")
    
    return {"message": f"Order status updated to {data.status}"}

# ===================== PAYMENT ROUTES (STRIPE) =====================

@api_router.post("/checkout/session", response_model=CheckoutResponse)
async def create_checkout_session(data: CheckoutRequest, request: Request, user: UserResponse = Depends(get_current_user)):
    """Create Stripe checkout session for cart or specific order"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    stripe_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Get items from cart or order
    if data.order_id:
        order = await db.orders.find_one({"order_id": data.order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        items = [OrderItemCreate(product_id=i["product_id"], quantity=i["quantity"]) for i in order["items"]]
        total_amount = order["total_amount"]
        order_id = data.order_id
    elif data.items:
        # Create new order
        order_doc = await create_order_internal(user, data.items, "pending")
        items = data.items
        total_amount = order_doc["total_amount"]
        order_id = order_doc["order_id"]
    else:
        # Get cart items
        cart_items = await db.cart_items.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        items = [OrderItemCreate(product_id=c["product_id"], quantity=c["quantity"]) for c in cart_items]
        order_doc = await create_order_internal(user, items, "pending")
        total_amount = order_doc["total_amount"]
        order_id = order_doc["order_id"]
    
    # Build URLs
    success_url = f"{data.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/checkout/cancel?order_id={order_id}"
    
    # Create Stripe checkout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(total_amount),
        currency=CURRENCY.lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "user_id": user.user_id,
            "user_email": user.email
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store payment transaction
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "order_id": order_id,
        "user_id": user.user_id,
        "user_email": user.email,
        "amount": total_amount,
        "currency": CURRENCY,
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update order with session ID
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.session_id,
        order_id=order_id
    )

@api_router.post("/checkout/buy-now", response_model=CheckoutResponse)
async def buy_now(data: BuyNowRequest, request: Request, user: UserResponse = Depends(get_current_user)):
    """Quick buy - create order and checkout for single product"""
    items = [OrderItemCreate(product_id=data.product_id, quantity=data.quantity)]
    checkout_data = CheckoutRequest(items=items, origin_url=data.origin_url)
    return await create_checkout_session(checkout_data, request, user)

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, user: UserResponse = Depends(get_current_user)):
    """Check payment status and update order"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Get transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update if payment successful and not already processed
    if status.payment_status == "paid" and transaction["payment_status"] != "paid":
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update order
        order_id = transaction["order_id"]
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"status": "confirmed", "payment_status": "paid"}}
        )
        
        # Deduct stock
        order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
        for item in order["items"]:
            await db.products.update_one(
                {"product_id": item["product_id"]},
                {"$inc": {"stock_quantity": -item["quantity"]}}
            )
        
        # Clear cart
        await db.cart_items.delete_many({"user_id": user.user_id})
        
        # Send confirmation email
        order["status"] = "confirmed"
        order["payment_status"] = "paid"
        if order.get("customer_email"):
            await send_order_email(order["customer_email"], order, "confirmation")
    
    elif status.status == "expired":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "expired"}}
        )
        await db.orders.update_one(
            {"order_id": transaction["order_id"]},
            {"$set": {"status": "cancelled", "payment_status": "expired"}}
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total / 100,  # Convert from paise to rupees
        "currency": status.currency.upper(),
        "order_id": transaction["order_id"]
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_key:
        return {"status": "error", "message": "Payment service not configured"}
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            session_id = event.session_id
            # Process payment success
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction and transaction["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                await db.orders.update_one(
                    {"order_id": transaction["order_id"]},
                    {"$set": {"status": "confirmed", "payment_status": "paid"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ===================== SUPPLIERS ROUTES =====================

@api_router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(user: UserResponse = Depends(require_admin)):
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(1000)
    for s in suppliers:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    return suppliers

@api_router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(data: SupplierCreate, user: UserResponse = Depends(require_admin)):
    supplier_id = f"sup_{uuid.uuid4().hex[:12]}"
    supplier_doc = {
        "supplier_id": supplier_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.suppliers.insert_one(supplier_doc)
    supplier_doc["created_at"] = datetime.fromisoformat(supplier_doc["created_at"])
    return SupplierResponse(**supplier_doc)

@api_router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: str, data: SupplierCreate, user: UserResponse = Depends(require_admin)):
    result = await db.suppliers.update_one(
        {"supplier_id": supplier_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier = await db.suppliers.find_one({"supplier_id": supplier_id}, {"_id": 0})
    if isinstance(supplier.get("created_at"), str):
        supplier["created_at"] = datetime.fromisoformat(supplier["created_at"])
    return SupplierResponse(**supplier)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, user: UserResponse = Depends(require_admin)):
    result = await db.suppliers.delete_one({"supplier_id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted"}

# ===================== CART ROUTES =====================

@api_router.get("/cart", response_model=List[CartItemResponse])
async def get_cart(user: UserResponse = Depends(get_current_user)):
    cart_items = await db.cart_items.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    result = []
    for item in cart_items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            result.append(CartItemResponse(
                cart_item_id=item["cart_item_id"],
                product_id=item["product_id"],
                product_name=product["name"],
                price=product["price"],
                quantity=item["quantity"],
                image_url=product.get("image_url")
            ))
    return result

@api_router.post("/cart")
async def add_to_cart(data: CartItemCreate, user: UserResponse = Depends(get_current_user)):
    existing = await db.cart_items.find_one(
        {"user_id": user.user_id, "product_id": data.product_id},
        {"_id": 0}
    )
    
    if existing:
        await db.cart_items.update_one(
            {"cart_item_id": existing["cart_item_id"]},
            {"$inc": {"quantity": data.quantity}}
        )
    else:
        cart_item_id = f"cart_{uuid.uuid4().hex[:12]}"
        await db.cart_items.insert_one({
            "cart_item_id": cart_item_id,
            "user_id": user.user_id,
            "product_id": data.product_id,
            "quantity": data.quantity
        })
    
    return {"message": "Added to cart"}

@api_router.put("/cart/{cart_item_id}")
async def update_cart_item(cart_item_id: str, quantity: int, user: UserResponse = Depends(get_current_user)):
    if quantity <= 0:
        await db.cart_items.delete_one({"cart_item_id": cart_item_id, "user_id": user.user_id})
    else:
        await db.cart_items.update_one(
            {"cart_item_id": cart_item_id, "user_id": user.user_id},
            {"$set": {"quantity": quantity}}
        )
    return {"message": "Cart updated"}

@api_router.delete("/cart/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, user: UserResponse = Depends(get_current_user)):
    await db.cart_items.delete_one({"cart_item_id": cart_item_id, "user_id": user.user_id})
    return {"message": "Removed from cart"}

@api_router.delete("/cart")
async def clear_cart(user: UserResponse = Depends(get_current_user)):
    await db.cart_items.delete_many({"user_id": user.user_id})
    return {"message": "Cart cleared"}

# ===================== WISHLIST ROUTES =====================

@api_router.get("/wishlist", response_model=List[WishlistItemResponse])
async def get_wishlist(user: UserResponse = Depends(get_current_user)):
    wishlist_items = await db.wishlist.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    result = []
    for item in wishlist_items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            result.append(WishlistItemResponse(
                wishlist_id=item["wishlist_id"],
                product_id=item["product_id"],
                product_name=product["name"],
                price=product["price"],
                image_url=product.get("image_url"),
                category=product["category"],
                stock_quantity=product["stock_quantity"]
            ))
    return result

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user: UserResponse = Depends(get_current_user)):
    existing = await db.wishlist.find_one(
        {"user_id": user.user_id, "product_id": product_id},
        {"_id": 0}
    )
    if existing:
        return {"message": "Already in wishlist"}
    
    wishlist_id = f"wish_{uuid.uuid4().hex[:12]}"
    await db.wishlist.insert_one({
        "wishlist_id": wishlist_id,
        "user_id": user.user_id,
        "product_id": product_id,
        "added_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{wishlist_id}")
async def remove_from_wishlist(wishlist_id: str, user: UserResponse = Depends(get_current_user)):
    await db.wishlist.delete_one({"wishlist_id": wishlist_id, "user_id": user.user_id})
    return {"message": "Removed from wishlist"}

# ===================== ANALYTICS ROUTES =====================

@api_router.get("/analytics/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(user: UserResponse = Depends(require_admin)):
    # Total revenue
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0
    
    # Today's orders
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = await db.orders.count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    # Total products
    total_products = await db.products.count_documents({"is_active": True})
    
    # Low stock
    low_stock = await db.products.count_documents({
        "is_active": True,
        "$expr": {"$lte": ["$stock_quantity", "$reorder_level"]}
    })
    
    return DashboardStats(
        total_revenue=total_revenue,
        today_orders=today_orders,
        total_products=total_products,
        low_stock_count=low_stock
    )

@api_router.get("/analytics/sales-trend", response_model=List[SalesTrend])
async def get_sales_trend(days: int = 7, user: UserResponse = Depends(require_admin)):
    results = []
    for i in range(days - 1, -1, -1):
        date = datetime.now(timezone.utc) - timedelta(days=i)
        start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}}},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}, "count": {"$sum": 1}}}
        ]
        result = await db.orders.aggregate(pipeline).to_list(1)
        
        results.append(SalesTrend(
            date=start.strftime("%Y-%m-%d"),
            revenue=result[0]["total"] if result else 0,
            orders=result[0]["count"] if result else 0
        ))
    
    return results

@api_router.get("/analytics/top-products")
async def get_top_products(limit: int = 5, user: UserResponse = Depends(require_admin)):
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "name": {"$first": "$items.product_name"},
            "total_sold": {"$sum": "$items.quantity"},
            "revenue": {"$sum": "$items.total"}
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": limit}
    ]
    results = await db.orders.aggregate(pipeline).to_list(limit)
    return results

@api_router.get("/analytics/low-stock")
async def get_low_stock_products(user: UserResponse = Depends(require_admin)):
    products = await db.products.find(
        {"is_active": True, "$expr": {"$lte": ["$stock_quantity", "$reorder_level"]}},
        {"_id": 0}
    ).to_list(100)
    return products

@api_router.get("/analytics/customers", response_model=List[CustomerStats])
async def get_customer_stats(user: UserResponse = Depends(require_admin)):
    # Get all customers
    customers = await db.users.find({}, {"_id": 0}).to_list(1000)
    result = []
    
    for customer in customers:
        # Get customer's orders
        pipeline = [
            {"$match": {"customer_id": customer["user_id"]}},
            {"$group": {"_id": None, "count": {"$sum": 1}, "total": {"$sum": "$total_amount"}}}
        ]
        order_stats = await db.orders.aggregate(pipeline).to_list(1)
        
        result.append(CustomerStats(
            user_id=customer["user_id"],
            name=customer.get("name", "Unknown"),
            email=customer.get("email", ""),
            phone=customer.get("phone"),
            order_count=order_stats[0]["count"] if order_stats else 0,
            total_spent=order_stats[0]["total"] if order_stats else 0
        ))
    
    return sorted(result, key=lambda x: x.total_spent, reverse=True)

# ===================== AI CHAT ROUTES =====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(data: ChatMessage, user: UserResponse = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    session_id = data.session_id or f"chat_{user.user_id}_{uuid.uuid4().hex[:8]}"
    
    # Get context data
    stats = await get_dashboard_stats(user) if user.role == "admin" else None
    
    system_message = f"""You are RetailIQ Assistant, an AI helper for a retail management platform in India. 
You help shop owners with:
- Inventory management and stock advice
- Sales analysis and trends
- Customer insights
- Product recommendations
- Business optimization tips

Currency used: Indian Rupees ({CURRENCY_SYMBOL})

Be concise, helpful, and data-driven in your responses."""
    
    if stats:
        system_message += f"""

Current store stats:
- Total Revenue: {CURRENCY_SYMBOL}{stats.total_revenue:,.2f}
- Today's Orders: {stats.today_orders}
- Total Products: {stats.total_products}
- Low Stock Alerts: {stats.low_stock_count}"""
    
    try:
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)
        
        # Store chat history
        await db.chat_messages.insert_one({
            "user_id": user.user_id,
            "session_id": session_id,
            "message": data.message,
            "response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable")

# ===================== USER MANAGEMENT =====================

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: UserResponse = Depends(require_admin)):
    if role not in ["admin", "customer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.user_roles.update_one(
        {"user_id": user_id},
        {"$set": {"role": role}},
        upsert=True
    )
    return {"message": f"Role updated to {role}"}

@api_router.put("/profile")
async def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    user: UserResponse = Depends(get_current_user)
):
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
    if address:
        update_data["address"] = address
    
    if update_data:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    return {"message": "Profile updated"}

# ===================== CONFIG ENDPOINT =====================

@api_router.get("/config")
async def get_config():
    """Get app configuration (currency, etc.)"""
    return {
        "currency": CURRENCY,
        "currency_symbol": CURRENCY_SYMBOL
    }

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for demo purposes"""
    # Check if already seeded
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    # Create admin user
    admin_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": admin_id,
        "email": "admin@retailiq.com",
        "name": "Admin User",
        "password_hash": hash_password("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_roles.insert_one({"user_id": admin_id, "role": "admin"})
    
    # Sample products with INR prices
    products = [
        {"name": "Wireless Earbuds", "category": "Electronics", "price": 2999.00, "cost_price": 1800.00, "stock_quantity": 150, "reorder_level": 20, "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"},
        {"name": "Smart Watch", "category": "Electronics", "price": 12999.00, "cost_price": 8000.00, "stock_quantity": 45, "reorder_level": 10, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
        {"name": "Bluetooth Speaker", "category": "Electronics", "price": 4999.00, "cost_price": 3000.00, "stock_quantity": 80, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
        {"name": "Cotton T-Shirt", "category": "Clothing", "price": 799.00, "cost_price": 350.00, "stock_quantity": 200, "reorder_level": 30, "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"},
        {"name": "Denim Jeans", "category": "Clothing", "price": 1999.00, "cost_price": 900.00, "stock_quantity": 120, "reorder_level": 20, "image_url": "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400"},
        {"name": "Running Shoes", "category": "Sports", "price": 4499.00, "cost_price": 2500.00, "stock_quantity": 60, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
        {"name": "Organic Coffee Beans", "category": "Groceries", "price": 599.00, "cost_price": 300.00, "stock_quantity": 5, "reorder_level": 25, "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"},
        {"name": "Extra Virgin Olive Oil", "category": "Groceries", "price": 899.00, "cost_price": 450.00, "stock_quantity": 90, "reorder_level": 20, "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"},
        {"name": "Indoor Plant Pot", "category": "Home & Garden", "price": 1299.00, "cost_price": 600.00, "stock_quantity": 8, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400"},
        {"name": "LED Desk Lamp", "category": "Home & Garden", "price": 1799.00, "cost_price": 800.00, "stock_quantity": 55, "reorder_level": 10, "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"},
        {"name": "Yoga Mat", "category": "Sports", "price": 1299.00, "cost_price": 500.00, "stock_quantity": 70, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"},
        {"name": "Fitness Tracker", "category": "Electronics", "price": 3499.00, "cost_price": 1800.00, "stock_quantity": 3, "reorder_level": 10, "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400"},
    ]
    
    for p in products:
        p["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
        p["description"] = f"High quality {p['name'].lower()} for your everyday needs."
        p["unit"] = "piece"
        p["is_active"] = True
        p["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_many(products)
    
    # Sample suppliers
    suppliers = [
        {"name": "TechSupply India", "email": "orders@techsupply.in", "phone": "9876543210", "address": "123 Tech Park, Bangalore"},
        {"name": "Fashion Forward", "email": "contact@fashionforward.in", "phone": "9876543211", "address": "456 Style Street, Mumbai"},
        {"name": "Fresh Farms India", "email": "supply@freshfarms.in", "phone": "9876543212", "address": "789 Farm Road, Punjab"},
    ]
    
    for s in suppliers:
        s["supplier_id"] = f"sup_{uuid.uuid4().hex[:12]}"
        s["notes"] = ""
        s["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.suppliers.insert_many(suppliers)
    
    # Sample orders for the past 7 days
    product_list = await db.products.find({}, {"_id": 0}).to_list(100)
    for i in range(20):
        order_date = datetime.now(timezone.utc) - timedelta(days=i % 7, hours=i * 2)
        items = []
        total = 0
        for _ in range(1, 4):
            prod = product_list[i % len(product_list)]
            qty = (i % 3) + 1
            item_total = prod["price"] * qty
            total += item_total
            items.append({
                "product_id": prod["product_id"],
                "product_name": prod["name"],
                "quantity": qty,
                "unit_price": prod["price"],
                "total": item_total
            })
        
        await db.orders.insert_one({
            "order_id": f"ord_{uuid.uuid4().hex[:12]}",
            "customer_id": admin_id,
            "customer_name": "Demo Customer",
            "customer_email": "admin@retailiq.com",
            "items": items,
            "total_amount": total,
            "status": "delivered",
            "payment_status": "paid",
            "created_at": order_date.isoformat()
        })
    
    return {"message": "Data seeded successfully", "admin_email": "admin@retailiq.com", "admin_password": "admin123"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
