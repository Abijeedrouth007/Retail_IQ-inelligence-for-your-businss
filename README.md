# RetailIQ

<div align="center">
  
![RetailIQ Logo](https://img.shields.io/badge/RetailIQ-AI%20Powered-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTYgMmgxMmExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINmExIDEgMCAwIDEtMS0xVjNhMSAxIDAgMCAxIDEtMXoiLz48cGF0aCBkPSJNOSA2aDYiLz48cGF0aCBkPSJNOSAxMGg2Ii8+PHBhdGggZD0iTTkgMTRoNiIvPjwvc3ZnPg==)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**AI-Powered Retail Management & Analytics Platform for Modern Shop Owners**

[Live Demo](https://inventory-ai-hub-3.preview.emergentagent.com) • [Documentation](#documentation) • [Report Bug](#contributing) • [Request Feature](#contributing)

</div>

---

## Overview

RetailIQ is a comprehensive SaaS platform designed for small to medium retail businesses in India. It combines powerful inventory management, AI-driven analytics, and seamless customer experiences to help shop owners grow their business.

### Key Highlights

- **AI-Powered Insights**: Leverage Gemini AI for demand forecasting, sales predictions, and intelligent recommendations
- **Real-time Analytics**: Track revenue, orders, inventory levels, and customer behavior with beautiful dashboards
- **Smart Inventory**: Automated low-stock alerts, reorder suggestions, and supplier management
- **Multi-role System**: Separate dashboards for admins (shop owners) and customers
- **Indian Market Ready**: Built with INR currency, GST compliance, and local payment integrations

---

## Features

### For Shop Owners (Admin)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time KPIs including revenue, orders, products, and low stock alerts |
| **Analytics** | Sales trends, top products, demand forecasting with Recharts visualization |
| **Inventory** | Product CRUD, stock tracking, category management, bulk operations |
| **Customers** | Customer database, purchase history, spending analytics |
| **Sales** | Order management, status workflow (Pending → Shipped → Delivered) |
| **Suppliers** | Supplier directory and contact management |
| **AI Chatbot** | 24/7 AI assistant for business insights and support |

### For Customers

| Feature | Description |
|---------|-------------|
| **Store** | Browse products by category with search functionality |
| **Cart** | Add items, adjust quantities, cart drawer for quick access |
| **Checkout** | Stripe integration for secure payments |
| **Orders** | Track order status and history |
| **Wishlist** | Save products for later |
| **Buy Now** | Quick purchase flow for single items |

### Platform Features

- **Merchant Onboarding**: Multi-step registration with OTP verification
- **Subscription Plans**: Starter (Free), Pro (₹999/mo), Enterprise (₹2,999/mo)
- **KYC Compliance**: GSTIN, PAN, and bank account verification
- **Email Notifications**: Order confirmations and status updates via SendGrid
- **Google Maps**: Store location display (placeholder)

---

## Tech Stack

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium UI components
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **React Query** - Server state management
- **React Router v6** - Navigation

### Backend
- **FastAPI** - Modern Python web framework
- **Motor** - Async MongoDB driver
- **PyJWT** - Authentication
- **bcrypt** - Password hashing
- **Twilio** - SMS OTP verification

### Database
- **MongoDB** - NoSQL database

### Integrations
- **Gemini AI** (via Emergent LLM) - AI chatbot and insights
- **Stripe** - Payment processing
- **SendGrid** - Email notifications
- **Twilio** - SMS verification
- **Google Maps** - Location services

---

## Installation

### Prerequisites

- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB 6.0+
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/retailiq.git
   cd retailiq
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   
   Create `backend/.env`:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=retailiq
   JWT_SECRET=your_super_secret_key
   EMERGENT_LLM_KEY=your_emergent_key
   STRIPE_API_KEY=sk_test_xxx
   SENDGRID_API_KEY=your_sendgrid_key
   SENDGRID_FROM_EMAIL=noreply@yourstore.com
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_VERIFY_SERVICE=your_verify_service_sid
   GOOGLE_MAPS_API_KEY=your_maps_key
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   ```

   Create `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

5. **Start the Application**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   yarn start
   ```

6. **Seed Demo Data**
   ```bash
   curl -X POST http://localhost:8001/api/seed
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8001/docs

### Demo Credentials
- **Admin**: admin@retailiq.com / admin123

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Merchant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchant/send-otp` | Send OTP for verification |
| POST | `/api/merchant/verify-otp` | Verify OTP code |
| POST | `/api/merchant/register` | Complete merchant registration |
| GET | `/api/subscription/plans` | Get subscription plans |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/{id}` | Update product (Admin) |
| DELETE | `/api/products/{id}` | Delete product (Admin) |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/{id}/status` | Update order status (Admin) |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard KPIs |
| GET | `/api/analytics/sales-trend` | Sales trend data |
| GET | `/api/analytics/top-products` | Top selling products |
| GET | `/api/analytics/customers` | Customer statistics |

---

## Project Structure

```
retailiq/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── ui/       # shadcn components
│   │   │   ├── chatbot/  # AI chatbot
│   │   │   └── layout/   # Navigation, sidebar
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/    # Admin dashboard pages
│   │   │   ├── customer/ # Customer pages
│   │   │   ├── store/    # Product store
│   │   │   ├── merchant/ # Onboarding flow
│   │   │   └── pricing/  # Subscription plans
│   │   │
│   │   ├── contexts/     # React contexts (Auth, Config)
│   │   ├── App.js        # Main router
│   │   └── App.css       # Global styles
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Database Schema

### Collections

```javascript
// users
{
  user_id: String,
  email: String,
  name: String,
  password_hash: String,
  phone: String,
  created_at: DateTime
}

// products
{
  product_id: String,
  name: String,
  category: String,
  price: Number,
  cost_price: Number,
  stock_quantity: Number,
  reorder_level: Number,
  image_url: String,
  is_active: Boolean
}

// orders
{
  order_id: String,
  customer_id: String,
  items: Array,
  total_amount: Number,
  status: String,  // pending, confirmed, shipped, delivered
  payment_status: String
}

// merchants
{
  merchant_id: String,
  user_id: String,
  shop_name: String,
  business_category: String,
  kyc_info: Object,
  subscription_plan: String
}
```

---

## Deployment

### Using Docker

```dockerfile
# Coming soon
```

### Environment Variables for Production

Ensure all API keys are set for production:
- `STRIPE_API_KEY` - Live Stripe key
- `SENDGRID_API_KEY` - Verified SendGrid key
- `TWILIO_*` - Verified Twilio credentials
- `GOOGLE_MAPS_API_KEY` - Restricted Maps API key

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Roadmap

- [ ] CSV Export for Sales Reports
- [ ] Multi-language Support (Hindi, regional languages)
- [ ] Mobile App (React Native)
- [ ] WhatsApp Business Integration
- [ ] Advanced Demand Forecasting with ML
- [ ] Barcode/QR Scanner for Inventory
- [ ] GST Invoice Generation

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Acknowledgments

- [Emergent](https://emergent.sh) - AI Integration Platform
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Recharts](https://recharts.org) - Charts Library
- [FastAPI](https://fastapi.tiangolo.com) - Backend Framework

---

<div align="center">
  
**Built with ❤️ for Indian Retailers**

[⬆ Back to Top](#retailiq)

</div>
