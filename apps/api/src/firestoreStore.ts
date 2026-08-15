import { getDb, isFirestoreEnabled } from "./firebaseAdmin.js";
import { seed } from "./seed.js";
import { randomUUID } from "node:crypto";

export const firestoreCollections = [
  "users",
  "landlords",
  "properties",
  "floors",
  "units",
  "tenants",
  "leases",
  "billing",
  "electricity",
  "water",
  "payments",
  "notifications",
  "themes",
  "auditLogs",
  "reports",
  "settings"
] as const;

export type FirestoreCollection = (typeof firestoreCollections)[number];

function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, withoutUndefined(entryValue)])
  );
}

export async function loadSeedFromFirestore() {
  if (!isFirestoreEnabled()) return;

  const db = getDb();
  for (const collectionName of firestoreCollections) {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) continue;

    if (collectionName === "reports") {
      seed.reports = snapshot.docs.map((doc) => String(doc.data().title ?? doc.id));
      continue;
    }

    (seed as any)[collectionName] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  const charts = await db.collection("meta").doc("charts").get();
  if (charts.exists) {
    const chartData = charts.data() ?? {};
    if (chartData.landlordCharts) seed.landlordCharts = chartData.landlordCharts as typeof seed.landlordCharts;
    if (chartData.platformCharts) seed.platformCharts = chartData.platformCharts as typeof seed.platformCharts;
  }
}

export async function saveSeedDoc(collectionName: FirestoreCollection, id: string, value: unknown) {
  if (!isFirestoreEnabled() || process.env.FIRESTORE_WRITE_THROUGH !== "true") return;
  await getDb().collection(collectionName).doc(id).set(withoutUndefined(value) as Record<string, unknown>, { merge: true });
}

export async function seedFirestore() {
  const db = getDb();
  const batchSize = 450;
  const pendingWrites: Array<Promise<FirebaseFirestore.WriteResult[]>> = [];
  let batch = db.batch();
  let operationCount = 0;

  const commitWhenFull = () => {
    if (operationCount < batchSize) return;
    pendingWrites.push(batch.commit());
    batch = db.batch();
    operationCount = 0;
  };

  for (const collectionName of firestoreCollections) {
    const records = (seed as any)[collectionName] as Array<Record<string, unknown> | string>;
    for (const record of records) {
      const isPrimitiveReport = collectionName === "reports" && typeof record === "string";
      const recordObject = record as Record<string, unknown>;
      const fallbackId = recordObject.landlordId ?? recordObject.key ?? randomUUID();
      const id = isPrimitiveReport
        ? record.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : String(recordObject.id ?? fallbackId);
      const payload = isPrimitiveReport ? { id, title: record } : { ...(record as Record<string, unknown>), id };

      batch.set(db.collection(collectionName).doc(id), withoutUndefined(payload) as Record<string, unknown>);
      operationCount += 1;
      commitWhenFull();
    }
  }

  batch.set(db.collection("meta").doc("charts"), {
    landlordCharts: withoutUndefined(seed.landlordCharts),
    platformCharts: withoutUndefined(seed.platformCharts)
  });
  operationCount += 1;

  if (operationCount) pendingWrites.push(batch.commit());
  await Promise.all(pendingWrites);
}
