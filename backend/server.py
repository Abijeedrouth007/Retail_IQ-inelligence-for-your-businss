from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
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
    items: List[OrderItemResponse]
    total_amount: float
    status: str
    created_at: datetime

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

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(data: OrderCreate, user: UserResponse = Depends(get_current_user)):
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    items = []
    total_amount = 0
    
    for item in data.items:
        product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price"] * item.quantity
        total_amount += item_total
        items.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "quantity": item.quantity,
            "unit_price": product["price"],
            "total": item_total
        })
        
        # Update stock
        await db.products.update_one(
            {"product_id": item.product_id},
            {"$inc": {"stock_quantity": -item.quantity}}
        )
    
    order_doc = {
        "order_id": order_id,
        "customer_id": user.user_id,
        "customer_name": user.name,
        "items": items,
        "total_amount": total_amount,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
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
    
    system_message = """You are RetailIQ Assistant, an AI helper for a retail management platform. 
You help shop owners with:
- Inventory management and stock advice
- Sales analysis and trends
- Customer insights
- Product recommendations
- Business optimization tips

Be concise, helpful, and data-driven in your responses."""
    
    if stats:
        system_message += f"""

Current store stats:
- Total Revenue: ${stats.total_revenue:,.2f}
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
    
    # Sample products
    categories = ["Electronics", "Clothing", "Groceries", "Home & Garden", "Sports"]
    products = [
        {"name": "Wireless Earbuds", "category": "Electronics", "price": 79.99, "cost_price": 45.00, "stock_quantity": 150, "reorder_level": 20, "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"},
        {"name": "Smart Watch", "category": "Electronics", "price": 299.99, "cost_price": 180.00, "stock_quantity": 45, "reorder_level": 10, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
        {"name": "Bluetooth Speaker", "category": "Electronics", "price": 129.99, "cost_price": 75.00, "stock_quantity": 80, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
        {"name": "Cotton T-Shirt", "category": "Clothing", "price": 24.99, "cost_price": 8.00, "stock_quantity": 200, "reorder_level": 30, "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"},
        {"name": "Denim Jeans", "category": "Clothing", "price": 59.99, "cost_price": 25.00, "stock_quantity": 120, "reorder_level": 20, "image_url": "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400"},
        {"name": "Running Shoes", "category": "Sports", "price": 149.99, "cost_price": 85.00, "stock_quantity": 60, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
        {"name": "Organic Coffee Beans", "category": "Groceries", "price": 18.99, "cost_price": 9.00, "stock_quantity": 5, "reorder_level": 25, "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"},
        {"name": "Extra Virgin Olive Oil", "category": "Groceries", "price": 14.99, "cost_price": 7.00, "stock_quantity": 90, "reorder_level": 20, "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"},
        {"name": "Indoor Plant Pot", "category": "Home & Garden", "price": 34.99, "cost_price": 15.00, "stock_quantity": 8, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400"},
        {"name": "LED Desk Lamp", "category": "Home & Garden", "price": 49.99, "cost_price": 22.00, "stock_quantity": 55, "reorder_level": 10, "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"},
        {"name": "Yoga Mat", "category": "Sports", "price": 39.99, "cost_price": 15.00, "stock_quantity": 70, "reorder_level": 15, "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"},
        {"name": "Fitness Tracker", "category": "Electronics", "price": 89.99, "cost_price": 45.00, "stock_quantity": 3, "reorder_level": 10, "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400"},
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
        {"name": "TechSupply Co.", "email": "orders@techsupply.com", "phone": "1234567890", "address": "123 Tech Street, Silicon Valley"},
        {"name": "Fashion Forward", "email": "contact@fashionforward.com", "phone": "2345678901", "address": "456 Style Ave, New York"},
        {"name": "Fresh Farms Inc.", "email": "supply@freshfarms.com", "phone": "3456789012", "address": "789 Farm Road, Kansas"},
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
            "items": items,
            "total_amount": total,
            "status": "completed",
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
