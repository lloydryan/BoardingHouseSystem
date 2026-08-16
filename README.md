# Boarding House React

React frontend for a boarding house monitoring and rental management system.

This project is currently frontend-only. Backend/API work can be added later, but the app is now organized as a simple Vite React project from the repository root.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Folder Structure

```text
src/
  assets/       Static frontend assets
  components/   Reusable UI and feature components
  config/       App configuration such as Firebase setup
  contexts/     React context and auth route guards
  hooks/        Shared React hooks
  pages/        Page-level screens grouped by role
  routes/       Route table and layout shell
  schemas/      Validation schemas
  services/     Client-side service helpers
```

## Environment

Copy `.env.example` to `.env` and update values as needed.

```bash
cp .env.example .env
```

The frontend still has API service helpers in `src/services/apiService.ts` so the app is ready to connect to a backend later.
