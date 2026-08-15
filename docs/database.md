# Database Design

## Core Tenancy

`LandlordProfile` is the tenant boundary for landlord-owned data. These records carry `landlordId`:

- Property
- Unit
- Tenant
- TenantUnitAssignment
- Lease
- BillingStatement
- BillingLineItem
- ElectricityReading
- WaterReading
- Payment
- PaymentAllocation
- PaymentReversal
- OtherCharge
- Discount
- Penalty
- ThemeSetting
- Notification
- UploadedFile

`AuditLog` can be platform-wide or landlord-scoped.

## Important Constraints

- Property codes are unique per landlord.
- Unit numbers are unique per property.
- Billing statements are unique per tenant and billing period.
- Electricity and water readings are unique per unit and billing month.
- One active theme exists per landlord.
- Confirmed payments are reversed through `PaymentReversal`, not deleted.

## Soft Deletion

Operational records use `archivedAt` to preserve history. Financial and audit records should not be permanently deleted in normal application workflows.
