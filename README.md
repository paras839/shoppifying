<<<<<<< HEAD
# Shopifying: A Multi-Tenant Shopify Insights Dashboard

Shopifying is a full-stack, multi-tenant Shopify data ingestion and insights service, built as a submission for the Xeno Forward Deployed Engineer (FDE) Internship assignment. This project demonstrates a complete, production-ready workflow for onboarding multiple Shopify stores, syncing their core business data, and visualizing key performance indicators in a secure, professional web application.

**Submission Date:** September 12, 2025

---

### ✨ Key Features

- **Secure Multi-Tenant Onboarding:** Seamlessly connect any Shopify store using the official OAuth 2.0 flow.
- **Automated Data Ingestion:** Syncs core e-commerce data including Products, Customers, Orders, and Line Items.
- **Real-time Sync via Webhooks:** Automatically updates the database when new orders are created in Shopify.
- **Secure User Authentication:** A complete email/password authentication system using JWTs stored in secure `httpOnly` cookies. Features include registration, login, logout, and password management.
- **Interactive Insights Dashboard:** A clean, modern, and responsive dashboard built with Next.js and Tailwind CSS.
- **Tenant Isolation:** A store switcher allows users to view isolated data and metrics for each connected store.
- **Advanced Data Visualization:** Includes professional charts for key metrics like Daily Revenue, Customer Segmentation, and Best-Selling Products.
- **Full Store Management:** Users can add new stores, sync data on-demand, and securely delete stores and all their associated data.

---

### ⚙️ Tech Stack

| Category | Technology |
| :----------- | :--------------------------------------------------------------------------------- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, Recharts, `lucide-react` |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Database** | PostgreSQL |
| **Deployment** | Vercel (Frontend), Render (Backend), Supabase (Database) |

---

### 🏛️ High-Level Architecture

The application is architected as a decoupled monorepo with a separate frontend and backend, which is a standard for modern, scalable web applications.

1. **Frontend (Next.js):** A server-side rendered application that handles all user-facing interactions, including the secure login and the interactive dashboard.
2. **Backend (Node.js/Express):** A RESTful API that manages all business logic, including the Shopify OAuth flow, user authentication, webhook validation, and secure database operations.
3. **Database (PostgreSQL):** A cloud-hosted PostgreSQL database that stores all application data, with a schema designed for multi-tenancy.
4. **Shopify:** Acts as the external data source, communicating with the backend via the Admin API for bulk syncing and Webhooks for real-time events.

---

### 🚀 Getting Started

To run this project locally, you will need Node.js, npm, and a running PostgreSQL instance.

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
data-engineering
cd your-repo-name
```

#### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create your environment file
# (e.g., by copying from .env.example if provided)
touch .env

# Fill in your .env with your database URL, Shopify API keys, and a JWT secret.

# Apply the database schema
npx prisma migrate dev

# Start the backend server
npm run dev
# Your backend will be running on http://localhost:3000
```

#### 3. Frontend Setup

```bash
# Navigate to the frontend directory from the root
cd frontend

# Install dependencies
npm install

# Create your local environment file
touch .env.local

# Add the following line to your .env.local file:
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"

# Start the frontend server
npm run dev
# Your frontend will be running on http://localhost:3001
```

#### 4. Ngrok for Shopify Integration

To test the Shopify installation and webhook flow locally, you must expose your backend server to the internet using ngrok.

```bash
ngrok http 3000 --host-header="localhost:3000"
```

You must update your App URL in the Shopify Partner Dashboard and the `HOST` variable in your `backend/.env` file with the new ngrok URL.

---

### 📦 API Endpoints & Database Schema

#### Key API Endpoints

All protected routes (marked with 🔒) require an active session cookie.

| Method | Endpoint | Protection | Description |
| --- | --- | --- | --- |
| POST | /api/auth/register | Public | Register a new user. |
| POST | /api/auth/login | Public | Log in a user and set a session cookie. |
| POST | /api/auth/logout | Public | Log out a user and clear the session cookie. |
| POST | /api/auth/change-password | 🔒 | Change the password for a logged-in user. |
| GET | /api/shopify/install | Public | Starts the Shopify OAuth installation flow. |
| GET | /api/shopify/callback | Public | Handles the secure callback from Shopify. |
| POST | /api/tenants/link | 🔒 | Links a tenant to a logged-in user. |
| POST | /api/tenants/:tenantId/sync | 🔒 | Triggers a full data sync for a tenant. |
| GET | /api/tenants/me/data | 🔒 | Fetches all data for the logged-in user. |
| DELETE | /api/tenants/:tenantId | 🔒 | Deletes a tenant and all its data. |

---

### Database Schema (`schema.prisma`)

The schema is designed with a multi-tenant architecture, where all core data (Products, Customers, Orders, LineItems) is isolated by a `tenantId`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id          String   @id @default(cuid())
  storeUrl    String   @unique
  accessToken String
  createdAt   DateTime @default(now())
  customers   Customer[]
  products    Product[]
  orders      Order[]
  users       User[]     @relation("TenantToUser")
  lineItems   LineItem[]
}

model Customer {
  id        BigInt   @id
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  firstName String?
  lastName  String?
  email     String?
  phone     String?
  createdAt DateTime
  orders    Order[]
  @@unique([id, tenantId])
}

model Product {
  id          BigInt     @id
  tenantId    String
  tenant      Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  vendor      String?
  productType String?
  createdAt   DateTime
  imageUrl    String?
  lineItems   LineItem[]
  @@unique([id, tenantId])
}

model Order {
  id              BigInt     @id
  tenantId        String
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  totalPrice      Float
  currency        String
  financialStatus String?
  createdAt       DateTime
  customerId      BigInt?
  customer        Customer?  @relation(fields: [customerId, tenantId], references: [id, tenantId], onDelete: Cascade, onUpdate: NoAction)
  lineItems       LineItem[]
  @@unique([id, tenantId])
}

model LineItem {
  id         BigInt   @id
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orderId    BigInt
  order      Order    @relation(fields: [orderId, tenantId], references: [id, tenantId], onDelete: Cascade, onUpdate: NoAction)
  productId  BigInt?
  product    Product? @relation(fields: [productId, tenantId], references: [id, tenantId], onDelete: SetNull, onUpdate: NoAction)
  quantity   Int
  price      Float
  title      String
  @@unique([id, tenantId])
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  tenants   Tenant[] @relation("TenantToUser")
}
```
=======
# Shopifying
>>>>>>> ace7bae8bcdd27e939e68f43ea8c3b23380caa4f
