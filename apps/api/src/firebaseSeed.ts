import "dotenv/config";
import { seedFirestore } from "./firestoreStore.js";

try {
  await seedFirestore();

  console.log("Firestore seed complete for boarding-housems.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Firestore seed failed.");
  console.error(message);
  console.error("If the error is NOT_FOUND, create the Cloud Firestore database in Firebase Console first, then run this command again.");
  console.error("If the error is PERMISSION_DENIED, grant the service account Cloud Datastore User or Firebase Admin permissions in Google Cloud IAM.");
  process.exitCode = 1;
}
