# Architecture

## System Shape

The product is a multi-tenant SaaS application with two primary account levels:

- Super Admin: manages platform-wide landlords, limits, subscriptions, audit logs, and settings.
- Landlord: manages only the properties, units, tenants, leases, billing, utilities, payments, reports, notifications, and branding assigned to their landlord workspace.

The system uses a modular monorepo:

```text
apps/api
  prisma/
  src/modules/auth
  src/modules/admin
  src/modules/landlords
  src/modules/subscriptions
  src/modules/properties
  src/modules/units
  src/modules/tenants
  src/modules/leases
  src/modules/billing
  src/modules/electricity
  src/modules/water
  src/modules/payments
  src/modules/reports
  src/modules/notifications
  src/modules/themes
  src/modules/uploads
  src/modules/audit-logs
  src/modules/settings
apps/web
  src/app
  src/components
  src/features
  src/lib
  src/routes
  src/styles
packages/shared
  src/contracts
  src/constants
  src/schemas
```

## Backend Layers

- Routes define REST endpoints and attach authentication, authorization, validation, and rate-limit middleware.
- Controllers translate HTTP input into service commands.
- Services implement business rules and authorization-aware workflows.
- Repositories wrap Prisma queries and enforce tenant scoping for landlord-owned records.
- Audit utilities write immutable audit events for security and financial actions.

## Frontend Shape

The frontend will use a role-aware route tree:

- Public routes: login, forgot password, reset password, unauthorized, suspended account.
- Super Admin routes: dashboard, landlords, subscriptions, reports, audit logs, settings.
- Landlord routes: dashboard, properties, units, tenants, leases, billing, utilities, payments, reports, notifications, theme, account settings.

Landlord workspaces will load `ThemeSetting` after authentication and map it to CSS variables. Super Admin UI will use a fixed platform theme.

## Database Strategy

PostgreSQL stores normalized records with UUID primary keys. Landlord-owned records include `landlordId`, and child records also include appropriate `propertyId`, `unitId`, and `tenantId` references. Soft deletion is used for operational records where history must be preserved.

Financial and audit records are immutable by default. Corrections use explicit cancellation, reversal, adjustment, or audit records instead of hard deletion.

## Multi-Tenant Isolation

Landlord isolation is enforced at multiple layers:

1. Authentication tokens include the user role and the authenticated `landlordId` when applicable.
2. Landlord routes ignore any frontend-supplied `landlordId`.
3. Repository queries always constrain landlord-owned records by `ctx.landlordId`.
4. Nested resources are ownership-checked before mutation. For example, a unit can be changed only after confirming its property belongs to the authenticated landlord.
5. Super Admin routes are separated by role checks and audited when they affect landlord accounts, subscriptions, limits, or branding.
6. Guessing a UUID for another landlord's record returns not found or unauthorized without leaking ownership details.

## Security Approach

- Passwords are hashed with bcrypt in Phase 2.
- Access tokens are short-lived JWTs.
- Refresh tokens are rotated and stored as hashes.
- Refresh cookies are secure, HTTP-only, SameSite-aware, and environment-configured.
- Every protected route uses authentication middleware.
- Role-based authorization guards Super Admin and Landlord modules.
- Zod validates all request payloads and query parameters.
- Prisma parameterization prevents SQL injection.
- Helmet, CORS allowlists, rate limiting, and production-safe errors are applied globally.
- Uploads are validated by type, size, and destination policy.
- Audit logs capture actor, role, landlord context, action, record id, IP, user agent, old values, new values, and timestamp.

## Phase Plan

1. Phase 1: architecture, folder structure, Prisma data model, tenant-isolation explanation.
2. Phase 2: authentication, roles and permissions, Super Admin landlord management, property-limit enforcement.
3. Phase 3: properties, units, tenants, leases.
4. Phase 4: electricity and water monitoring, monthly billing, payments, balances, receipts.
5. Phase 5: dashboards, reports, notifications, audit logs.
6. Phase 6: landlord themes, responsive UI, validation, loading states, empty states, error handling.
7. Phase 7: tests, seed data, security review, tenant-isolation review, README, deployment and API documentation.
