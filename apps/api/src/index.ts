import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { seed } from "./seed.js";
import { loadSeedFromFirestore, saveSeedDoc } from "./firestoreStore.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 240 }));

type Role = "SUPER_ADMIN" | "LANDLORD";

function publicUser(user: any) {
  const { demoPassword: _demoPassword, ...safeUser } = user;
  return safeUser;
}

function getContext(req: express.Request) {
  const role = (req.header("x-demo-role") ?? "LANDLORD") as Role;
  const landlordId = req.header("x-landlord-id") ?? seed.landlords[0].id;
  return { role, landlordId };
}

function landlordScoped<T extends { landlordId?: string }>(req: express.Request, records: T[]) {
  const ctx = getContext(req);
  if (ctx.role === "SUPER_ADMIN") return records;
  return records.filter((record) => record.landlordId === ctx.landlordId);
}

function getOwnedProperty(req: express.Request, propertyId: string) {
  return landlordScoped(req, seed.properties).find((item) => item.id === propertyId);
}

function getOwnedFloor(req: express.Request, floorId: string) {
  return landlordScoped(req, seed.floors).find((item) => item.id === floorId);
}

function latestByUnit<T extends { unitId?: string }>(records: T[], unitId: string) {
  return records.filter((item) => item.unitId === unitId).at(-1);
}

function unitWorkspace(unit: any) {
  const tenants = seed.tenants.filter((item) => item.unitId === unit.id);
  const leases = seed.leases.filter((item) => item.unitId === unit.id);
  const bills = seed.billing.filter((item) => item.unitId === unit.id);
  const electricity = seed.electricity.filter((item) => item.unitId === unit.id);
  const water = seed.water.filter((item) => item.unitId === unit.id);
  const payments = seed.payments.filter((item) => item.propertyId === unit.propertyId && item.unitNumber === unit.unitNumber);
  const currentBill = bills.at(-1);
  return {
    ...unit,
    tenants,
    leases,
    billing: bills,
    electricity,
    water,
    payments,
    primaryTenant: tenants[0]?.fullName ?? unit.tenantName ?? "",
    outstandingBalance: bills.reduce((sum, item) => sum + item.remainingBalance, 0),
    billingStatus: currentBill?.status ?? "No Bill",
    electricityStatus: latestByUnit(seed.electricity, unit.id) ? "Recorded" : "Pending",
    waterStatus: latestByUnit(seed.water, unit.id) ? "Recorded" : "Pending",
    latestElectricity: electricity.at(-1),
    latestWater: water.at(-1),
    recentPayment: payments.at(-1),
    currentBill
  };
}

function floorSummary(floorId: string) {
  const units = seed.units.filter((item) => item.floorId === floorId);
  const workspaces = units.map(unitWorkspace);
  return {
    totalUnits: units.length,
    occupiedUnits: units.filter((item) => item.status === "Occupied").length,
    vacantUnits: units.filter((item) => item.status === "Vacant").length,
    reservedUnits: units.filter((item) => item.status === "Reserved").length,
    maintenanceUnits: units.filter((item) => item.status === "Under Maintenance").length,
    expectedRent: units.reduce((sum, item) => sum + item.monthlyRent, 0),
    collected: workspaces.reduce((sum, item) => sum + item.payments.reduce((paymentSum: number, payment: any) => paymentSum + payment.amountPaid, 0), 0),
    outstanding: workspaces.reduce((sum, item) => sum + item.outstandingBalance, 0)
  };
}

