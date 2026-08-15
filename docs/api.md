# API Modules

The REST API is organized by domain module.

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

## Super Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/landlords`
- `POST /api/admin/landlords`
- `GET /api/admin/landlords/:id`
- `PATCH /api/admin/landlords/:id`
- `PATCH /api/admin/landlords/:id/status`
- `PATCH /api/admin/landlords/:id/property-limit`
- `PATCH /api/admin/landlords/:id/theme`

## Landlord Workspace

- `GET /api/properties`
- `POST /api/properties`
- `GET /api/properties/:id`
- `PATCH /api/properties/:id`
- `DELETE /api/properties/:id`
- `GET /api/properties/:propertyId/units`
- `POST /api/properties/:propertyId/units`
- `GET /api/units/:id`
- `PATCH /api/units/:id`
- `DELETE /api/units/:id`
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/:id`
- `PATCH /api/tenants/:id`
- `POST /api/tenants/:id/move-out`
- `GET /api/billing`
- `POST /api/billing/generate`
- `POST /api/billing/generate-batch`
- `GET /api/billing/:id`
- `PATCH /api/billing/:id`
- `POST /api/billing/:id/finalize`
- `POST /api/billing/:id/cancel`
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/payments/:id`
- `POST /api/payments/:id/reverse`
- `GET /api/payments/:id/receipt`

All landlord workspace endpoints resolve tenant scope from the authenticated session, never from client-provided `landlordId`.
