# RetailIQ - Product Requirements Document

## Original Problem Statement
Build RetailIQ - an AI-powered retail management and analytics SaaS platform for small shop owners and customers.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth + OTP via Twilio
- **AI Integration**: Gemini 3 Flash via Emergent Integrations
- **Payments**: Stripe (test mode)
- **Email**: SendGrid (placeholder)
- **SMS**: Twilio (OTP verification)

## Currency
- **Indian Rupees (INR)** - ₹ symbol

## User Personas
1. **Admin (Shop Owner/Merchant)**: Manages inventory, views analytics, tracks sales, manages customers and suppliers, updates order statuses
2. **Customer**: Browses products, manages cart/wishlist, places orders via COD or online payment, views order history with status tracking

## Core Requirements (Static)
- Role-based access control (admin/customer)
- Product inventory management with stock tracking
- Customer order management with status workflow
- Analytics dashboard with revenue/sales charts
- AI chatbot for retail insights
- Payment integration (Stripe)
- Email notifications for orders
- Merchant onboarding with OTP verification
- Subscription plans (Starter/Pro/Enterprise)

## What's Been Implemented (Apr 2026)

### Backend (60+ API endpoints)
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
- **Merchant Onboarding APIs**
  - POST /api/merchant/send-otp - SMS OTP via Twilio
  - POST /api/merchant/verify-otp - Verify OTP code
  - POST /api/merchant/register - Complete merchant registration with KYC
  - GET /api/merchant/profile - Get merchant profile
  - GET /api/subscription/plans - Get subscription plans
  - POST /api/merchant/upload-document - Upload KYC documents
- **Referral Program APIs (NEW)**
  - GET /api/referral/my-code - Get/create referral code
  - GET /api/referral/stats - Get referral statistics
  - GET /api/referral/history - Get referred users list
  - POST /api/referral/apply - Apply referral code during signup
  - POST /api/referral/complete - Complete referral (internal)
  - GET /api/referral/credits - Get user credits
  - POST /api/referral/redeem - Redeem credits for discount
  - GET /api/referral/leaderboard - Get top referrers
  - POST /api/merchant/verify-otp - Verify OTP code
  - POST /api/merchant/register - Complete merchant registration with KYC
  - GET /api/merchant/profile - Get merchant profile
  - GET /api/subscription/plans - Get subscription plans
  - POST /api/merchant/upload-document - Upload KYC documents

### Frontend
- Landing page with "Partner with Us" CTA and pricing preview
- **Pricing page with 3 tiers (Starter/Pro/Enterprise)**
- **Merchant Onboarding page (5-step flow)**
  - Phone Verification (OTP)
  - Account Details
  - Business Information
  - KYC Documents (GSTIN, PAN, Bank Details)
  - Plan Selection
- **Referral Program page (NEW)**
  - Unique referral code with copy/share buttons
  - Stats cards (total, successful, pending referrals)
  - Available credits display
  - Referral history list
  - Top Referrers leaderboard
  - "How It Works" section
- Auth page (login/signup/Google OAuth) with referral code input
- Admin Dashboard with KPIs and charts (INR)
- Analytics page with revenue insights
- Inventory management with add/edit/delete
- Customer management page
- Sales page with order status management dropdown
- Suppliers management
- Customer store with product grid, Cart & Buy Now buttons
- Shopping cart page with Pay Online & Cash on Delivery options
- Order history with status timeline
- Wishlist page
- AI Chatbot (floating widget)
- Checkout success/cancel pages
- Responsive sidebar navigation with Referrals link

### Database Collections
- users, user_sessions, user_roles
- products, orders, suppliers
- cart_items, wishlist
- chat_messages, payment_transactions
- merchants, phone_verifications, otp_requests, kyc_documents
- **referrals, referral_history, user_credits, credit_redemptions (NEW)**

### Referral Program (NEW)
- Referrer earns ₹100 when referee completes first order
- Referee gets ₹50 welcome credit on signup
- Credits can be redeemed for discounts
- Leaderboard shows top referrers
- Referral link format: `retailiq.com/auth?ref=CODE`

### Subscription Plans
| Plan | Price | Features |
|------|-------|----------|
| Starter | Free | Up to 50 products, Basic analytics, Email support |
| Pro | ₹999/mo | Unlimited products, AI analytics, Smart Reorder, Priority support |
| Enterprise | ₹2,999/mo | Everything in Pro + API access, Dedicated manager, Multi-store |

## Prioritized Backlog

### P0 (Critical - Immediate)
- None (MVP + payments + merchant onboarding complete)

### P1 (High Priority)
- Real Twilio credentials for OTP verification
- Real SendGrid API key integration
- Real Stripe key for production
- Invoice generation (PDF)
- CSV Export for Sales page

### P2 (Medium Priority)
- Multi-store support
- Product variants (sizes, colors)
- Customer reviews/ratings
- Discount/coupon system
- Export reports to PDF
- Multi-language support (Hindi)

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
- **POST /api/merchant/send-otp, verify-otp, register**
- **GET /api/merchant/profile, /api/subscription/plans**
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

## Environment Variables Required
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=retailiq
JWT_SECRET=your_secret_key
EMERGENT_LLM_KEY=your_emergent_key
STRIPE_API_KEY=sk_test_xxx
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_VERIFY_SERVICE=your_verify_service_sid
GOOGLE_MAPS_API_KEY=your_maps_key
```

## Next Tasks
1. Add real Twilio credentials for merchant OTP verification
2. Add real SendGrid API key for order notifications
3. Add real Stripe key for production payments
4. Implement CSV export on Sales page
5. Add Hindi language support