function buildingForProperty(property: any) {
  const floors = seed.floors
    .filter((item) => item.propertyId === property.id)
    .sort((a, b) => b.displayOrder - a.displayOrder)
    .map((floor) => ({
      ...floor,
      summary: floorSummary(floor.id),
      units: seed.units
        .filter((unit) => unit.floorId === floor.id)
        .map((unit) => {
          const workspace = unitWorkspace(unit);
          return {
            id: workspace.id,
            floorId: workspace.floorId,
            unitNumber: workspace.unitNumber,
            unitName: workspace.unitName,
            unitType: workspace.unitType,
            status: workspace.status,
            monthlyRent: workspace.monthlyRent,
            occupancy: workspace.currentOccupantCount,
            maximumOccupants: workspace.maxOccupants,
            primaryTenant: workspace.primaryTenant,
            outstandingBalance: workspace.outstandingBalance,
            billingStatus: workspace.billingStatus,
            electricityStatus: workspace.electricityStatus,
            waterStatus: workspace.waterStatus
          };
        })
    }));
  return {
    property,
    summary: {
      totalFloors: floors.length,
      totalUnits: property.totalUnits,
      occupiedUnits: property.occupiedUnits,
      vacantUnits: property.vacantUnits,
      reservedUnits: property.reservedUnits ?? 0,
      maintenanceUnits: property.maintenanceUnits ?? 0,
      expectedRent: property.monthlyExpectedRent,
      collected: property.collectedThisMonth,
      outstanding: property.outstanding
    },
    floors
  };
}

function totalsForLandlord(landlordId: string) {
  const properties = seed.properties.filter((item) => item.landlordId === landlordId);
  const units = seed.units.filter((item) => item.landlordId === landlordId);
  const tenants = seed.tenants.filter((item) => item.landlordId === landlordId);
  const bills = seed.billing.filter((item) => item.landlordId === landlordId);
  const payments = seed.payments.filter((item) => item.landlordId === landlordId);
  return {
    totalProperties: properties.length,
    totalUnits: units.length,
    occupiedUnits: units.filter((item) => item.status === "Occupied").length,
    vacantUnits: units.filter((item) => item.status === "Vacant").length,
    activeTenants: tenants.filter((item) => item.status === "Active").length,
    expectedMonthlyRent: units.reduce((sum, item) => sum + item.monthlyRent, 0),
    collectedThisMonth: payments.reduce((sum, item) => sum + item.amountPaid, 0),
    outstandingBalance: bills.reduce((sum, item) => sum + item.remainingBalance, 0),
    overdueAccounts: bills.filter((item) => item.status === "Overdue").length,
    electricityCharges: seed.electricity.filter((item) => item.landlordId === landlordId).reduce((sum, item) => sum + item.amount, 0),
    waterCharges: seed.water.filter((item) => item.landlordId === landlordId).reduce((sum, item) => sum + item.amount, 0)
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "boarding-house-api", time: new Date().toISOString() });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email ?? "").toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = seed.users.find((item) => item.email.toLowerCase() === email);
  if (!user || user.demoPassword !== password) return res.status(401).json({ message: "Invalid email or password" });

  res.json({ accessToken: "demo-access-token", user: publicUser(user) });
});

app.get("/api/auth/me", (req, res) => {
  const ctx = getContext(req);
  const user = ctx.role === "SUPER_ADMIN" ? seed.users[0] : seed.users.find((item) => item.landlordId === ctx.landlordId);
  res.json({ user: user ? publicUser(user) : user, landlord: seed.landlords.find((item) => item.id === ctx.landlordId) });
});

app.get("/api/admin/dashboard", (_req, res) => {
  res.json({
    totals: {
      totalLandlords: seed.landlords.length,
      activeLandlords: seed.landlords.filter((item) => item.status === "Active").length,
      suspendedLandlords: seed.landlords.filter((item) => item.status === "Suspended").length,
      totalProperties: seed.properties.length,
      totalUnits: seed.units.length,
      totalTenants: seed.tenants.length
    },
    landlords: seed.landlords,
    activity: seed.auditLogs,
    charts: seed.platformCharts
  });
});

app.get("/api/admin/landlords", (_req, res) => {
  res.json(seed.landlords.map((landlord) => ({ ...landlord, usage: totalsForLandlord(landlord.id) })));
});

