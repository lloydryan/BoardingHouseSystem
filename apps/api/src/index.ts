import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { seed } from "./seed.js";
import { loadSeedFromFirestore, saveSeedDoc, saveSeedDocs } from "./firestoreStore.js";
import { getFirebaseAuth } from "./firebaseAdmin.js";

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
  const user = (req as any).user;
  if (!user) return { role: "LANDLORD" as Role, landlordId: seed.landlords[0].id, user: seed.users[1] };
  return { role: user.role as Role, landlordId: user.landlordId, user };
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });

  let user: any;
  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    user = seed.users.find((item) => item.id === decodedToken.uid || item.email.toLowerCase() === decodedToken.email?.toLowerCase());
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  if (!user) return res.status(401).json({ message: "Authentication required" });
  (req as any).user = user;
  next();
}

function requireRole(...roles: Role[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ctx = getContext(req);
    if (!roles.includes(ctx.role)) return res.status(403).json({ message: "You do not have permission to access this resource" });
    next();
  };
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

function propertyName(propertyId: string) {
  return seed.properties.find((item) => item.id === propertyId)?.name ?? "";
}

function tenantName(tenantId: string) {
  return seed.tenants.find((item) => item.id === tenantId)?.fullName ?? "";
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "boarding-house-api", time: new Date().toISOString() });
});

app.use("/api", requireAuth);

app.get("/api/auth/me", (req, res) => {
  const ctx = getContext(req);
  res.json({ user: publicUser(ctx.user), landlord: seed.landlords.find((item) => item.id === ctx.landlordId) });
});

app.patch("/api/account", (req, res) => {
  const ctx = getContext(req);
  ctx.user.fullName = req.body.fullName ?? ctx.user.fullName;
  ctx.user.email = req.body.email ?? ctx.user.email;
  void saveSeedDoc("users", ctx.user.id, ctx.user);

  const landlord = seed.landlords.find((item) => item.id === ctx.landlordId);
  if (landlord) {
    landlord.fullName = req.body.fullName ?? landlord.fullName;
    landlord.businessName = req.body.businessName ?? landlord.businessName;
    landlord.email = req.body.email ?? landlord.email;
    landlord.contactNumber = req.body.contactNumber ?? landlord.contactNumber;
    void saveSeedDoc("landlords", landlord.id, landlord);
  }

  res.json({ user: publicUser(ctx.user), landlord });
});

