import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { firebaseAuth, requireDb } from "../config/firebase";

type Method = "GET" | "POST" | "PATCH";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const defaultLandlord = {
  fullName: "BoardHaus Owner",
  businessName: "BoardHaus Property",
  email: "",
  contactNumber: "",
  address: "",
  status: "Active",
  subscriptionPlan: "Growth",
  maxProperties: 5,
  currentPropertyCount: 0,
  subscriptionExpiresAt: "2026-12-31"
};

const defaultTheme = {
  presetName: "BoardHaus Blue",
  primaryColor: "#2563eb",
  secondaryColor: "#334155",
  accentColor: "#0f766e",
  sidebarColor: "#0f172a",
  backgroundColor: "#f8fafc",
  textColor: "#111827",
  darkPrimaryColor: "#60a5fa",
  darkSecondaryColor: "#94a3b8",
  darkAccentColor: "#2dd4bf",
  darkSidebarColor: "#020617",
  darkBackgroundColor: "#020617",
  darkTextColor: "#f8fafc",
  logoUrl: "",
  receiptFooter: "Thank you for your payment."
};

export async function api<T>(path: string): Promise<T> {
  return route<T>("GET", path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return route<T>("POST", path, body);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return route<T>("PATCH", path, body);
}

async function route<T>(method: Method, path: string, body?: any): Promise<T> {
  try {
    const profile = await currentProfile();

    if (path === "/api/auth/me") return profile as T;
    if (path === "/api/dashboard") return dashboard(profile.landlord?.id) as T;
    if (path === "/api/admin/dashboard") return adminDashboard() as T;
    if (path === "/api/admin/landlords") return (method === "POST" ? addLandlord(body) : listDocs("landlords")) as T;
    if (path === "/api/settings") return (method === "PATCH" ? saveSettings(body) : listDocs("settings")) as T;
    if (path === "/api/audit-logs") return listDocs("auditLogs", "createdAt") as T;
    if (path === "/api/properties") return (method === "POST" ? addProperty(body, profile.landlord?.id) : properties(profile.landlord?.id)) as T;
    if (path === "/api/units") return units(profile.landlord?.id) as T;
    if (path === "/api/tenants") return (method === "POST" ? addTenant(body, profile.landlord?.id) : tenants(profile.landlord?.id)) as T;
    if (path === "/api/leases") return leases(profile.landlord?.id) as T;
    if (path === "/api/billing") return (method === "POST" ? addBill(body, profile.landlord?.id) : billings(profile.landlord?.id)) as T;
    if (path === "/api/billing/generate-batch") return generateBills(body, profile.landlord?.id) as T;
    if (path === "/api/payments") return payments(profile.landlord?.id) as T;
    if (path === "/api/notifications") return listScoped("notifications", profile.landlord?.id, "createdAt") as T;
    if (path === "/api/theme") return (method === "PATCH" ? saveTheme(body, profile.landlord?.id) : theme(profile.landlord?.id)) as T;
    if (path === "/api/reports") return reports(profile.landlord?.id) as T;
    if (path === "/api/electricity/readings") return listScoped("electricityReadings", profile.landlord?.id, "readingDate") as T;
    if (path === "/api/water/readings") return listScoped("waterReadings", profile.landlord?.id, "readingDate") as T;
    if (path === "/api/account" && method === "PATCH") return saveAccount(body, profile) as T;

    const propertyMatch = path.match(/^\/api\/properties\/([^/]+)$/);
    if (propertyMatch) return (method === "PATCH" ? updateProperty(propertyMatch[1], body) : propertyDetails(propertyMatch[1])) as T;

    const buildingMatch = path.match(/^\/api\/properties\/([^/]+)\/building$/);
    if (buildingMatch) return building(buildingMatch[1]) as T;

    const floorMatch = path.match(/^\/api\/properties\/([^/]+)\/floors$/);
    if (floorMatch && method === "POST") return addFloor(floorMatch[1], body, profile.landlord?.id) as T;

    const unitMatch = path.match(/^\/api\/floors\/([^/]+)\/units$/);
    if (unitMatch && method === "POST") return addUnit(unitMatch[1], body, profile.landlord?.id) as T;

    const workspaceMatch = path.match(/^\/api\/units\/([^/]+)\/workspace$/);
    if (workspaceMatch) return unitWorkspace(workspaceMatch[1]) as T;

    const landlordStatusMatch = path.match(/^\/api\/admin\/landlords\/([^/]+)\/status$/);
    if (landlordStatusMatch && method === "PATCH") return setLandlordStatus(landlordStatusMatch[1], body?.status) as T;

    throw new ApiError(404, `No Firebase route for ${method} ${path}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, error instanceof Error ? error.message : "Firebase request failed.");
  }
}

async function currentProfile() {
  const db = requireDb();
  const firebaseUser = firebaseAuth?.currentUser;
  const storedUser = readStorage("bh_user");
  const uid = firebaseUser?.uid ?? storedUser?.id;

  if (!uid) throw new ApiError(401, "Please sign in again.");

  const userSnap = await safeGetDoc("users", uid);
  const userData = (userSnap?.exists() ? userSnap.data() : {}) as Record<string, any>;
  const role = (userData.role ?? storedUser?.role ?? "LANDLORD") as "SUPER_ADMIN" | "LANDLORD";
  const landlordId = userData.landlordId ?? storedUser?.landlordId ?? (role === "LANDLORD" ? uid : undefined);
  const user = {
    id: uid,
    email: userData.email ?? firebaseUser?.email ?? storedUser?.email ?? "",
    fullName: userData.fullName ?? userData.displayName ?? firebaseUser?.displayName ?? storedUser?.fullName ?? "BoardHaus User",
    role,
    landlordId
  };

  if (role === "SUPER_ADMIN") return { user };

  const landlord = await ensureLandlord(landlordId, user);
  return { user, landlord };
}

async function ensureLandlord(id: string, user: any) {
  const db = requireDb();
  const ref = doc(db, "landlords", id);
  const snap = await safeGetDoc("landlords", id);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const landlord = {
    ...defaultLandlord,
    fullName: user.fullName,
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(ref, landlord);
    await setDoc(doc(db, "themes", id), { landlordId: id, ...defaultTheme, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    return { id, ...landlord };
  }

  return { id, ...landlord };
}

async function listDocs(name: string, orderField?: string) {
  const db = requireDb();
  const ref = collection(db, name);
  const snap = await getDocs(orderField ? query(ref, orderBy(orderField, "desc")) : ref);
  return snap.docs.map(fromSnap);
}

async function listScoped(name: string, landlordId?: string, orderField?: string) {
  const db = requireDb();
  const ref = collection(db, name);
  const snap = await getDocs(query(ref, where("landlordId", "==", landlordId ?? "")));
  const rows = snap.docs.map(fromSnap);
  return orderField ? sortRows(rows, orderField, "desc") : rows;
}

async function properties(landlordId?: string) {
  const rows = await listScoped("properties", landlordId);
  return Promise.all(rows.map(async (property) => ({ ...property, ...(await propertyStats(property.id)) })));
}

async function propertyDetails(id: string) {
  const snap = await getDoc(doc(requireDb(), "properties", id));
  if (!snap.exists()) throw new ApiError(404, "Property not found.");
  return { id: snap.id, ...snap.data(), ...(await propertyStats(snap.id)), floors: await floors(id) };
}

async function building(propertyId: string) {
  return { property: await propertyDetails(propertyId), floors: await floors(propertyId) };
}

async function floors(propertyId: string) {
  const db = requireDb();
  const snap = await getDocs(query(collection(db, "floors"), where("propertyId", "==", propertyId)));
  const sorted = sortRows(snap.docs.map(fromSnap), "displayOrder", "asc");
  return Promise.all(sorted.map(async (floor) => {
    const floorUnits = await unitsByFloor(floor.id);
    return { ...floor, units: floorUnits, summary: floorSummary(floorUnits) };
  }));
}

async function unitsByFloor(floorId: string) {
  const snap = await getDocs(query(collection(requireDb(), "units"), where("floorId", "==", floorId)));
  return sortRows(snap.docs.map(fromSnap), "unitNumber", "asc").map(normalizeUnit);
}

async function units(landlordId?: string) {
  const rows = await listScoped("units", landlordId);
  const floorRows = await listScoped("floors", landlordId);
  const floorMap = new Map(floorRows.map((floor) => [floor.id, floor.name]));
  return rows.map((item) => ({ ...normalizeUnit(item), floor: floorMap.get(item.floorId) ?? "" }));
}

async function tenants(landlordId?: string) {
  return listScoped("tenants", landlordId);
}

async function leases(landlordId?: string) {
  const tenantRows = await tenants(landlordId);
  const unitRows = await units(landlordId);
  return tenantRows.map((item) => {
    const unit = unitRows.find((row) => row.id === item.unitId);
    return { tenantName: item.fullName, unitNumber: unit?.unitNumber ?? "", startDate: item.moveInDate, endDate: item.contractEndDate, status: item.status };
  });
}

async function billings(landlordId?: string) {
  return listScoped("billings", landlordId, "billingPeriod");
}

async function payments(landlordId?: string) {
  const rows = await listScoped("payments", landlordId, "paymentDate");
  if (rows.length) return rows;
  const bills = await billings(landlordId);
  return bills.filter((item) => Number(item.amountPaid) > 0).map((item, index) => ({
    id: `payment-${item.id}`,
    officialReceiptNo: `OR-${new Date().getFullYear()}-${index + 1}`,
    tenantName: item.tenantName,
    paymentDate: item.paymentDate ?? "",
    amountPaid: Number(item.amountPaid) || 0,
    status: "Posted"
  }));
}

async function dashboard(landlordId?: string) {
  const propertyRows = await properties(landlordId);
  const unitRows = await units(landlordId);
  const tenantRows = await tenants(landlordId);
  const bills = await billings(landlordId);
  const expectedMonthlyRent = unitRows.reduce((sum, item) => sum + Number(item.monthlyRent || 0), 0);
  const collectedThisMonth = bills.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
  const outstandingBalance = bills.reduce((sum, item) => sum + Number(item.remainingBalance || 0), 0);

  return {
    totals: {
      totalProperties: propertyRows.length,
      totalUnits: unitRows.length,
      occupiedUnits: unitRows.filter((item) => item.status === "Occupied").length,
      vacantUnits: unitRows.filter((item) => item.status === "Vacant").length,
      activeTenants: tenantRows.filter((item) => item.status !== "Inactive").length,
      expectedMonthlyRent,
      collectedThisMonth,
      outstandingBalance
    },
    charts: {
      collections: [{ month: new Date().toLocaleString("en", { month: "short" }), expected: expectedMonthlyRent, collected: collectedThisMonth }],
      occupancy: [
        { name: "Occupied", value: unitRows.filter((item) => item.status === "Occupied").length },
        { name: "Vacant", value: unitRows.filter((item) => item.status === "Vacant").length },
        { name: "Other", value: unitRows.filter((item) => !["Occupied", "Vacant"].includes(item.status)).length }
      ]
    },
    recentPayments: (await payments(landlordId)).slice(0, 5)
  };
}

async function adminDashboard() {
  const landlordRows = await listDocs("landlords");
  const propertyRows = await listDocs("properties");
  const unitRows = await listDocs("units");
  const tenantRows = await listDocs("tenants");
  return {
    totals: {
      totalLandlords: landlordRows.length,
      activeLandlords: landlordRows.filter((item) => item.status === "Active").length,
      suspendedLandlords: landlordRows.filter((item) => item.status === "Suspended").length,
      totalProperties: propertyRows.length,
      totalUnits: unitRows.length,
      totalTenants: tenantRows.length
    },
    charts: {
      registrations: [{ month: new Date().toLocaleString("en", { month: "short" }), landlords: landlordRows.length }],
      plans: [{ name: "Growth", value: landlordRows.filter((item) => item.subscriptionPlan === "Growth").length }]
    },
    landlords: landlordRows
  };
}

async function reports(landlordId?: string) {
  return { reports: ["Collections", "Occupancy", "Utilities"], rows: await billings(landlordId) };
}

async function theme(landlordId?: string) {
  const id = landlordId ?? "global";
  const snap = await safeGetDoc("themes", id);
  return snap.exists() ? { id: snap.id, ...snap.data() } : { id, landlordId, ...defaultTheme };
}

async function saveTheme(body: any, landlordId?: string) {
  const id = landlordId ?? "global";
  await setDoc(doc(requireDb(), "themes", id), { landlordId, ...body, updatedAt: serverTimestamp() }, { merge: true });
  return theme(landlordId);
}

async function saveSettings(body: any) {
  await Promise.all(Object.entries(body).map(([key, value]) => setDoc(doc(requireDb(), "settings", key), { key, value, updatedAt: serverTimestamp() }, { merge: true })));
  return listDocs("settings");
}

async function saveAccount(body: any, profile: any) {
  const db = requireDb();
  await setDoc(doc(db, "users", profile.user.id), { ...body, updatedAt: serverTimestamp() }, { merge: true });
  if (profile.landlord?.id) await setDoc(doc(db, "landlords", profile.landlord.id), { ...body, updatedAt: serverTimestamp() }, { merge: true });
  return currentProfile();
}

async function addLandlord(body: any) {
  const ref = await addDoc(collection(requireDb(), "landlords"), {
    ...defaultLandlord,
    ...body,
    currentPropertyCount: 0,
    usage: { totalUnits: 0, activeTenants: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: ref.id, ...(await readDoc("landlords", ref.id)) };
}

async function setLandlordStatus(id: string, status: string) {
  await updateDoc(doc(requireDb(), "landlords", id), { status, updatedAt: serverTimestamp() });
  return readDoc("landlords", id);
}

async function addProperty(body: any, landlordId?: string) {
  const ref = await addDoc(collection(requireDb(), "properties"), {
    ...body,
    landlordId,
    status: "Active",
    totalUnits: 0,
    occupiedUnits: 0,
    buildingViewTemplate: body.buildingViewTemplate ?? "modern-apartment",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return propertyDetails(ref.id);
}

async function updateProperty(id: string, body: any) {
  await updateDoc(doc(requireDb(), "properties", id), { ...body, updatedAt: serverTimestamp() });
  return propertyDetails(id);
}

async function addFloor(propertyId: string, body: any, landlordId?: string) {
  const ref = await addDoc(collection(requireDb(), "floors"), {
    ...body,
    landlordId,
    propertyId,
    floorNumber: Number(body.floorNumber ?? 0),
    displayOrder: Number(body.displayOrder || body.floorNumber || 0),
    status: body.status ?? "Active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: ref.id, ...(await readDoc("floors", ref.id)) };
}

async function addUnit(floorId: string, body: any, landlordId?: string) {
  const floor = await readDoc("floors", floorId);
  const ref = await addDoc(collection(requireDb(), "units"), normalizeUnit({
    ...body,
    landlordId,
    floorId,
    propertyId: floor.propertyId,
    monthlyRent: Number(body.monthlyRent ?? 0),
    securityDeposit: Number(body.securityDeposit ?? 0),
    maxOccupants: Number(body.maxOccupants ?? 1),
    occupancy: 0,
    outstandingBalance: 0,
    status: body.status ?? "Vacant",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));
  return { id: ref.id, ...(await readDoc("units", ref.id)) };
}

async function addTenant(body: any, landlordId?: string) {
  const unit = await readDoc("units", body.unitId);
  const ref = await addDoc(collection(requireDb(), "tenants"), {
    ...body,
    landlordId,
    propertyId: unit.propertyId,
    monthlyRent: Number(body.monthlyRent || unit.monthlyRent || 0),
    billingDueDay: Number(body.billingDueDay ?? 5),
    contractEndDate: body.contractEndDate ?? "",
    status: "Active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(doc(requireDb(), "units", body.unitId), {
    status: "Occupied",
    occupancy: Math.max(Number(unit.occupancy ?? 0), 1),
    primaryTenant: body.fullName,
    updatedAt: serverTimestamp()
  });
  return { id: ref.id, ...(await readDoc("tenants", ref.id)) };
}

async function addBill(body: any, landlordId?: string) {
  const unit = await readDoc("units", body.unitId);
  const tenantRows = await tenants(landlordId);
  const tenant = tenantRows.find((item) => item.unitId === body.unitId || item.fullName === unit.primaryTenant);
  const totalAmountDue = Number(body.monthlyRent || unit.monthlyRent || 0) + Number(body.electricityCharge || 0) + Number(body.waterCharge || 0);
  const ref = await addDoc(collection(requireDb(), "billings"), {
    ...body,
    landlordId,
    propertyId: unit.propertyId,
    tenantId: tenant?.id ?? "",
    tenantName: tenant?.fullName ?? unit.primaryTenant ?? "",
    unitNumber: unit.unitNumber,
    propertyName: "",
    monthlyRent: Number(body.monthlyRent || unit.monthlyRent || 0),
    electricityCharge: Number(body.electricityCharge || 0),
    waterCharge: Number(body.waterCharge || 0),
    totalAmountDue,
    amountPaid: Number(body.amountPaid || 0),
    remainingBalance: totalAmountDue - Number(body.amountPaid || 0),
    status: Number(body.amountPaid || 0) >= totalAmountDue ? "Paid" : "Unpaid",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: ref.id, ...(await readDoc("billings", ref.id)) };
}

async function generateBills(body: any, landlordId?: string) {
  const unitRows = (await units(landlordId)).filter((item) => item.status === "Occupied");
  return Promise.all(unitRows.map((unit) => addBill({ ...body, unitId: unit.id, monthlyRent: unit.monthlyRent }, landlordId)));
}

async function unitWorkspace(id: string) {
  const unit = normalizeUnit(await readDoc("units", id));
  const property = await propertyDetails(unit.propertyId);
  const floor = await readDoc("floors", unit.floorId);
  const tenantRows = (await tenants(unit.landlordId)).filter((item) => item.unitId === id || item.fullName === unit.primaryTenant);
  return {
    property,
    floor,
    unit: {
      ...unit,
      tenants: tenantRows,
      billings: (await billings(unit.landlordId)).filter((item) => item.unitId === id || item.unitNumber === unit.unitNumber),
      payments: (await payments(unit.landlordId)).filter((item) => item.unitId === id),
      electricityReadings: (await listScoped("electricityReadings", unit.landlordId)).filter((item) => item.unitId === id),
      waterReadings: (await listScoped("waterReadings", unit.landlordId)).filter((item) => item.unitId === id)
    }
  };
}

async function propertyStats(propertyId: string) {
  const floorRows = await floors(propertyId);
  const unitRows = floorRows.flatMap((floor) => floor.units);
  const monthlyExpectedRent = unitRows.reduce((sum, item) => sum + Number(item.monthlyRent || 0), 0);
  const outstanding = unitRows.reduce((sum, item) => sum + Number(item.outstandingBalance || 0), 0);
  return {
    totalUnits: unitRows.length,
    occupiedUnits: unitRows.filter((item) => item.status === "Occupied").length,
    monthlyExpectedRent,
    collectedThisMonth: monthlyExpectedRent - outstanding,
    outstanding
  };
}

function normalizeUnit(unit: any) {
  const maxOccupants = Number(unit.maxOccupants ?? unit.maximumOccupants ?? 1);
  return {
    ...unit,
    monthlyRent: Number(unit.monthlyRent ?? 0),
    occupancy: Number(unit.occupancy ?? unit.currentOccupantCount ?? 0),
    maxOccupants,
    maximumOccupants: maxOccupants,
    currentOccupantCount: Number(unit.currentOccupantCount ?? unit.occupancy ?? 0),
    outstandingBalance: Number(unit.outstandingBalance ?? 0),
    primaryTenant: unit.primaryTenant ?? unit.tenantName ?? "",
    billingStatus: unit.billingStatus ?? "Current",
    electricityStatus: unit.electricityStatus ?? "Current",
    waterStatus: unit.waterStatus ?? "Current"
  };
}

function floorSummary(units: any[]) {
  return {
    totalUnits: units.length,
    occupiedUnits: units.filter((item) => item.status === "Occupied").length,
    vacantUnits: units.filter((item) => item.status === "Vacant").length,
    reservedUnits: units.filter((item) => item.status === "Reserved").length,
    maintenanceUnits: units.filter((item) => item.status === "Under Maintenance").length,
    expectedRent: units.reduce((sum, item) => sum + Number(item.monthlyRent || 0), 0),
    collected: units.reduce((sum, item) => sum + Number(item.monthlyRent || 0) - Number(item.outstandingBalance || 0), 0),
    outstanding: units.reduce((sum, item) => sum + Number(item.outstandingBalance || 0), 0)
  };
}

async function readDoc(name: string, id: string) {
  const snap = await getDoc(doc(requireDb(), name, id));
  if (!snap.exists()) throw new ApiError(404, `${name} record not found.`);
  return fromSnap(snap);
}

async function safeGetDoc(name: string, id: string) {
  try {
    return await getDoc(doc(requireDb(), name, id));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
    if (code === "permission-denied") {
      return { id, exists: () => false, data: () => ({}) };
    }
    throw error;
  }
}

function fromSnap(snap: any) {
  return { id: snap.id, ...snap.data() };
}

function readStorage(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function sortRows(rows: any[], field: string, direction: "asc" | "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = sortableValue(a[field]);
    const right = sortableValue(b[field]);
    if (left < right) return -1 * sign;
    if (left > right) return 1 * sign;
    return 0;
  });
}

function sortableValue(value: any) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "number") return value;
  return String(value ?? "");
}

export function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}
