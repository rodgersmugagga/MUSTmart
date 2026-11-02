# MUSTmart — Campus Marketplace Platform

**Mbarara University of Science and Technology (MUST)**  
**Faculty of Computing and Informatics · Department of Software Engineering**  
**Course:** Software Project Management (SWE3103) · **Group A**

---

## 👥 Prepared By Group A
- **Nsubuga Arafat:** `2024/BSE/154/PS`
- **Muggaga Rodgers:** `2024/BSE/103/PS`
- **Dembe Brandon:** `2024/BSE/055/PS`
- **Bwambale Arafat:** `2024/BSE/050/PS`
- **Ninsiima Carol:** `2024/BSE/151/PS`
- **Mugisha Joel:** `2024/BSE/105/PS`
- **Lukaye Collins:** `2023/BSE/161/PS`

---

## 📌 Benchmark Architecture & Specifications

This platform is built strictly in accordance with the project benchmark documents and Work Breakdown Structure (WBS):

| Benchmark Document | System Implementation |
|---|---|
| **System Architecture Diagram** (`MUSTmart System Architecture Diagram.pdf`) | 3-tier web architecture: Browser presentation tier, Node.js + Express application tier with 7 modules (1.4.1–1.4.7), and Relational Data Tier. |
| **Entity-Relationship Diagram** (`MUSTmart Entity-Relationship Diagram.pdf`) | 13 normalized tables: `users`, `businesses`, `verification_documents`, `categories`, `listings`, `listing_photos`, `land_details`, `hostel_details`, `reviews`, `moderation_actions`, `conversations`, `messages`, `notifications`. |
| **Verification & Approval Flowchart** (`mustmart_flowchart.html`) | Onboarding verification steps, admin document review queue (A1), decision branches (`approve`, `reject`, `request info`), and listing status transitions (`pending` → `live` or `rejected with reason`). |
| **Review & Moderation Flowchart** (`MUSTmart Review Submission and Moderation Flowchart.pdf`) | One-review-per-listing rule, immediate live publication, community flagging, admin review moderation queue (A3), and immutable moderation action logging. |
| **UI Mockups** (`MUSTmart UI Mockups-1.pdf`) | Exact implementation of screens: **C1** (Home & Search), **C2** (Search Results & Hostels), **C3** (Listing Detail), **C4** (Inquiry Chat), **C5** (Write Review), **O1** (Register & Verify Business), **O2** (Create Listing), **O3** (My Listings & Inbox), **N1** (Notifications), **A1** (Verification Queue), **A2** (Listing Moderation), **A3** (Review Moderation). |

---

## 🛠️ Technology Stack
- **Frontend:** React (Vite), Lucide Icons, Vanilla CSS responsive design system
- **Backend:** Node.js, Express.js REST API
- **Database:** **Neon PostgreSQL** (with automatic local zero-config fallback engine)
- **Authentication:** JWT, bcrypt password hashing, role-based access control (`consumer`, `owner`, `agent`, `administrator`)

---

## 🚀 Getting Started

### 1. Database Configuration (Neon PostgreSQL)
To connect your Neon PostgreSQL database:
1. Open `.env` (or `backend/.env`).
2. Add your Neon connection string:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
   PORT=5000
   JWT_SECRET=mustmart_super_secure_jwt_secret_key_2026
   CLIENT_URL=http://localhost:5173
   ```
> *Note: If `DATABASE_URL` is omitted, the backend automatically operates seamlessly using a local storage engine initialized with the exact same 13 tables and sample MUST data.*

### 2. Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
- Server URL: `http://localhost:5000`
- Health Endpoint: `http://localhost:5000/api/health`

### 3. Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend URL: `http://localhost:5173` (or `http://localhost:5174`)

---

## 📋 WBS Phase 1.4 Module Traceability Matrix

| WBS Code | Module | Screen & Capabilities |
|---|---|---|
| **1.4.1** | **User Registration & Verification** | **Screen O1 & A1**: Business onboarding, student/national ID upload, proof of ownership or agency agreement, admin verification queue. |
| **1.4.2** | **Listings Management** | **Screen O2 & O3**: Listing CRUD, photo uploads, dynamic category fields for hostels (rooms, amenities) and land (plot size, title check). |
| **1.4.3** | **Search & Discovery** | **Screen C1 & C2**: Keyword search, category filtering, location selection (Kihumuro, Kakoba, Town Campus), price range, verified-only toggle, orientation picks. |
| **1.4.4** | **Buyer-Seller Messaging** | **Screen C4**: Direct buyer-seller chat with inquiry summary, unread badges, and payment disclaimer: *"Payments are arranged directly between buyer and seller. MUSTmart does not process payments."* |
| **1.4.5** | **Ratings & Reviews** | **Screen C5 & A3**: Star rating & review form with duplicate review guard (one per listing) and community flagging. |
| **1.4.6** | **Admin Dashboard & Moderation** | **Screens A1, A2, A3**: Queue moderation with approve/reject/request-info and persistent audit logging in `moderation_actions`. |
| **1.4.7** | **Notification System** | **Screen N1**: In-app notifications for new inquiries, replies, verification approvals, and listing decisions. |
| **1.4.8** | **System Integration** | Full 3-tier end-to-end integration across all modules with pre-seeded MUST pilot businesses (Kihumuro Hostels, MUST Tech Hub, Prime Plots, Fresh Bakes, Sparkle Laundry). |

---

## 🎭 Evaluator Role Switcher
In the top header, use the **ACTOR** pill buttons to instantly switch perspectives during evaluation:
- **Student (Consumer):** Browse orientation picks, test search filters, open listing details, write reviews, and send inquiries.
- **Hostel Owner / Tech Owner (Business Owner):** View O3 dashboard, edit listings, see admin rejection feedback, and resubmit.
- **Admin (Administrator):** View A1 verification queue, A2 listing moderation, A3 review moderation, and inspection audit trail.
# MUSTmart