app.patch("/api/admin/landlords/:id/status", (req, res) => {
  const landlord = seed.landlords.find((item) => item.id === req.params.id);
  if (!landlord) return res.status(404).json({ message: "Landlord not found" });
  landlord.status = req.body.status ?? landlord.status;
  void saveSeedDoc("landlords", landlord.id, landlord);
  res.json(landlord);
});

app.get("/api/dashboard", (req, res) => {
  const ctx = getContext(req);
  res.json({
    totals: totalsForLandlord(ctx.landlordId),
    recentPayments: landlordScoped(req, seed.payments).slice(0, 5),
    upcomingDueDates: landlordScoped(req, seed.billing).filter((item) => item.status !== "Paid").slice(0, 5),
    charts: seed.landlordCharts,
    notifications: landlordScoped(req, seed.notifications)
  });
});

app.get("/api/properties", (req, res) => res.json(landlordScoped(req, seed.properties)));
app.get("/api/properties/:propertyId/building", (req, res) => {
  const property = getOwnedProperty(req, req.params.propertyId);
  if (!property) return res.status(404).json({ message: "Property not found" });
  res.json(buildingForProperty(property));
});
app.get("/api/properties/:propertyId/floors", (req, res) => {
  const property = getOwnedProperty(req, req.params.propertyId);
  if (!property) return res.status(404).json({ message: "Property not found" });
  res.json(seed.floors.filter((item) => item.propertyId === property.id));
});
app.post("/api/properties/:propertyId/floors", (req, res) => {
  const ctx = getContext(req);
  const property = getOwnedProperty(req, req.params.propertyId);
  if (!property) return res.status(404).json({ message: "Property not found" });
  const floorNumber = Number(req.body.floorNumber);
  if (!req.body.name) return res.status(400).json({ message: "Floor name is required." });
  if (!Number.isFinite(floorNumber) || floorNumber < 0) return res.status(400).json({ message: "Floor number must be positive or zero for ground floor." });
  if (seed.floors.some((item) => item.propertyId === property.id && item.floorNumber === floorNumber)) return res.status(409).json({ message: "Floor number must be unique inside the property." });
  const floor = {
    id: `floor-${Date.now()}`,
    landlordId: ctx.landlordId,
    propertyId: property.id,
    name: String(req.body.name),
    floorNumber,
    displayOrder: Number(req.body.displayOrder ?? floorNumber),
    description: String(req.body.description ?? ""),
    status: String(req.body.status ?? "Active")
  };
  seed.floors.push(floor);
  property.numberOfFloors += 1;
  void saveSeedDoc("floors", floor.id, floor);
  void saveSeedDoc("properties", property.id, property);
  res.status(201).json(floor);
});
app.get("/api/properties/:id", (req, res) => {
  const property = landlordScoped(req, seed.properties).find((item) => item.id === req.params.id);
  if (!property) return res.status(404).json({ message: "Property not found" });
  const propertyUnits = seed.units.filter((item) => item.propertyId === property.id);
  res.json({
    ...property,
    units: propertyUnits.map((unit) => ({
      ...unit,
      tenants: seed.tenants.filter((item) => item.unitId === unit.id),
      leases: seed.leases.filter((item) => item.unitId === unit.id),
      billing: seed.billing.filter((item) => item.unitId === unit.id),
      electricity: seed.electricity.filter((item) => item.unitId === unit.id),
      water: seed.water.filter((item) => item.unitId === unit.id),
      payments: seed.payments.filter((item) => item.propertyId === property.id && item.unitNumber === unit.unitNumber)
    })),
    tenants: seed.tenants.filter((item) => item.propertyId === property.id),
    leases: seed.leases.filter((item) => item.propertyId === property.id),
    payments: seed.payments.filter((item) => item.propertyId === property.id),
    billing: seed.billing.filter((item) => item.propertyId === property.id),
    electricity: seed.electricity.filter((item) => item.propertyId === property.id),
    water: seed.water.filter((item) => item.propertyId === property.id)
  });
});
app.post("/api/properties", (req, res) => {
  const ctx = getContext(req);
  const currentCount = seed.properties.filter((item) => item.landlordId === ctx.landlordId).length;
  const landlord = seed.landlords.find((item) => item.id === ctx.landlordId);
  if (landlord && currentCount >= landlord.maxProperties) {
    return res.status(409).json({ message: "You have reached your property limit. Please contact the platform administrator to add more properties." });
  }
  const property = { id: `prop-${Date.now()}`, landlordId: ctx.landlordId, status: "Active", totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, ...req.body };
  seed.properties.push(property);
  void saveSeedDoc("properties", property.id, property);
  res.status(201).json(property);
});

