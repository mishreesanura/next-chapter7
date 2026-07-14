# Next Chapter: Placement Application Tracker

A modern, full-stack application designed to parse, extract, and track placement application messages (e.g., from WhatsApp/Slack placement groups) using tenant-isolated workspaces.

## Project Structure

This repository is organized as a monorepo consisting of:

*   **`nextchapter-backend`**: A Hono + TypeScript API server using Prisma ORM with MongoDB, Better Auth (for user accounts and team-based tenant isolation), JWTs, custom parse strategies, rate limiting, and cursor-based pagination.
*   **`nextchapter-frontend`**: A Next.js 15 App Router application styled with Vanilla CSS/Tailwind, integrated with Auth.js (NextAuth v5) Credentials provider wrapping the backend JWT tokens, and providing interactive forms, filters, and paginated application tables.

---

## Technical Stack & Design

### Backend
*   **Framework**: [Hono](https://hono.dev/) (fast, lightweight web framework for Node.js)
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Prisma ORM](https://www.prisma.io/)
*   **Authentication**: [Better Auth](https://www.better-auth.com/) (handles sessions, user registration, JWT generation, and organizations)
*   **Testing**: Jest + Supertest for end-to-end API integration and isolation tests

### Frontend
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
*   **Styling**: Tailwind CSS + Custom CSS tokens supporting dynamic theme switching
*   **State & Forms**: React Hook Form + Zod validation
*   **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

### 1. Prerequisites
*   Node.js 22+
*   An active MongoDB instance (or MongoDB Atlas cluster URI)
*   npm 10+

### 2. Environment Configurations

#### Backend (`nextchapter-backend/.env`)
Create a `.env` file in the `nextchapter-backend` directory with the following variables:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="your-mongodb-atlas-url"
TEST_DATABASE_URL="your-mongodb-atlas-test-url"
BETTER_AUTH_SECRET="a-random-32-character-string"
BETTER_AUTH_URL="http://localhost:4000"
FRONTEND_ORIGIN="http://localhost:3000"
EXTRACT_RATE_LIMIT_WINDOW_MS=60000
EXTRACT_RATE_LIMIT_MAX=12
```

#### Frontend (`nextchapter-frontend/.env.local`)
Create a `.env.local` file in the `nextchapter-frontend` directory with the following variables:
```env
AUTH_SECRET="a-different-random-32-character-string"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_API_URL="http://localhost:4000"
```

---

### 3. Installation & Run

#### Backend Setup
```bash
cd nextchapter-backend
npm install
npm run prisma:generate
npm run seed              # Seeds demo users (mishree.demo.one@example.com / Password123!)
npm run dev               # Starts backend at http://localhost:4000
```

#### Frontend Setup
```bash
cd nextchapter-frontend
npm install
npm run dev               # Starts frontend at http://localhost:3000
```

---

## Key Features & Implementations

1.  **Multi-Tenant Isolation**: The system partitions data using the user's active `organizationId`. Queries and updates are strictly isolated based on the authenticated context.
2.  **Robust WhatsApp/Slack Message Parser**: Custom parse strategies dynamically extract:
    *   Company Name
    *   Roles/Positions
    *   Stipend/Package
    *   Location & Duration
    *   Eligibility Criteria
    *   Deadline
    *   Application Links
3.  **Cursor-Based Pagination**: Seamless, reliable load-more pagination preventing duplicated or skipped entries.
4.  **Rate Limiting**: Authenticated per-user token-bucket rate limiting on extraction endpoints.
5.  **Polished Dashboard & UI**: Smooth transitions, responsive tables, a custom placement message parser modal, interactive status dropdowns, and light/dark mode support.

---

## Running Verification & Tests

### Backend Unit & Integration Tests
Runs tests with isolated database setup verifying session handling, registration, parsing correctness, rate limits, pagination, and multi-tenant boundary checks:
```bash
cd nextchapter-backend
npm test
```

### Frontend Typechecking & Linting
```bash
cd nextchapter-frontend
npm run typecheck
npm run lint
```
