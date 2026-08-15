# Boarding House SaaS

Production-oriented SaaS Boarding House Monitoring and Rental Management System.

This repository contains a runnable full-stack demo implementation plus the Phase 1 production architecture and Prisma schema.

## Run Locally

```bash
npm install
npm run dev
```

Open:

- Web app: `http://localhost:5173`
- API health: `http://localhost:4000/api/health`

Demo credentials shown on the login page:

- Super Admin: `admin@boarding.test`
- Landlord: `rivera@boarding.test`

The current API uses seeded in-memory data so you can inspect workflows immediately. It can also hydrate the same demo collections from Firebase Firestore.

## Firebase Setup

Firebase client config is already added in `apps/web/.env.example` for project `boarding-housems`.

Server-side Firestore reads and seeding need Firebase Admin credentials:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Set either `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` in `apps/api/.env`, then seed Firestore:

```bash
npm run firebase:seed -w apps/api
```

To run the API from Firestore instead of memory:

```bash
BH_DATA_SOURCE=firestore npm run dev:api
```

Set `FIRESTORE_WRITE_THROUGH=true` to save demo mutations such as added properties, floors, units, landlord status changes, and theme updates back to Firestore.

Demo users are seeded with a `demoPassword` field for test accounts only:

- Super Admin: `admin@boarding.test` / `admin123`
- Landlord: `rivera@boarding.test` / `password123`
- Landlord: `santos@boarding.test` / `password123`

Do not use `demoPassword` for production accounts. Real Firebase Auth or hashed server-side passwords should replace it before launch.

## Proposed Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Lucide Icons, React Router, React Hook Form, Zod, TanStack Query, Recharts
- Backend: Node.js, TypeScript, Express.js, Prisma ORM, REST API
- Database: PostgreSQL
- Auth: JWT access tokens, refresh tokens in secure HTTP-only cookies, bcrypt password hashing

## Workspace Layout

```text
apps/
  api/      Express API, Prisma schema, backend modules
  web/      React frontend
docs/       Architecture, security, API, and deployment docs
packages/   Shared contracts and utilities
```

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Update `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and cookie settings.

4. Validate the Prisma schema:

```bash
npm run prisma:validate
```

## Page Code

Landlord pages are in `apps/web/src/pages/landlord`.

Super Admin pages are in `apps/web/src/pages/admin`.

Shared pages are in `apps/web/src/pages/shared`.

Public pages are in `apps/web/src/pages/public`.

The API entry and demo endpoints are in `apps/api/src/index.ts`.