app.get("/api/admin/dashboard", requireRole("SUPER_ADMIN"), (_req, res) => {
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

app.get("/api/admin/landlords", requireRole("SUPER_ADMIN"), (_req, res) => {
  res.json(seed.landlords.map((landlord) => ({ ...landlord, usage: totalsForLandlord(landlord.id) })));
});

async function createOrUpdateAuthUser(email: string, password: string, displayName: string, claims: Record<string, unknown>) {
  const auth = getFirebaseAuth();
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { email, password, displayName, disabled: false });
    await auth.setCustomUserClaims(existing.uid, claims);
    return existing.uid;
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  const created = await auth.createUser({ email, password, displayName, disabled: false });
  await auth.setCustomUserClaims(created.uid, claims);
  return created.uid;
}

app.post("/api/admin/landlords", requireRole("SUPER_ADMIN"), async (req, res) => {
  const id = `landlord-${Date.now()}`;
  const landlord = {
    id,
    fullName: String(req.body.fullName ?? ""),
    businessName: String(req.body.businessName ?? ""),
    email: String(req.body.email ?? "").toLowerCase(),
    contactNumber: String(req.body.contactNumber ?? ""),
    address: String(req.body.address ?? ""),
    status: String(req.body.status ?? "Active"),
    maxProperties: Number(req.body.maxProperties ?? 1),
    currentPropertyCount: 0,
    subscriptionPlan: String(req.body.subscriptionPlan ?? "Starter"),
    subscriptionExpiresAt: String(req.body.subscriptionExpiresAt ?? "2026-12-31"),
    lastLoginAt: "",
    notes: String(req.body.notes ?? "")
  };
  if (!landlord.fullName || !landlord.email || !landlord.businessName) return res.status(400).json({ message: "Name, business, and email are required." });

  const password = String(req.body.demoPassword ?? "password123");
  let userId = "";
  try {
    userId = await createOrUpdateAuthUser(landlord.email, password, landlord.fullName, { role: "LANDLORD", landlordId: id });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Could not create Firebase Auth user." });
  }
  const user = {
    id: userId,
    email: landlord.email,
    fullName: landlord.fullName,
    role: "LANDLORD",
    landlordId: id,
    demoPassword: password
  };
  seed.landlords.push(landlord);
  seed.users.push(user);
  void saveSeedDoc("landlords", landlord.id, landlord);
  void saveSeedDoc("users", user.id, user);
  res.status(201).json({ ...landlord, usage: totalsForLandlord(landlord.id) });
});

app.patch("/api/admin/landlords/:id/status", requireRole("SUPER_ADMIN"), (req, res) => {
  const landlord = seed.landlords.find((item) => item.id === req.params.id);
  if (!landlord) return res.status(404).json({ message: "Landlord not found" });
  landlord.status = req.body.status ?? landlord.status;
  void saveSeedDoc("landlords", landlord.id, landlord);
  res.json(landlord);
});

app.use(
  [
    "/api/dashboard",
    "/api/properties",
    "/api/floors",
    "/api/units",
    "/api/tenants",
    "/api/leases",
    "/api/billing",
    "/api/electricity",
    "/api/water",
    "/api/payments",
    "/api/reports",
    "/api/notifications",
    "/api/theme"
  ],
  requireRole("LANDLORD")
);

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
app.patch("/api/properties/:id", (req, res) => {
  const property = landlordScoped(req, seed.properties).find((item) => item.id === req.params.id);
  if (!property) return res.status(404).json({ message: "Property not found" });
  Object.assign(property, req.body);
  void saveSeedDoc("properties", property.id, property);
  res.json(property);
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
app.patch("/api/units/:unitId", (req, res) => {
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.params.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  const editableUnit = unit as typeof unit & { description?: string; notes?: string };
  Object.assign(editableUnit, {
    unitName: req.body.unitName ?? unit.unitName,
    unitType: req.body.unitType ?? unit.unitType,
    monthlyRent: req.body.monthlyRent !== undefined ? Number(req.body.monthlyRent) : unit.monthlyRent,
    securityDeposit: req.body.securityDeposit !== undefined ? Number(req.body.securityDeposit) : unit.securityDeposit,
    maxOccupants: req.body.maxOccupants !== undefined ? Number(req.body.maxOccupants) : unit.maxOccupants,
    status: req.body.status ?? unit.status,
    description: req.body.description ?? editableUnit.description,
    notes: req.body.notes ?? editableUnit.notes
  });
  void saveSeedDoc("units", unit.id, unit);
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
app.post("/api/tenants", (req, res) => {
  const ctx = getContext(req);
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.body.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  const tenant = {
    id: `tenant-${Date.now()}`,
    landlordId: ctx.landlordId,
    propertyId: unit.propertyId,
    unitId: unit.id,
    fullName: String(req.body.fullName ?? ""),
    email: String(req.body.email ?? ""),
    contactNumber: String(req.body.contactNumber ?? ""),
    emergencyContactName: String(req.body.emergencyContactName ?? ""),
    emergencyContactNumber: String(req.body.emergencyContactNumber ?? ""),
    validIdType: String(req.body.validIdType ?? ""),
    validIdNumber: String(req.body.validIdNumber ?? ""),
    monthlyRent: Number(req.body.monthlyRent ?? unit.monthlyRent),
    moveInDate: String(req.body.moveInDate ?? new Date().toISOString().slice(0, 10)),
    contractEndDate: String(req.body.contractEndDate ?? ""),
    billingDueDay: Number(req.body.billingDueDay ?? 5),
    status: "Active"
  };
  if (!tenant.fullName) return res.status(400).json({ message: "Tenant name is required." });
  unit.status = "Occupied";
  unit.currentOccupantCount = Math.min(unit.maxOccupants, Number(unit.currentOccupantCount ?? 0) + 1);
  unit.tenantName = [unit.tenantName, tenant.fullName].filter(Boolean).join(", ");
  seed.tenants.push(tenant);
  void saveSeedDoc("tenants", tenant.id, tenant);
  void saveSeedDoc("units", unit.id, unit);
  res.status(201).json(tenant);
});
app.patch("/api/tenants/:id/move-out", (req, res) => {
  const tenant = landlordScoped(req, seed.tenants).find((item) => item.id === req.params.id);
  if (!tenant) return res.status(404).json({ message: "Tenant not found" });
  tenant.status = "Moved Out";
  const unit = seed.units.find((item) => item.id === tenant.unitId);
  if (unit) {
    unit.currentOccupantCount = Math.max(0, Number(unit.currentOccupantCount ?? 0) - 1);
    unit.status = unit.currentOccupantCount > 0 ? "Occupied" : "Vacant";
    unit.tenantName = seed.tenants.filter((item) => item.unitId === unit.id && item.id !== tenant.id && item.status === "Active").map((item) => item.fullName).join(", ");
    void saveSeedDoc("units", unit.id, unit);
  }
  void saveSeedDoc("tenants", tenant.id, tenant);
  res.json(tenant);
});
app.get("/api/leases", (req, res) => res.json(landlordScoped(req, seed.leases)));
app.get("/api/billing", (req, res) => res.json(landlordScoped(req, seed.billing)));
app.post("/api/billing", (req, res) => {
  const ctx = getContext(req);
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.body.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  const tenant = seed.tenants.find((item) => item.unitId === unit.id && item.status === "Active");
  const monthlyRent = Number(req.body.monthlyRent ?? unit.monthlyRent);
  const electricityCharge = Number(req.body.electricityCharge ?? 0);
  const waterCharge = Number(req.body.waterCharge ?? 0);
  const previousBalance = Number(req.body.previousBalance ?? 0);
  const penalty = Number(req.body.penalty ?? 0);
  const otherCharges = Number(req.body.otherCharges ?? 0);
  const discount = Number(req.body.discount ?? 0);
  const totalAmountDue = monthlyRent + electricityCharge + waterCharge + previousBalance + penalty + otherCharges - discount;
  const bill = {
    id: `bill-${Date.now()}`,
    landlordId: ctx.landlordId,
    tenantId: tenant?.id ?? "",
    tenantName: tenant?.fullName ?? unit.tenantName ?? "",
    propertyId: unit.propertyId,
    propertyName: propertyName(unit.propertyId),
    unitId: unit.id,
    unitNumber: unit.unitNumber,
    billingPeriod: String(req.body.billingPeriod ?? currentPeriod()),
    monthlyRent,
    electricityCharge,
    waterCharge,
    previousBalance,
    penalty,
    otherCharges,
    discount,
    totalAmountDue,
    amountPaid: 0,
    remainingBalance: totalAmountDue,
    dueDate: String(req.body.dueDate ?? new Date().toISOString().slice(0, 10)),
    status: "Unpaid"
  };
  seed.billing.push(bill);
  void saveSeedDoc("billing", bill.id, bill);
  res.status(201).json(bill);
});
app.post("/api/billing/generate-batch", (req, res) => {
  const ctx = getContext(req);
  const period = String(req.body.billingPeriod ?? currentPeriod());
  const bills = landlordScoped(req, seed.units)
    .filter((unit) => unit.status === "Occupied" && !seed.billing.some((bill) => bill.unitId === unit.id && bill.billingPeriod === period))
    .map((unit) => {
      const tenant = seed.tenants.find((item) => item.unitId === unit.id && item.status === "Active");
      const monthlyRent = Number(unit.monthlyRent ?? 0);
      return {
        id: `bill-${unit.id}-${period}`,
        landlordId: ctx.landlordId,
        tenantId: tenant?.id ?? "",
        tenantName: tenant?.fullName ?? unit.tenantName ?? "",
        propertyId: unit.propertyId,
        propertyName: propertyName(unit.propertyId),
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        billingPeriod: period,
        monthlyRent,
        electricityCharge: 0,
        waterCharge: 0,
        previousBalance: 0,
        penalty: 0,
        otherCharges: 0,
        discount: 0,
        totalAmountDue: monthlyRent,
        amountPaid: 0,
        remainingBalance: monthlyRent,
        dueDate: String(req.body.dueDate ?? new Date().toISOString().slice(0, 10)),
        status: "Unpaid"
      };
    });
  seed.billing.push(...bills);
  void saveSeedDocs("billing", bills);
  res.status(201).json(bills);
});
app.get("/api/electricity/readings", (req, res) => res.json(landlordScoped(req, seed.electricity)));
app.post("/api/electricity/readings", (req, res) => {
  const ctx = getContext(req);
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.body.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  const previousReading = Number(req.body.previousReading ?? 0);
  const currentReading = Number(req.body.currentReading ?? previousReading);
  const consumption = Math.max(0, currentReading - previousReading);
  const ratePerUnit = Number(req.body.ratePerUnit ?? 0);
  const fixedCharge = Number(req.body.fixedCharge ?? 0);
  const reading = {
    id: `elec-${Date.now()}`,
    landlordId: ctx.landlordId,
    propertyId: unit.propertyId,
    unitId: unit.id,
    tenantName: unit.tenantName,
    billingMonth: String(req.body.billingMonth ?? currentPeriod()),
    previousReading,
    currentReading,
    consumption,
    ratePerUnit,
    fixedCharge,
    amount: Number(req.body.amount ?? consumption * ratePerUnit + fixedCharge),
    readingDate: String(req.body.readingDate ?? new Date().toISOString().slice(0, 10)),
    recordedBy: ctx.user.fullName
  };
  seed.electricity.push(reading);
  void saveSeedDoc("electricity", reading.id, reading);
  res.status(201).json(reading);
});
app.get("/api/water/readings", (req, res) => res.json(landlordScoped(req, seed.water)));
app.post("/api/water/readings", (req, res) => {
  const ctx = getContext(req);
  const unit = landlordScoped(req, seed.units).find((item) => item.id === req.body.unitId);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  const previousReading = Number(req.body.previousReading ?? 0);
  const currentReading = Number(req.body.currentReading ?? previousReading);
  const consumption = Math.max(0, currentReading - previousReading);
  const ratePerUnit = Number(req.body.ratePerUnit ?? 0);
  const amount = Number(req.body.amount ?? consumption * ratePerUnit);
  const reading = {
    id: `water-${Date.now()}`,
    landlordId: ctx.landlordId,
    propertyId: unit.propertyId,
    unitId: unit.id,
    tenantName: unit.tenantName,
    billingMonth: String(req.body.billingMonth ?? currentPeriod()),
    previousReading,
    currentReading,
    consumption,
    ratePerUnit,
    fixedCharge: Number(req.body.fixedCharge ?? 0),
    totalPropertyBill: Number(req.body.totalPropertyBill ?? 0),
    occupiedUnitCount: req.body.occupiedUnitCount ? Number(req.body.occupiedUnitCount) : null,
    amount,
    calculationNote: String(req.body.calculationNote ?? `${consumption} x ${ratePerUnit}`),
    readingDate: String(req.body.readingDate ?? new Date().toISOString().slice(0, 10))
  };
  seed.water.push(reading);
  void saveSeedDoc("water", reading.id, reading);
  res.status(201).json(reading);
});
app.get("/api/payments", (req, res) => res.json(landlordScoped(req, seed.payments)));
app.post("/api/payments", (req, res) => {
  const ctx = getContext(req);
  const bill = landlordScoped(req, seed.billing).find((item) => item.id === req.body.billId);
  if (!bill) return res.status(404).json({ message: "Bill not found" });
  const amountPaid = Number(req.body.amountPaid ?? 0);
  const payment = {
    id: `pay-${Date.now()}`,
    landlordId: ctx.landlordId,
    officialReceiptNo: String(req.body.officialReceiptNo ?? `OR-${Date.now().toString().slice(-6)}`),
    tenantName: bill.tenantName,
    propertyId: bill.propertyId,
    propertyName: bill.propertyName,
    unitNumber: bill.unitNumber,
    billingStatement: bill.billingPeriod,
    paymentDate: String(req.body.paymentDate ?? new Date().toISOString().slice(0, 10)),
    amountPaid,
    paymentMethod: String(req.body.paymentMethod ?? "Cash"),
    referenceNumber: String(req.body.referenceNumber ?? ""),
    receivedBy: ctx.user.fullName,
    status: "Confirmed"
  };
  bill.amountPaid += amountPaid;
  bill.remainingBalance = Math.max(0, bill.totalAmountDue - bill.amountPaid);
  bill.status = bill.remainingBalance === 0 ? "Paid" : "Partially Paid";
  seed.payments.push(payment);
  void saveSeedDoc("payments", payment.id, payment);
  void saveSeedDoc("billing", bill.id, bill);
  res.status(201).json(payment);
});
app.patch("/api/payments/:id/reverse", (req, res) => {
  const payment = landlordScoped(req, seed.payments).find((item) => item.id === req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  payment.status = "Reversed";
  const bill = seed.billing.find((item) => item.propertyId === payment.propertyId && item.unitNumber === payment.unitNumber && item.billingPeriod === payment.billingStatement);
  if (bill) {
    bill.amountPaid = Math.max(0, bill.amountPaid - payment.amountPaid);
    bill.remainingBalance = bill.totalAmountDue - bill.amountPaid;
    bill.status = bill.amountPaid === 0 ? "Unpaid" : "Partially Paid";
    void saveSeedDoc("billing", bill.id, bill);
  }
  void saveSeedDoc("payments", payment.id, payment);
  res.json(payment);
});
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
app.get("/api/settings", requireRole("SUPER_ADMIN"), (_req, res) => res.json(seed.settings));
app.patch("/api/settings", requireRole("SUPER_ADMIN"), (req, res) => {
  const updates = Array.isArray(req.body) ? req.body : Object.entries(req.body ?? {}).map(([key, value]) => ({ key, value }));
  for (const update of updates) {
    const setting = seed.settings.find((item) => item.key === update.key);
    if (setting) setting.value = update.value;
  }
  void saveSeedDocs("settings", seed.settings.map((item: any) => ({ ...item, id: item.key })));
  res.json(seed.settings);
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

await loadSeedFromFirestore();

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
