import "dotenv/config";
import { getDb } from "./firebaseAdmin.js";
import { firestoreCollections } from "./firestoreStore.js";

try {
  const db = getDb();

  console.log("Verifying Firestore project:", process.env.FIREBASE_PROJECT_ID ?? "boarding-housems");
  console.log("Verifying Firestore database:", process.env.FIRESTORE_DATABASE_ID ?? "(default)");

  for (const collectionName of firestoreCollections) {
    const snapshot = await db.collection(collectionName).count().get();
    console.log(`${collectionName}: ${snapshot.data().count}`);
  }

  const charts = await db.collection("meta").doc("charts").get();
  console.log(`meta/charts: ${charts.exists ? "exists" : "missing"}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Firebase verify failed.");
  console.error(message);
  console.error("Confirm FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or GOOGLE_APPLICATION_CREDENTIALS is set in apps/api/.env.");
  console.error("If the error is PERMISSION_DENIED, grant the service account Cloud Datastore User or Firebase Admin permissions in Google Cloud IAM.");
  process.exitCode = 1;
}
