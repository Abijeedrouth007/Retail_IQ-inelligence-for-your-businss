# RetailIQ - Product Requirements Document

## Original Problem Statement
Build RetailIQ - an AI-powered retail management and analytics SaaS platform for small shop owners and customers.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **AI Integration**: Gemini 3 Flash via Emergent Integrations
- **Payments**: Stripe (test mode)
- **Email**: SendGrid (placeholder)

## Currency
- **Indian Rupees (INR)** - ₹ symbol

## User Personas
1. **Admin (Shop Owner)**: Manages inventory, views analytics, tracks sales, manages customers and suppliers, updates order statuses
2. **Customer**: Browses products, manages cart/wishlist, places orders via COD or online payment, views order history with status tracking

## Core Requirements (Static)
- Role-based access control (admin/customer)
- Product inventory management with stock tracking
- Customer order management with status workflow
- Analytics dashboard with revenue/sales charts
- AI chatbot for retail insights
- Payment integration (Stripe)
- Email notifications for orders

## What's Been Implemented (Jan 2026)

### Backend (40+ API endpoints)
- User authentication (signup, login, Google OAuth)
- JWT token-based session management
- Products CRUD API
- Orders API with stock management
- Order status workflow (pending → confirmed → shipped → delivered)
- Stripe checkout session creation
- Payment webhook handling
- SendGrid email notifications (placeholder)
- Suppliers CRUD API
- Cart and Wishlist APIs
- Analytics endpoints (dashboard stats, sales trends, top products)
- AI Chat endpoint with Gemini 3 Flash

### Frontend
- Landing page with cinematic hero section
- Auth page (login/signup/Google OAuth)
- Admin Dashboard with KPIs and charts (INR)
- Analytics page with revenue insights
- Inventory management with add/edit/delete
- Customer management page
- Sales page with order status management dropdown
- Suppliers management
- Customer store with product grid, Cart & Buy Now buttons
- Shopping cart page with Pay Online & Cash on Delivery options
- Order history with status timeline (pending → confirmed → shipped → delivered)
- Wishlist page
- AI Chatbot (floating widget)
- Checkout success/cancel pages
- Responsive sidebar navigation

### Database Collections
- users, user_sessions, user_roles
- products, orders, suppliers
- cart_items, wishlist
- chat_messages, payment_transactions

## Prioritized Backlog

### P0 (Critical - Immediate)
- None (MVP + payments complete)

### P1 (High Priority)
- Real SendGrid API key integration
- Real Stripe key for production
- Invoice generation (PDF)
- Multi-language support (Hindi)

### P2 (Medium Priority)
- Multi-store support
- Product variants (sizes, colors)
- Customer reviews/ratings
- Discount/coupon system
- Export reports to PDF

### P3 (Nice to Have)
- Real-time inventory sync
- Supplier order management
- Advanced AI demand forecasting
- Mobile app (React Native)
- WhatsApp notifications

## Demo Credentials
- **Admin**: admin@retailiq.com / admin123
- **Google OAuth**: Available via "Continue with Google"

## API Endpoints
- POST /api/auth/signup, login, google-session, logout
- GET /api/auth/me
- GET/POST/PUT/DELETE /api/products
- GET/POST /api/orders
- PUT /api/orders/{order_id}/status (admin)
- POST /api/checkout/session, /api/checkout/buy-now
- GET /api/checkout/status/{session_id}
- POST /api/webhook/stripe
- GET/POST/PUT/DELETE /api/suppliers
- GET/POST/PUT/DELETE /api/cart
- GET/POST/DELETE /api/wishlist
- GET /api/analytics/dashboard, sales-trend, top-products, customers
- POST /api/chat
- GET /api/config

## Next Tasks
1. Add real SendGrid API key for order notifications
2. Add real Stripe key for production payments
3. Implement invoice PDF generation
4. Add Hindi language support
