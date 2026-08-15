import "dotenv/config";
import { seedFirestore } from "./firestoreStore.js";

await seedFirestore();

console.log("Firestore seed complete for boarding-housems.");