app.get("/api/units", (req, res) => res.json(landlordScoped(req, seed.units)));
app.get("/api/properties/:propertyId/units", (req, res) => res.json(landlordScoped(req, seed.units).filter((item) => item.propertyId === req.params.propertyId)));
app.get("/api/floors/:floorId", (req, res) => {
  const floor = getOwnedFloor(req, req.params.floorId);
  if (!floor) return res.status(404).json({ message: "Floor not found" });
  res.json({ ...floor, summary: floorSummary(floor.id) });
});
app.patch("/api/floors/:floorId", (req, res) => {
  const floor = getOwnedFloor(req, req.params.floorId);
  if (!floor) return res.status(404).json({ message: "Floor not found" });
  Object.assign(floor, req.body);
  void saveSeedDoc("floors", floor.id, floor);
  res.json(floor);
});
app.delete("/api/floors/:floorId", (req, res) => {
  const floor = getOwnedFloor(req, req.params.floorId);
  if (!floor) return res.status(404).json({ message: "Floor not found" });
  const activeUnits = seed.units.filter((item) => item.floorId === floor.id && item.status !== "Inactive");
  if (activeUnits.length) return res.status(409).json({ message: "Archive blocked. Move or archive active units first." });
  floor.status = "Archived";
  void saveSeedDoc("floors", floor.id, floor);
  res.json(floor);
});
app.get("/api/floors/:floorId/units", (req, res) => {
  const floor = getOwnedFloor(req, req.params.floorId);
  if (!floor) return res.status(404).json({ message: "Floor not found" });
  res.json(seed.units.filter((item) => item.floorId === floor.id).map(unitWorkspace));
});
app.post("/api/floors/:floorId/units", (req, res) => {
  const ctx = getContext(req);
  const floor = getOwnedFloor(req, req.params.floorId);
  if (!floor) return res.status(404).json({ message: "Floor not found" });
  if (floor.status === "Archived") return res.status(409).json({ message: "Cannot add units to an archived floor." });
  if (seed.units.some((item) => item.propertyId === floor.propertyId && item.unitNumber === req.body.unitNumber)) return res.status(409).json({ message: "Unit number must be unique within the property." });
  const rent = Number(req.body.monthlyRent);
  const deposit = Number(req.body.securityDeposit ?? 0);
  const maxOccupants = Number(req.body.maxOccupants ?? 1);
  if (rent < 0 || deposit < 0) return res.status(400).json({ message: "Rent and deposit cannot be negative." });
  if (maxOccupants < 1) return res.status(400).json({ message: "Maximum occupants must be at least one." });
  const unit = {
    id: `unit-${Date.now()}`,
    landlordId: ctx.landlordId,
    propertyId: floor.propertyId,
    floorId: floor.id,
    floor: String(floor.floorNumber),
    unitNumber: String(req.body.unitNumber),
    unitName: String(req.body.unitName ?? ""),
    unitType: String(req.body.unitType ?? "Studio"),
    monthlyRent: rent,
    securityDeposit: deposit,
    maxOccupants,
    currentOccupantCount: 0,
    electricityBillingMethod: String(req.body.electricityBillingMethod ?? "Metered"),
    waterBillingMethod: String(req.body.waterBillingMethod ?? "Metered"),
    status: String(req.body.status ?? "Vacant"),
    tenantName: "",
    description: String(req.body.description ?? ""),
    notes: String(req.body.notes ?? "")
  };
  seed.units.push(unit);
  void saveSeedDoc("units", unit.id, unit);
  res.status(201).json(unitWorkspace(unit));
});
app.get("/api/units/:unitId/workspace", (req, res) => {
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.params.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  const floor = seed.floors.find((item) => item.id === unit.floorId);
  const property = seed.properties.find((item) => item.id === unit.propertyId);
  res.json({ property, floor, unit: unitWorkspace(unit), activity: seed.auditLogs.filter((item) => item.landlordId === unit.landlordId) });
});
app.get("/api/units/:unitId/overview", (req, res) => {
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.params.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  res.json(unitWorkspace(unit));
});
app.get("/api/units/:unitId/tenants", (req, res) => res.json(seed.tenants.filter((item) => item.unitId === req.params.unitId && landlordScoped(req, [item]).length)));
app.get("/api/units/:unitId/leases", (req, res) => res.json(seed.leases.filter((item) => item.unitId === req.params.unitId && landlordScoped(req, [item]).length)));
app.get("/api/units/:unitId/bills", (req, res) => res.json(seed.billing.filter((item) => item.unitId === req.params.unitId && landlordScoped(req, [item]).length)));
app.get("/api/units/:unitId/electricity", (req, res) => res.json(seed.electricity.filter((item) => item.unitId === req.params.unitId && landlordScoped(req, [item]).length)));
app.get("/api/units/:unitId/water", (req, res) => res.json(seed.water.filter((item) => item.unitId === req.params.unitId && landlordScoped(req, [item]).length)));
app.get("/api/units/:unitId/payments", (req, res) => {
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.params.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  res.json(seed.payments.filter((item) => item.propertyId === unit.propertyId && item.unitNumber === unit.unitNumber));
});
app.get("/api/units/:unitId/activity", (req, res) => {
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.params.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  res.json(seed.auditLogs.filter((item) => item.landlordId === unit.landlordId));
});
app.get("/api/tenants", (req, res) => res.json(landlordScoped(req, seed.tenants)));
app.get("/api/leases", (req, res) => res.json(landlordScoped(req, seed.leases)));
app.get("/api/billing", (req, res) => res.json(landlordScoped(req, seed.billing)));
app.get("/api/electricity/readings", (req, res) => res.json(landlordScoped(req, seed.electricity)));
app.get("/api/water/readings", (req, res) => res.json(landlordScoped(req, seed.water)));
app.get("/api/payments", (req, res) => res.json(landlordScoped(req, seed.payments)));
app.get("/api/reports", (req, res) => res.json({ reports: seed.reports, rows: landlordScoped(req, seed.billing) }));
app.get("/api/notifications", (req, res) => res.json(landlordScoped(req, seed.notifications)));
app.get("/api/theme", (req, res) => {
  const ctx = getContext(req);
  res.json(seed.themes.find((item) => item.landlordId === ctx.landlordId) ?? seed.themes[0]);
});
app.patch("/api/theme", (req, res) => {
  const ctx = getContext(req);
  const theme = seed.themes.find((item) => item.landlordId === ctx.landlordId);
  if (!theme) return res.status(404).json({ message: "Theme not found" });
  Object.assign(theme, req.body);
  void saveSeedDoc("themes", theme.landlordId, theme);
  res.json(theme);
});
app.get("/api/audit-logs", (req, res) => res.json(landlordScoped(req, seed.auditLogs)));
app.get("/api/settings", (_req, res) => res.json(seed.settings));

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

await loadSeedFromFirestore();

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
